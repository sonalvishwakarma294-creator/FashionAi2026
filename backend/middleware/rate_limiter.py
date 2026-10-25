"""
rate_limiter.py – Configurable rate limiting for Fashion Pro API.

Tier layout
-----------
AUTH        – login, register, password-reset (strictest, per-IP + per-account)
PUBLIC      – unauthenticated read-only endpoints (moderate)
AUTHED      – authenticated user actions (loosest)

All thresholds are read from environment variables so they can be tuned
without touching code.  Exponential-backoff windows are tracked in memory
(Flask-Limiter's default memory backend) – swap to Redis by setting
RATELIMIT_STORAGE_URI in the environment.

Exponential backoff for auth routes
-------------------------------------
A lightweight in-memory tracker records consecutive failures per IP and
per account.  On each additional failure the lockout window doubles up to
a configurable ceiling (AUTH_BACKOFF_MAX_SECONDS).  Users are *never*
permanently locked out; they are only slowed down.
"""

import os
import time
import logging
import threading
from flask import request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers to read typed env vars with defaults
# ---------------------------------------------------------------------------

def _int(name, default):
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _str(name, default):
    return os.environ.get(name, default)


# ---------------------------------------------------------------------------
# Rate-limit strings  (all overridable via env)
# ---------------------------------------------------------------------------
# Auth endpoints — per-IP
AUTH_IP_LIMIT = _str("RATE_AUTH_IP", "10 per minute; 30 per hour")
# Auth endpoints — per account (email key)
AUTH_ACCT_LIMIT = _str("RATE_AUTH_ACCT", "5 per minute; 20 per hour")
# Public unauthenticated endpoints
PUBLIC_LIMIT = _str("RATE_PUBLIC", "60 per minute; 500 per hour")
# Authenticated user actions
AUTHED_LIMIT = _str("RATE_AUTHED", "120 per minute; 2000 per hour")

# Backoff parameters
BACKOFF_BASE_SECONDS = _int("AUTH_BACKOFF_BASE_SECONDS", 2)
BACKOFF_MAX_SECONDS = _int("AUTH_BACKOFF_MAX_SECONDS", 3600)   # 1 h ceiling


# ---------------------------------------------------------------------------
# Flask-Limiter instance
# ---------------------------------------------------------------------------

def _get_key():
    """Primary key for Flask-Limiter: remote IP."""
    return get_remote_address()


limiter = Limiter(
    key_func=_get_key,
    default_limits=[PUBLIC_LIMIT],
    storage_uri=_str("RATELIMIT_STORAGE_URI", "memory://"),
    strategy="fixed-window",
    headers_enabled=True,           # adds X-RateLimit-* headers
)


# ---------------------------------------------------------------------------
# Convenience decorators
# ---------------------------------------------------------------------------

def auth_limit():
    """Apply strict auth-tier rate limit (per-IP) to a route."""
    return limiter.limit(AUTH_IP_LIMIT)


def public_limit():
    """Apply moderate public-tier rate limit to a route."""
    return limiter.limit(PUBLIC_LIMIT)


def authed_limit():
    """Apply loose authenticated-user-tier rate limit to a route."""
    return limiter.limit(AUTHED_LIMIT)


# ---------------------------------------------------------------------------
# Per-account rate-limit key  (used in addition to per-IP for auth routes)
# ---------------------------------------------------------------------------

def account_key_func():
    """
    Extract the account identifier (email) from the request body.
    Falls back to IP if body is missing/malformed.
    """
    try:
        body = request.get_json(silent=True) or {}
        email = (body.get("email") or "").strip().lower()
        if email:
            return "acct:" + email
    except Exception:
        pass
    return get_remote_address()


def auth_account_limit():
    """Per-account rate limit for auth routes (applied alongside per-IP)."""
    return limiter.limit(AUTH_ACCT_LIMIT, key_func=account_key_func)


# ---------------------------------------------------------------------------
# Exponential-backoff tracker (in-memory, thread-safe)
# ---------------------------------------------------------------------------

class _BackoffTracker:
    """
    Tracks consecutive auth failures per key (IP or account email).
    After N failures the caller is required to wait an exponentially
    growing delay - but is never permanently locked out.
    """

    def __init__(self):
        self._lock = threading.Lock()
        # key -> {"failures": int, "next_allowed_at": float}
        self._store = {}

    def _cleanup(self):
        """Evict entries whose backoff has expired to avoid unbounded growth."""
        now = time.monotonic()
        expired = [k for k, v in self._store.items() if v["next_allowed_at"] < now - BACKOFF_MAX_SECONDS]
        for k in expired:
            del self._store[k]

    def is_blocked(self, key):
        """Return (blocked, retry_after_seconds)."""
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return False, 0.0
            now = time.monotonic()
            if now < entry["next_allowed_at"]:
                return True, round(entry["next_allowed_at"] - now, 1)
            return False, 0.0

    def record_failure(self, key):
        """Record a failed attempt and compute the next allowed time."""
        with self._lock:
            self._cleanup()
            entry = self._store.setdefault(key, {"failures": 0, "next_allowed_at": 0.0})
            entry["failures"] += 1
            delay = min(
                BACKOFF_BASE_SECONDS * (2 ** (entry["failures"] - 1)),
                BACKOFF_MAX_SECONDS,
            )
            entry["next_allowed_at"] = time.monotonic() + delay
            logger.warning(
                "[backoff] key=%s failures=%d next_window=%.1fs",
                key, entry["failures"], delay,
            )

    def record_success(self, key):
        """Reset backoff on successful auth."""
        with self._lock:
            self._store.pop(key, None)


backoff_tracker = _BackoffTracker()


def check_auth_backoff(ip, email=""):
    """
    Call this at the *start* of an auth handler.
    Returns a Flask response tuple (response, status) if the caller is
    blocked, or None if they may proceed.
    """
    for key in filter(None, [ip, ("acct:" + email) if email else ""]):
        blocked, retry_after = backoff_tracker.is_blocked(key)
        if blocked:
            return (
                jsonify({
                    "error": "Too many failed attempts. Please wait before trying again.",
                    "retry_after_seconds": retry_after,
                }),
                429,
            )
    return None


def record_auth_failure(ip, email=""):
    """Call after a failed auth attempt."""
    backoff_tracker.record_failure(ip)
    if email:
        backoff_tracker.record_failure("acct:" + email)


def record_auth_success(ip, email=""):
    """Call after a successful auth attempt to reset backoff counters."""
    backoff_tracker.record_success(ip)
    if email:
        backoff_tracker.record_success("acct:" + email)
