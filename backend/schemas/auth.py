"""Auth-related Pydantic schemas."""

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str
    building: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
