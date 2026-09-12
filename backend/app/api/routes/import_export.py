from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user
from app.db.repos import product_repo, category_repo, audit_repo
from app.utils.helpers import generate_id, generate_sku, now_iso
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
        category_name = row.get("category", "Uncategorized").strip()
        cat = category_repo.get_by_name(category_name)
        if not cat:
            new_cat = category_repo.create({
                "id": generate_id("cat"), "name": category_name,
                "color": "#6b7280", "icon": "Package",
                "description": "", "createdAt": now_iso(),
            })
            category_id = new_cat["Id"]
        else:
            category_id = cat["Id"]

        is_boxed = row.get("isBoxed", "false").lower() in ("true", "1", "yes")
        product = {
            "id": generate_id("p"),
            "sku": row.get("sku", generate_sku(name)),
            "name": name,
            "description": row.get("description", ""),
            "categoryId": category_id,
            "brand": row.get("brand", "").strip(),
            "supplier": row.get("supplier", "").strip(),
            "isBoxed": is_boxed,
            "boxes": int(row.get("boxes", 0) or 0),
            "itemsPerBox": int(row.get("itemsPerBox", 1) or 1),
            "extraPieces": int(row.get("extraPieces", 0) or 0),
            "pricePerBox": float(row.get("pricePerBox", 0) or 0),
            "individualPrice": float(row.get("individualPrice", 0) or 0),
            "lowStockThreshold": int(row.get("lowStockThreshold", 10) or 10),
            "barcode": row.get("barcode", ""),
            "image": row.get("image", ""),
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
        product_repo.create(product)
        imported += 1

    audit_repo.add({
        "id": generate_id("al"),
        "userName": user.get("Name", user.get("name", "")),
        "action": "Products Imported",
        "target": file.filename or "unknown",
        "description": f"{imported} products imported, {len(errors)} errors",
        "occurredAt": now_iso(),
    })

    return {"imported": imported, "errors": errors}
