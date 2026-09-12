from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.product import ProductCreate, ProductUpdate, RestockRequest, Product as ProductSchema, ProductListResponse
from app.db.repos import product_repo, category_repo, audit_repo, sale_repo
from app.core.dependencies import get_current_user, require_role
from app.utils.helpers import generate_id, generate_sku, now_iso

router = APIRouter(prefix="/api/products", tags=["products"])


def _resolve_category_id(category_name: str) -> str:
    cat = category_repo.get_by_name(category_name)
    if not cat:
        new_id = generate_id("cat")
        category_repo.create({"id": new_id, "name": category_name, "color": "#6b7280", "icon": "Package", "description": "", "createdAt": now_iso()})
        return new_id
    return cat["Id"]


def _db_product_to_schema(p: dict) -> ProductSchema:
    return ProductSchema(
        id=p["Id"], sku=p["Sku"], name=p["Name"],
        description=p.get("Description") or "",
        category=p.get("CategoryName") or "",
        brand=p.get("Brand") or "", supplier=p.get("Supplier") or "",
        isBoxed=bool(p.get("IsBoxed", True)),
        boxes=p.get("Boxes", 0), itemsPerBox=p.get("ItemsPerBox", 1),
        extraPieces=p.get("ExtraPieces", 0),
        pricePerBox=float(p.get("PricePerBox", 0)),
        individualPrice=float(p.get("IndividualPrice", 0)),
        lowStockThreshold=p.get("LowStockThreshold", 10),
        barcode=p.get("Barcode") or None,
        image=p.get("Image") or None,
        createdAt=str(p.get("CreatedAt", "")),
        updatedAt=str(p.get("UpdatedAt", "")),
    )


@router.get("", response_model=ProductListResponse)
def list_products(
    q: str = Query("", alias="q"),
    category: str = "",
    status: str = "",
    page: int = 1,
    pageSize: int = 50,
    user: dict = Depends(get_current_user),
):
    items = product_repo.get_all(q=q, category=category, status=status)
    total = len(items)
    start = (page - 1) * pageSize
    items = items[start:start + pageSize]
    return ProductListResponse(items=[_db_product_to_schema(p) for p in items], total=total)


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: str, user: dict = Depends(get_current_user)):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _db_product_to_schema(product)


@router.post("", response_model=ProductSchema, status_code=201)
def create_product(req: ProductCreate, user: dict = Depends(require_role("Admin", "Manager"))):
    product_id = generate_id("p")
    sku = generate_sku(req.name)
    category_id = _resolve_category_id(req.category)
    product = {
        "id": product_id, "sku": sku, "name": req.name,
        "description": req.description, "categoryId": category_id,
        "brand": req.brand, "supplier": req.supplier,
        "isBoxed": req.isBoxed, "boxes": req.boxes,
        "itemsPerBox": req.itemsPerBox, "extraPieces": req.extraPieces,
        "pricePerBox": req.pricePerBox, "individualPrice": req.individualPrice,
        "lowStockThreshold": req.lowStockThreshold,
        "barcode": req.barcode, "image": req.image,
        "createdAt": now_iso(), "updatedAt": now_iso(),
    }
    created = product_repo.create(product)
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Product Created", "target": sku,
        "description": f"{req.name} created",
        "occurredAt": now_iso(),
    })
    return _db_product_to_schema(created)


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: str, req: ProductUpdate, user: dict = Depends(require_role("Admin", "Manager"))):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    data = {}
    if req.name is not None:
        data["name"] = req.name
    if req.description is not None:
        data["description"] = req.description
    if req.category is not None:
        data["categoryId"] = _resolve_category_id(req.category)
    if req.brand is not None:
        data["brand"] = req.brand
    if req.supplier is not None:
        data["supplier"] = req.supplier
    if req.isBoxed is not None:
        data["isBoxed"] = req.isBoxed
    if req.boxes is not None:
        data["boxes"] = req.boxes
    if req.itemsPerBox is not None:
        data["itemsPerBox"] = req.itemsPerBox
    if req.extraPieces is not None:
        data["extraPieces"] = req.extraPieces
    if req.pricePerBox is not None:
        data["pricePerBox"] = req.pricePerBox
    if req.individualPrice is not None:
        data["individualPrice"] = req.individualPrice
    if req.lowStockThreshold is not None:
        data["lowStockThreshold"] = req.lowStockThreshold
    if req.barcode is not None:
        data["barcode"] = req.barcode
    if req.image is not None:
        data["image"] = req.image
    data["updatedAt"] = now_iso()
    updated = product_repo.update(product_id, data)
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Product Updated", "target": existing["Sku"],
        "description": f"{existing['Name']} updated",
        "occurredAt": now_iso(),
    })
    return _db_product_to_schema(updated)


@router.delete("/{product_id}")
def delete_product(product_id: str, user: dict = Depends(require_role("Admin"))):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    product_repo.delete(product_id)
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Product Deleted", "target": existing["Sku"],
        "description": f"{existing['Name']} deleted",
        "occurredAt": now_iso(),
    })
    return {"message": "Product deleted"}


@router.post("/{product_id}/restock", response_model=ProductSchema)
def restock_product(product_id: str, req: RestockRequest, user: dict = Depends(require_role("Admin", "Manager", "Keeper"))):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    data = {"updatedAt": now_iso()}
    if product.get("IsBoxed"):
        data["boxes"] = product.get("Boxes", 0) + req.addBoxes
        data["extraPieces"] = product.get("ExtraPieces", 0) + req.addPieces
    else:
        data["extraPieces"] = product.get("ExtraPieces", 0) + req.addPieces + req.addBoxes
    updated = product_repo.update(product_id, data)
    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Inventory Restock", "target": product["Sku"],
        "description": f"{product['Name']} restocked: +{req.addBoxes} boxes, +{req.addPieces} pieces ({req.reason})",
        "occurredAt": now_iso(),
    })
    return _db_product_to_schema(updated)


@router.post("/{product_id}/duplicate", response_model=ProductSchema, status_code=201)
def duplicate_product(product_id: str, user: dict = Depends(require_role("Admin", "Manager"))):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    new_id = generate_id("p")
    new_sku = generate_sku(existing["Name"])
    product = {
        "id": new_id, "sku": new_sku,
        "name": f"{existing['Name']} (Copy)",
        "description": existing.get("Description") or "",
        "categoryId": existing["CategoryId"],
        "brand": existing.get("Brand") or "",
        "supplier": existing.get("Supplier") or "",
        "isBoxed": bool(existing.get("IsBoxed", True)),
        "boxes": existing.get("Boxes", 0),
        "itemsPerBox": existing.get("ItemsPerBox", 1),
        "extraPieces": existing.get("ExtraPieces", 0),
        "pricePerBox": float(existing.get("PricePerBox", 0)),
        "individualPrice": float(existing.get("IndividualPrice", 0)),
        "lowStockThreshold": existing.get("LowStockThreshold", 10),
        "barcode": existing.get("Barcode") or "",
        "image": existing.get("Image") or "",
        "createdAt": now_iso(), "updatedAt": now_iso(),
    }
    created = product_repo.create(product)
    return _db_product_to_schema(created)


@router.get("/{product_id}/sales")
def get_product_sales(product_id: str, user: dict = Depends(get_current_user)):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return sale_repo.sales_for_product(product_id)


@router.get("/{product_id}/audit")
def get_product_audit(product_id: str, user: dict = Depends(get_current_user)):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return audit_repo.get_for_product(product_id)
