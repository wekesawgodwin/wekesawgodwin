import hmac
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import get_settings

ALGORITHM = "HS256"
bearer = HTTPBearer(auto_error=False)


def verify_credentials(username: str, password: str) -> bool:
    s = get_settings()
    user_ok = hmac.compare_digest(username.encode(), s.admin_username.encode())
    pass_ok = hmac.compare_digest(password.encode(), s.admin_password.encode())
    return user_ok and pass_ok


def create_token(username: str) -> str:
    s = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=s.access_token_minutes)
    return jwt.encode({"sub": username, "exp": expires}, s.secret_key, algorithm=ALGORITHM)


def require_admin(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise unauthorized
    try:
        payload = jwt.decode(creds.credentials, get_settings().secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise unauthorized
    if payload.get("sub") != get_settings().admin_username:
        raise unauthorized
    return payload["sub"]
