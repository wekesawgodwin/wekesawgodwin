from fastapi import APIRouter, Depends, HTTPException, status

from .. import schemas
from ..auth import create_token, require_admin, verify_credentials
from ..ratelimit import login_limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenOut, dependencies=[Depends(login_limiter)])
def login(payload: schemas.LoginIn):
    if not verify_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return schemas.TokenOut(access_token=create_token(payload.username))


@router.get("/me")
def me(username: str = Depends(require_admin)):
    return {"username": username}
