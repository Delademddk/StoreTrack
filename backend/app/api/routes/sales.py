from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.sale import SaleCreate, Sale as SaleSchema, SaleListResponse
from app.repositories.data_repos import sale_repo, product_repo, customer_repo, ledger_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.mock_data.seed import generate_id, now_iso, get_total_qty
from app.mock_data.store import store

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.get("", response_model=SaleListResponse)
def list_sales(
    q: str = "",
    page: int = 1,
    pageSize: int = 50,
    user: dict = Depends(get_current_user),
):
    items = sale_repo.get_all(q=q)
    total = len(items)
    start = (page - 1) * pageSize
    items = items[start:start + pageSize]
    return SaleListResponse(items=[SaleSchema(**s) for s in items], total=total)


@router.get("/{sale_id}")
def get_sale(sale_id: str, user: dict = Depends(get_current_user)):
    sale = sale_repo.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("", response_model=SaleSchema, status_code=201)
def create_sale(req: SaleCreate, user: dict = Depends(get_current_user)):
    # Validate stock
    for item in req.items:
        product = product_repo.get_by_id(item.productId)
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.productId} not found")
        available = get_total_qty(product)
        if item.qty > available:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.name}: {available} available, {item.qty} requested")

    # Deduct inventory
    for item in req.items:
        product = product_repo.get_by_id(item.productId)
        if product.get("isBoxed"):
            # Deduct from extraPieces first, then boxes
            remaining = item.qty
            extra = product.get("extraPieces", 0)
            if remaining <= extra:
                product_repo.update(item.productId, {"extraPieces": extra - remaining, "updatedAt": now_iso()})
            else:
                remaining -= extra
                boxes = product.get("boxes", 0)
                items_per_box = product.get("itemsPerBox", 1)
                boxes_to_deduct = remaining // items_per_box
                leftover = remaining % items_per_box
                new_boxes = max(0, boxes - boxes_to_deduct)
                new_extra = items_per_box - leftover if leftover > 0 and new_boxes < boxes else 0
                if leftover > 0 and boxes_to_deduct >= boxes:
                    new_extra = extra - leftover
                product_repo.update(product["id"], {
                    "boxes": new_boxes,
                    "extraPieces": max(0, new_extra),
                    "updatedAt": now_iso(),
                })
        else:
            extra = product.get("extraPieces", 0)
            product_repo.update(item.productId, {"extraPieces": extra - item.qty, "updatedAt": now_iso()})

    # Create sale
    sale_id = generate_id("s")
    invoice = store.next_invoice()
    sale = {
        "id": sale_id,
        "invoice": invoice,
        "customer": req.customerId if req.customerId else "Walk-in",
        "items": [i.model_dump() for i in req.items],
        "subtotal": req.subtotal,
        "discount": req.discount,
        "tax": req.tax,
        "total": req.total,
        "method": req.method,
        "cashier": user["name"],
        "at": now_iso(),
    }
    created = sale_repo.create(sale)

    # Handle credit sale
    if req.onCredit and req.customerId:
        customer = customer_repo.get_by_id(req.customerId)
        if customer:
            existing_entries = ledger_repo.get_by_customer(req.customerId)
            current_balance = sum(
                e["amount"] if e["kind"] == "purchase" else -e["amount"]
                for e in existing_entries
            )
            new_balance = current_balance + req.total
            line_summary = ", ".join(f"{i.qty}x {i.name}" for i in req.items)
            ledger_repo.create({
                "id": generate_id("le"), "customerId": req.customerId,
                "kind": "purchase", "at": now_iso(), "amount": req.total,
                "balanceAfter": new_balance, "method": None,
                "reference": None, "notes": req.notes,
                "saleId": sale_id, "expectedPaymentDate": req.expectedPaymentDate,
                "lineSummary": line_summary,
            })
            if req.amountPaid and req.amountPaid > 0:
                new_balance -= req.amountPaid
                ledger_repo.create({
                    "id": generate_id("le"), "customerId": req.customerId,
                    "kind": "payment", "at": now_iso(), "amount": req.amountPaid,
                    "balanceAfter": new_balance, "method": req.method,
                    "reference": f"Payment for {invoice}", "notes": req.notes,
                    "saleId": None, "expectedPaymentDate": None, "lineSummary": None,
                })

    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Sale Recorded", "target": invoice,
        "description": f"{req.method} sale of ${req.total:.2f} to {sale['customer']}",
    })

    return SaleSchema(**created)
