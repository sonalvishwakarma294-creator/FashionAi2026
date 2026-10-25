"""
error_handler.py – Centralised error handling for Fashion Pro API.

Guarantees that:
  1. Users never see stack traces, internal paths, or raw DB errors.
  2. Full error details ARE logged server-side for debugging.
  3. Every error response is a consistent JSON envelope.
"""

import logging
import traceback
from flask import jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Generic safe envelope
# ---------------------------------------------------------------------------

def _safe_error(message: str, status: int, **extra):
    """Return a JSON error response that is safe to send to the client."""
    payload = {"error": message}
    payload.update(extra)
    return jsonify(payload), status


# ---------------------------------------------------------------------------
# Registration helper
# ---------------------------------------------------------------------------

def register_error_handlers(app):
    """Attach all error handlers to *app*."""

    # -- Werkzeug / Flask HTTP exceptions (404, 405, 413 …) -----------------
    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        # Log only unexpected ones; 404/405 are noisy but not bugs.
        if exc.code not in (400, 401, 403, 404, 405, 422, 429):
            logger.error(
                "HTTP %d for %s %s – %s",
                exc.code, request.method, request.path, exc.description,
            )
        return _safe_error(exc.description or "An error occurred.", exc.code)

    # -- Flask-Limiter 429 ---------------------------------------------------
    @app.errorhandler(429)
    def handle_rate_limit(exc):
        logger.warning(
            "Rate limit hit: %s %s from %s",
            request.method, request.path, request.remote_addr,
        )
        retry_after = getattr(exc, "retry_after", None)
        extra = {}
        if retry_after:
            extra["retry_after_seconds"] = int(retry_after.total_seconds()) if hasattr(retry_after, "total_seconds") else int(retry_after)
        return _safe_error(
            "Too many requests. Please slow down and try again later.",
            429,
            **extra,
        )

    # -- SQLAlchemy / DB errors ----------------------------------------------
    @app.errorhandler(Exception)
    def handle_generic_exception(exc):
        # Log the full traceback server-side only.
        tb = traceback.format_exc()
        logger.error(
            "Unhandled exception on %s %s:\n%s",
            request.method, request.path, tb,
        )
        # Never leak internal details to the client.
        return _safe_error("An internal error occurred. Please try again later.", 500)

    # -- 413 Request Entity Too Large ----------------------------------------
    @app.errorhandler(413)
    def handle_request_too_large(exc):
        return _safe_error("File or request body is too large.", 413)

    return app
