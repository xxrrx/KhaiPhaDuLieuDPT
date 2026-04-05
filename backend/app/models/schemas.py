from pydantic import BaseModel, EmailStr
from typing import Optional


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    role: str
    created_at: str


class TokenData(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserOut


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None


# ─── Generic Response ─────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    message: str = "OK"


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str
