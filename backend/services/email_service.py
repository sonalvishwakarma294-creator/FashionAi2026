"""Email + signed-token service for password recovery.

Two responsibilities:
1. Generate cryptographically-signed single-use reset tokens (via itsdangerous.URLSafeSerializer
   + per-row expiry persisted in users.reset_token_expires_at for revoke safety).
2. Try to deliver the email via SMTP. Falls back to "print to terminal + return the URL"
   so developer-mode still works without configuring SMTP credentials.
"""
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.headerregistry import Address
from datetime import datetime, timedelta, timezone
from itsdangerous import URLSafeTimedSerializer, BadData, SignatureExpired

__all__ = [
    'generate_reset_token',
    'validate_reset_token',
    'send_password_reset_email',
]


def _env(name, default=None, cast=str):
    val = os.environ.get(name, default)
    if val is None:
        return default
    try:
        return cast(val)
    except (TypeError, ValueError):
        return default


def _signer():
    # SECRET_KEY + JWT_SECRET both mixed in so secrets must match across the whole stack.
    salt = os.environ.get('SECRET_KEY', 'fashion-pro-reset-v1')
    key = os.environ.get('JWT_SECRET', os.environ.get('SECRET_KEY', 'dev-secret-key'))
    return URLSafeTimedSerializer(secret_key=key, salt=salt)


def generate_reset_token(email):
    """Return (token, expires_at_utc). Caller stores both on the user row."""
    s = _signer()
    ttl_min = _env('PASSWORD_RESET_TTL_MIN', 30, cast=int)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ttl_min)
    token = s.dumps(email)
    return token, expires_at


def validate_reset_token(token, max_age_minutes=None):
    """Return email if token is valid and not expired, else None."""
    if not token:
        return None
    s = _signer()
    ttl = max_age_minutes or _env('PASSWORD_RESET_TTL_MIN', 30, cast=int)
    try:
        return s.loads(token, max_age=ttl * 60)
    except (BadData, SignatureExpired):
        return None


def _build_reset_email(user_name, reset_url):
    """Return EmailMessage."""
    from_name = os.environ.get('MAIL_FROM_NAME', 'Fashion Pro').strip('"').strip("'")
    from_addr = os.environ.get('MAIL_FROM_ADDRESS', 'no-reply@fashion.ai')

    html_body = f"""
    <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.55;color:#1f2937;max-width:600px;margin:auto;">
        <div style="background:linear-gradient(135deg,#6D28D9,#EC4899);border-radius:18px 18px 0 0;padding:28px 32px;color:#fff;">
            <h1 style="margin:0;font-size:24px;font-weight:900;letter-spacing:.02em;">🔐  Password Recovery</h1>
            <p style="margin:6px 0 0 0;opacity:.9;">Hi {user_name}, you requested a password reset for your Fashion Pro account.</p>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 18px 18px;padding:32px;">
            <p style="margin:0 0 18px 0;font-size:15px;">Click the button below to set a new password. This link is valid for <b>30 minutes</b> and works only once.</p>
            <div style="text-align:center;margin:28px 0;">
                <a href="{reset_url}" style="display:inline-block;background:linear-gradient(135deg,#6D28D9,#EC4899);color:#fff;text-decoration:none;padding:14px 36px;border-radius:999px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:12px;box-shadow:0 12px 30px -10px rgba(109,40,217,.55);">Reset My Password</a>
            </div>
            <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="margin:0 0 24px 0;font-size:12px;background:#f3f4f6;border-radius:10px;padding:12px;word-break:break-all;color:#111827;">{reset_url}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
            <p style="margin:0 0 6px 0;font-size:12px;color:#6b7280;"><b>Did not request this?</b> You can safely ignore this email — your password will not change. If you're concerned, change it anyway after logging in.</p>
            <p style="margin:24px 0 0 0;font-size:11px;color:#9ca3af;">© Fashion Pro — your AI stylist.</p>
        </div>
    </div>
    """

    text_body = (
        f"Password Recovery — Fashion Pro\n"
        f"Hello {user_name},\n"
        f"A password reset was requested for your account.\n\n"
        f"Reset link: {reset_url}\n\n"
        f"This link expires in 30 minutes and works once.\n"
        f"If you did not request this, ignore this email.\n\n"
        f"— Fashion Pro Team"
    )

    msg = EmailMessage()
    msg['Subject'] = 'Reset your Fashion Pro password'
    msg['From'] = Address(display_name=from_name, addr_spec=from_addr)
    msg['To'] = user_name  # overwritten below with actual email
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype='html')
    return msg


def send_password_reset_email(to_email, user_name, reset_url):
    """Try SMTP. If disabled/config-invalid, print reset URL to backend terminal
    so dev flow still works. Returns (ok, delivery_mode, error_or_none)."""
    use_smtp = _env('MAIL_USE_SMTP', 'False', cast=str).lower() in ('1', 'true', 'yes', 'on')
    server = _env('MAIL_SERVER', '')
    user = _env('MAIL_USERNAME', '')
    pwd = _env('MAIL_PASSWORD', '')
    port = _env('MAIL_PORT', 465, cast=int)
    use_ssl = _env('MAIL_USE_SSL', 'True', cast=str).lower() in ('1', 'true', 'yes', 'on')

    if not (use_smtp and server and user and pwd):
        print("\n" + "=" * 72)
        print("  📧 DEV-MODE EMAIL (no SMTP configured)")
        print("  Delivery: to=" + to_email)
        print("  Reset URL: " + reset_url)
        print("=" * 72 + "\n")
        return True, "dev_mode_print", None

    msg = _build_reset_email(user_name, reset_url)
    del msg['To']
    msg['To'] = to_email
    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(server, port, context=context, timeout=20) as s:
                s.login(user, pwd)
                s.send_message(msg)
        else:
            with smtplib.SMTP(server, port, timeout=20) as s:
                s.ehlo()
                try:
                    s.starttls(context=ssl.create_default_context())
                    s.ehlo()
                except smtplib.SMTPException:
                    pass
                s.login(user, pwd)
                s.send_message(msg)
        return True, "smtp", None
    except Exception as e:
        print("  ❌ Email dispatch failed: %s" % str(e))
        return False, "smtp_error", str(e)
