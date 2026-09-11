import json
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.core.dependencies import get_current_user, require_role
from app.core.security import verify_password, hash_password
from app.repositories.data_repos import user_repo
from app.mock_data.store import store
from app.mock_data.seed import now_iso, generate_id

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings(user: dict = Depends(get_current_user)):
    return store.settings


@router.put("/store")
def update_store_settings(data: dict, user: dict = Depends(require_role("Admin"))):
    store.settings["store"].update(data)
    return {"message": "Store settings updated"}


@router.put("/inventory")
def update_inventory_settings(data: dict, user: dict = Depends(require_role("Admin"))):
    store.settings["inventory"].update(data)
    return {"message": "Inventory settings updated"}


@router.put("/security")
def update_security_settings(data: dict, user: dict = Depends(require_role("Admin"))):
    store.settings["security"].update(data)
    return {"message": "Security settings updated"}


@router.post("/password")
def change_password(data: dict, user: dict = Depends(get_current_user)):
    current = data.get("currentPassword", "")
    new = data.get("newPassword", "")
    if not current or not new:
        raise HTTPException(status_code=400, detail="Both current and new passwords are required")
    if not verify_password(current, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user_repo.update(user["id"], {"password": hash_password(new)})
    return {"message": "Password changed successfully"}


@router.get("/backup/list")
def list_backups(user: dict = Depends(get_current_user)):
    return store.backups


@router.post("/backup/export")
def export_backup(user: dict = Depends(require_role("Admin"))):
    import copy
    backup_data = {
        "products": copy.deepcopy(store.products),
        "categories": copy.deepcopy(store.categories),
        "users": [{k: v for k, v in u.items() if k != "password"} for u in store.users],
        "customers": copy.deepcopy(store.customers),
        "sales": copy.deepcopy(store.sales),
        "ledger_entries": copy.deepcopy(store.ledger_entries),
        "settings": copy.deepcopy(store.settings),
        "exportedAt": now_iso(),
    }
    backup_entry = {
        "filename": f"backup_{now_iso().replace(':', '-').replace('.', '-')}.json",
        "createdAt": now_iso(),
        "size": len(json.dumps(backup_data)),
    }
    store.backups.append(backup_entry)
    return {"data": backup_data, "filename": backup_entry["filename"]}


@router.post("/backup/import")
async def import_backup(file: UploadFile = File(...), user: dict = Depends(require_role("Admin"))):
    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    if "products" in data:
        store.products = data["products"]
    if "categories" in data:
        store.categories = data["categories"]
    if "customers" in data:
        store.customers = data["customers"]
    if "sales" in data:
        store.sales = data["sales"]
    if "ledger_entries" in data:
        store.ledger_entries = data["ledger_entries"]
    if "settings" in data:
        store.settings = data["settings"]
    return {"message": "Backup restored successfully"}
