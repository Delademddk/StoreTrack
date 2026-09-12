from fastapi import APIRouter, HTTPException, Depends, Query
from app.db.repos import user_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.core.security import hash_password
from app.utils.helpers import generate_id, now_iso

router = APIRouter(prefix="/api/users", tags=["users"])


def _safe_user(u: dict) -> dict:
    return {
        "id": u["Id"], "name": u["Name"], "username": u["Username"],
        "email": u["Email"], "phone": u.get("Phone") or "",
        "role": u.get("Role", ""), "status": u.get("Status", "Active"),
        "lastActive": u.get("LastActive") or "",
        "createdAt": str(u.get("CreatedAt", "")),
    }


@router.get("")
def list_users(
    q: str = "",
    role: str = "",
    user: dict = Depends(require_role("Admin")),
):
    items = user_repo.get_all(q=q, role=role)
    return {"items": [_safe_user(u) for u in items], "total": len(items)}


@router.post("", status_code=201)
def create_user(data: dict, user: dict = Depends(require_role("Admin"))):
    username = data.get("username", "").strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    existing = user_repo.get_by_username(username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    role_name = data.get("role", "Cashier")
    role_id = user_repo.get_role_id(role_name)
    if not role_id:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role_name}")

    new_user = {
        "id": generate_id("u"),
        "username": username,
        "passwordHash": hash_password("demo1234"),
        "name": data.get("name", username),
        "email": data.get("email", f"{username}@storetrack.com"),
        "phone": data.get("phone", ""),
        "roleId": role_id,
        "status": "Active",
        "lastActive": "",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    created = user_repo.create(new_user)
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "User Created", "target": username,
        "description": f"New user {new_user['name']} created with role {role_name}",
        "occurredAt": now_iso(),
    })
    return _safe_user(created)


@router.put("/{user_id}")
def update_user(user_id: str, data: dict, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = {"updatedAt": now_iso()}
    if "name" in data:
        update_data["name"] = data["name"]
    if "email" in data:
        update_data["email"] = data["email"]
    if "phone" in data:
        update_data["phone"] = data["phone"]
    if "role" in data:
        role_id = user_repo.get_role_id(data["role"])
        if role_id:
            update_data["roleId"] = role_id
    updated = user_repo.update(user_id, update_data)
    return _safe_user(updated)


@router.put("/{user_id}/status")
def update_user_status(user_id: str, data: dict, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = data.get("status", "Active")
    updated = user_repo.update(user_id, {"status": new_status, "updatedAt": now_iso()})
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "User Status Changed", "target": existing["Username"],
        "description": f"User {existing['Name']} set to {new_status}",
        "occurredAt": now_iso(),
    })
    return _safe_user(updated)


@router.post("/{user_id}/reset-password")
def reset_user_password(user_id: str, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    user_repo.update(user_id, {"passwordHash": hash_password("demo1234"), "updatedAt": now_iso()})
    return {"message": "Password reset to default"}


@router.delete("/{user_id}")
def delete_user(user_id: str, user: dict = Depends(require_role("Admin"))):
    existing = user_repo.get_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    if existing["Id"] == user["Id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user_repo.delete(user_id)
    return {"message": "User deleted"}
