from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import (
    LoginRequest, LoginResponse, AuthUser, ForgotPasswordRequest,
    ResetPasswordRequest, ChangePasswordRequest, ProfileUpdateRequest,
)
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user
from app.db.repos import user_repo, settings_repo
from app.utils.helpers import generate_id, now_iso

router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_to_auth(u: dict) -> AuthUser:
    initials = "".join(w[0] for w in u["Name"].split()[:2]).upper()
    settings = settings_repo.get()
    store_name = settings.get("store", {}).get("storeName", "StoreTrack Demo Store")
    return AuthUser(
        id=u["Id"], name=u["Name"], username=u["Username"],
        email=u["Email"], role=u["Role"],
        avatarInitials=initials, storeName=store_name,
    )


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = user_repo.get_by_username(req.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not verify_password(req.password, user.get("PasswordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.get("Status") == "Disabled":
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": user["Id"], "role": user["Role"]})
    return LoginResponse(user=user_to_auth(user), token=token)


@router.post("/logout")
def logout(user: dict = Depends(get_current_user)):
    return {"message": "Logged out"}


@router.get("/me", response_model=AuthUser)
def get_me(user: dict = Depends(get_current_user)):
    return user_to_auth(user)


@router.put("/me", response_model=AuthUser)
def update_me(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    data = {}
    if req.name is not None:
        data["Name"] = req.name
    if req.email is not None:
        data["Email"] = req.email
    if req.phone is not None:
        data["Phone"] = req.phone
    if data:
        data["UpdatedAt"] = now_iso()
        user_repo.update(user["Id"], data)
    updated = user_repo.get_by_id(user["Id"])
    return user_to_auth(updated)


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    return {"message": "Password reset successful"}


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not verify_password(req.currentPassword, user.get("PasswordHash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user_repo.update(user["Id"], {"PasswordHash": hash_password(req.newPassword), "UpdatedAt": now_iso()})
    return {"message": "Password changed successfully"}


@router.get("/sessions/current")
def get_session(user: dict = Depends(get_current_user)):
    return {
        "location": "Local",
        "ip": "127.0.0.1",
        "lastActivity": now_iso(),
    }
