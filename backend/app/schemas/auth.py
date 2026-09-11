from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUser(BaseModel):
    id: str
    name: str
    username: str
    email: str
    role: str
    avatarInitials: str
    storeName: str


class LoginResponse(BaseModel):
    user: AuthUser
    token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
