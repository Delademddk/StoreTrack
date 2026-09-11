from fastapi import APIRouter, HTTPException, Depends
from app.schemas.category import CategoryCreate, CategoryUpdate, Category as CategorySchema
from app.repositories.data_repos import category_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.mock_data.seed import generate_id, now_iso

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
def list_categories(user: dict = Depends(get_current_user)):
    return category_repo.get_all()


@router.get("/{cat_id}")
def get_category(cat_id: str, user: dict = Depends(get_current_user)):
    cat = category_repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.post("", status_code=201)
def create_category(req: CategoryCreate, user: dict = Depends(require_role("Admin", "Manager"))):
    existing = category_repo.get_by_name(req.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = {
        **req.model_dump(),
        "id": generate_id("cat"),
        "createdAt": now_iso(),
    }
    created = category_repo.create(cat)
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Category Created", "target": req.name,
        "description": f"Category '{req.name}' created",
    })
    return created


@router.put("/{cat_id}")
def update_category(cat_id: str, req: CategoryUpdate, user: dict = Depends(require_role("Admin", "Manager"))):
    cat = category_repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = category_repo.update(cat_id, data)
    return updated


@router.delete("/{cat_id}")
def delete_category(cat_id: str, user: dict = Depends(require_role("Admin"))):
    cat = category_repo.get_by_id(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    category_repo.delete(cat_id)
    return {"message": "Category deleted"}
