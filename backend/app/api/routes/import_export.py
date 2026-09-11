from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user
from app.repositories.data_repos import product_repo, category_repo
from app.core.security import verify_password
from app.repositories.data_repos import user_repo
from app.mock_data.seed import generate_id, generate_sku, now_iso
import csv
import io

router = APIRouter(prefix="/api/data", tags=["data-transfer"])


@router.post("/import/products")
async def import_products(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    imported = 0
    errors = []
    for i, row in enumerate(reader, start=1):
        name = row.get("name", "").strip()
        if not name:
            errors.append(f"Row {i}: Missing name")
            continue
        category = row.get("category", "Uncategorized").strip()
        if not category_repo.get_by_name(category):
            category_repo.create({
                "id": generate_id("cat"), "name": category,
                "color": "#6b7280", "icon": "Package",
                "description": "", "createdAt": now_iso(),
            })
        product = {
            "id": generate_id("p"),
            "sku": row.get("sku", generate_sku(name)),
            "name": name,
            "category": category,
            "brand": row.get("brand", "").strip(),
            "supplier": row.get("supplier", "").strip(),
            "isBoxed": row.get("isBoxed", "false").lower() in ("true", "1", "yes"),
            "boxes": int(row.get("boxes", 0) or 0),
            "itemsPerBox": int(row.get("itemsPerBox", 1) or 1),
            "extraPieces": int(row.get("extraPieces", 0) or 0),
            "pricePerBox": float(row.get("pricePerBox", 0) or 0),
            "individualPrice": float(row.get("individualPrice", 0) or 0),
            "lowStockThreshold": int(row.get("lowStockThreshold", 10) or 10),
            "description": row.get("description", ""),
            "barcode": row.get("barcode", ""),
            "image": row.get("image", ""),
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
        product_repo.create(product)
        imported += 1
    return {"imported": imported, "errors": errors}
