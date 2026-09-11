from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import (
    LoginRequest, LoginResponse, AuthUser, ForgotPasswordRequest,
    ResetPasswordRequest, ChangePasswordRequest, ProfileUpdateRequest,
)
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user
from app.repositories.data_repos import user_repo
from app.mock_data.seed import generate_id, now_iso

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_to_auth(u: dict) -> AuthUser:
    initials = "".join(w[0] for w in u["name"].split()[:2]).upper()
    return AuthUser(
        id=u["id"], name=u["name"], username=u["username"],
        email=u["email"], role=u["role"],
        avatarInitials=initials, storeName="StoreTrack Demo Store",
    )


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = user_repo.get_by_username(req.username)
    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.get("status") == "Disabled":
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return LoginResponse(user=user_to_auth(user), token=token)


@router.post("/logout")
def logout(user: dict = Depends(get_current_user)):
    return {"message": "Logged out"}


@router.get("/me", response_model=AuthUser)
def get_me(user: dict = Depends(get_current_user)):
    return user_to_auth(user)


@router.put("/me", response_model=AuthUser)
def update_me(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    user_repo.update(user["id"], data)
    updated = user_repo.get_by_id(user["id"])
    return user_to_auth(updated)


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    return {"message": "Password reset successful"}


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not verify_password(req.currentPassword, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user_repo.update(user["id"], {"password": hash_password(req.newPassword)})
    return {"message": "Password changed successfully"}


@router.get("/sessions/current")
def get_session(user: dict = Depends(get_current_user)):
    return {
        "location": "Nairobi, Kenya",
        "ip": "192.168.1.100",
        "lastActivity": now_iso(),
    }
