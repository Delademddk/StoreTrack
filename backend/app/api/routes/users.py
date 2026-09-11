from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.user import AppUserCreate, AppUserUpdate, AppUserStatusUpdate, AppUserListResponse
from app.repositories.data_repos import user_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.core.security import hash_password
from app.mock_data.seed import generate_id, now_iso

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=AppUserListResponse)
def list_users(
    q: str = "",
    role: str = "",
    user: dict = Depends(require_role("Admin")),
):
    items = user_repo.get_all(q=q, role=role)
    safe_items = []
    for u in items:
        safe_items.append({
            "id": u["id"], "name": u["name"], "username": u["username"],
            "email": u["email"], "phone": u.get("phone", ""),
            "role": u["role"], "status": u.get("status", "Active"),
            "lastActive": u.get("lastActive", ""),
        })
    return AppUserListResponse(items=safe_items, total=len(safe_items))


@router.post("", status_code=201)
def create_user(req: AppUserCreate, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = {
        **req.model_dump(),
        "id": generate_id("u"),
        "password": hash_password("demo1234"),
        "status": "Active",
        "lastActive": "Just now",
        "createdAt": now_iso(),
    }
    created = user_repo.create(new_user)
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "User Created", "target": req.username,
        "description": f"New user {req.name} created with role {req.role}",
    })
    return {
        "id": created["id"], "name": created["name"], "username": created["username"],
        "email": created["email"], "phone": created.get("phone", ""),
        "role": created["role"], "status": created.get("status", "Active"),
        "lastActive": created.get("lastActive", ""),
    }


@router.put("/{user_id}")
def update_user(user_id: str, req: AppUserUpdate, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = user_repo.update(user_id, data)
    return {
        "id": updated["id"], "name": updated["name"], "username": updated["username"],
        "email": updated["email"], "phone": updated.get("phone", ""),
        "role": updated["role"], "status": updated.get("status", "Active"),
        "lastActive": updated.get("lastActive", ""),
    }


@router.put("/{user_id}/status")
def update_user_status(user_id: str, req: AppUserStatusUpdate, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    updated = user_repo.update(user_id, {"status": req.status})
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "User Status Changed", "target": existing["username"],
        "description": f"User {existing['name']} set to {req.status}",
    })
    return {
        "id": updated["id"], "name": updated["name"], "username": updated["username"],
        "email": updated["email"], "phone": updated.get("phone", ""),
        "role": updated["role"], "status": updated.get("status", "Active"),
        "lastActive": updated.get("lastActive", ""),
    }


@router.post("/{user_id}/reset-password")
def reset_user_password(user_id: str, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    user_repo.update(user_id, {"password": hash_password("demo1234")})
    return {"message": "Password reset to default"}


@router.delete("/{user_id}")
def delete_user(user_id: str, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    if existing["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user_repo.delete(user_id)
    return {"message": "User deleted"}
