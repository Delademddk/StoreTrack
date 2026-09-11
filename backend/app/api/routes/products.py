from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.product import ProductCreate, ProductUpdate, RestockRequest, Product as ProductSchema, ProductListResponse
from app.repositories.data_repos import product_repo, audit_repo, sale_repo
from app.core.dependencies import get_current_user, require_role
from app.mock_data.seed import generate_id, generate_sku, now_iso, get_total_qty, get_stock_status

router = APIRouter(prefix="/api/products", tags=["products"])


def product_to_schema(p: dict) -> ProductSchema:
    return ProductSchema(**{k: v for k, v in p.items() if k in ProductSchema.model_fields})


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
    return ProductListResponse(items=[product_to_schema(p) for p in items], total=total)


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: str, user: dict = Depends(get_current_user)):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_schema(product)


@router.post("", response_model=ProductSchema, status_code=201)
def create_product(req: ProductCreate, user: dict = Depends(require_role("Admin", "Manager"))):
    product_id = generate_id("p")
    sku = generate_sku(req.name)
    product = {
        **req.model_dump(),
        "id": product_id,
        "sku": sku,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    created = product_repo.create(product)
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Product Created", "target": sku,
        "description": f"{req.name} created",
    })
    return product_to_schema(created)


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: str, req: ProductUpdate, user: dict = Depends(require_role("Admin", "Manager"))):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    data["updatedAt"] = now_iso()
    updated = product_repo.update(product_id, data)
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Product Updated", "target": existing["sku"],
        "description": f"{existing['name']} updated",
    })
    return product_to_schema(updated)


@router.delete("/{product_id}")
def delete_product(product_id: str, user: dict = Depends(require_role("Admin"))):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    product_repo.delete(product_id)
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Product Deleted", "target": existing["sku"],
        "description": f"{existing['name']} deleted",
    })
    return {"message": "Product deleted"}


@router.post("/{product_id}/restock", response_model=ProductSchema)
def restock_product(product_id: str, req: RestockRequest, user: dict = Depends(require_role("Admin", "Manager", "Keeper"))):
    product = product_repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    data = {"updatedAt": now_iso()}
    if product.get("isBoxed"):
        data["boxes"] = product.get("boxes", 0) + req.addBoxes
        data["extraPieces"] = product.get("extraPieces", 0) + req.addPieces
    else:
        data["extraPieces"] = product.get("extraPieces", 0) + req.addPieces + req.addBoxes
    updated = product_repo.update(product_id, data)
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Inventory Restock", "target": product["sku"],
        "description": f"{product['name']} restocked: +{req.addBoxes} boxes, +{req.addPieces} pieces ({req.reason})",
    })
    return product_to_schema(updated)


@router.post("/{product_id}/duplicate", response_model=ProductSchema, status_code=201)
def duplicate_product(product_id: str, user: dict = Depends(require_role("Admin", "Manager"))):
    existing = product_repo.get_by_id(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    new_id = generate_id("p")
    new_sku = generate_sku(existing["name"])
    product = {
        **{k: v for k, v in existing.items() if k not in ("id", "sku", "createdAt", "updatedAt")},
        "id": new_id,
        "sku": new_sku,
        "name": f"{existing['name']} (Copy)",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    created = product_repo.create(product)
    return product_to_schema(created)


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
