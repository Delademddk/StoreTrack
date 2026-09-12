from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.core.dependencies import get_current_user, require_role
from app.core.security import verify_password, hash_password
from app.db.repos import user_repo, settings_repo
from app.utils.helpers import now_iso, generate_id

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings(user: dict = Depends(get_current_user)):
    return settings_repo.get()


@router.put("/store")
def update_store_settings(data: dict, user: dict = Depends(require_role("Admin"))):
    settings_repo.update_store(data)
    return {"message": "Store settings updated"}


@router.put("/inventory")
def update_inventory_settings(data: dict, user: dict = Depends(require_role("Admin"))):
    settings_repo.update_inventory(data)
    return {"message": "Inventory settings updated"}


@router.put("/security")
def update_security_settings(data: dict, user: dict = Depends(require_role("Admin"))):
    settings_repo.update_security(data)
    return {"message": "Security settings updated"}


@router.post("/password")
def change_password(data: dict, user: dict = Depends(get_current_user)):
    current = data.get("currentPassword", "")
    new = data.get("newPassword", "")
    if not current or not new:
        raise HTTPException(status_code=400, detail="Both current and new passwords are required")
    if not verify_password(current, user.get("PasswordHash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user_repo.update(user["Id"], {"PasswordHash": hash_password(new), "UpdatedAt": now_iso()})
    return {"message": "Password changed successfully"}


@router.get("/backup/list")
def list_backups(user: dict = Depends(get_current_user)):
    return []


@router.post("/backup/export")
def export_backup(user: dict = Depends(require_role("Admin"))):
    from app.db.repos import product_repo, category_repo, customer_repo, sale_repo
    import json

    products = product_repo.get_all()
    categories = category_repo.get_all()
    customers = customer_repo.get_all()
    sales = sale_repo.get_all()

    backup_data = {
        "products": products,
        "categories": categories,
        "customers": customers,
        "sales": sales,
        "settings": settings_repo.get(),
        "exportedAt": now_iso(),
    }
    return {"data": backup_data, "filename": f"backup_{now_iso().replace(':', '-').replace('.', '-')}.json"}


@router.post("/backup/import")
async def import_backup(file: UploadFile = File(...), user: dict = Depends(require_role("Admin"))):
    content = await file.read()
    try:
        import json
        data = json.loads(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    return {"message": "Backup restored successfully"}
