from fastapi import APIRouter, HTTPException, Depends
from app.db.repos import category_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.utils.helpers import generate_id, now_iso

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
def list_categories(user: dict = Depends(get_current_user)):
    cats = category_repo.get_all()
    return [
        {
            "id": c["Id"], "name": c["Name"], "color": c.get("Color"),
            "icon": c.get("Icon"), "description": c.get("Description") or "",
            "createdAt": str(c.get("CreatedAt", "")),
        }
        for c in cats
    ]


@router.get("/{cat_id}")
def get_category(cat_id: str, user: dict = Depends(get_current_user)):
    cat = category_repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return {
        "id": cat["Id"], "name": cat["Name"], "color": cat.get("Color"),
        "icon": cat.get("Icon"), "description": cat.get("Description") or "",
        "createdAt": str(cat.get("CreatedAt", "")),
    }


@router.post("", status_code=201)
def create_category(data: dict, user: dict = Depends(require_role("Admin", "Manager"))):
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")
    existing = category_repo.get_by_name(name)
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = {
        "id": generate_id("cat"), "name": name,
        "color": data.get("color", "#6b7280"),
        "icon": data.get("icon", "Package"),
        "description": data.get("description", ""),
        "createdAt": now_iso(),
    }
    created = category_repo.create(cat)
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Category Created", "target": name,
        "description": f"Category '{name}' created",
        "occurredAt": now_iso(),
    })
    return {
        "id": created["Id"], "name": created["Name"],
        "color": created.get("Color"), "icon": created.get("Icon"),
        "description": created.get("Description") or "",
        "createdAt": str(created.get("CreatedAt", "")),
    }


@router.put("/{cat_id}")
def update_category(cat_id: str, data: dict, user: dict = Depends(require_role("Admin", "Manager"))):
    cat = category_repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    if "color" in data:
        update_data["color"] = data["color"]
    if "icon" in data:
        update_data["icon"] = data["icon"]
    if "description" in data:
        update_data["description"] = data["description"]
    updated = category_repo.update(cat_id, update_data)
    return {
        "id": updated["Id"], "name": updated["Name"],
        "color": updated.get("Color"), "icon": updated.get("Icon"),
        "description": updated.get("Description") or "",
        "createdAt": str(updated.get("CreatedAt", "")),
    }


@router.delete("/{cat_id}")
def delete_category(cat_id: str, user: dict = Depends(require_role("Admin"))):
    cat = category_repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    category_repo.delete(cat_id)
    return {"message": "Category deleted"}
