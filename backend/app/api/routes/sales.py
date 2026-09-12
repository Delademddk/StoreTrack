from fastapi import APIRouter, HTTPException, Depends, Query
from app.db.repos import sale_repo, product_repo, customer_repo, ledger_repo, audit_repo, activity_repo
from app.core.dependencies import get_current_user, require_role
from app.utils.helpers import generate_id, now_iso

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.get("")
def list_sales(
    q: str = "",
    page: int = 1,
    pageSize: int = 50,
    user: dict = Depends(get_current_user),
):
    items = sale_repo.get_all(q=q)
    total = len(items)
    start = (page - 1) * pageSize
    page_items = items[start:start + pageSize]

    result = []
    for s in page_items:
        result.append({
            "id": s["Id"], "invoice": s["Invoice"],
            "customerId": s.get("CustomerId"),
            "customer": s.get("CustomerName") or "Walk-in",
            "cashier": s.get("CashierName") or "",
            "userId": s.get("UserId"),
            "subtotal": float(s.get("Subtotal", 0)),
            "discount": float(s.get("Discount", 0)),
            "total": float(s.get("Total", 0)),
            "method": s.get("Method", "Cash"),
            "onCredit": bool(s.get("OnCredit", False)),
            "amountPaid": float(s["AmountPaid"]) if s.get("AmountPaid") is not None else None,
            "notes": s.get("Notes"),
            "at": str(s.get("SoldAt", "")),
            "items": [
                {
                    "productId": i["ProductId"], "name": i["ProductName"],
                    "qty": i["Quantity"], "unitPrice": float(i["UnitPrice"]),
                }
                for i in s.get("Items", [])
            ],
            "itemCount": s.get("ItemCount", 0),
        })
    return {"items": result, "total": total}


@router.get("/{sale_id}")
def get_sale(sale_id: str, user: dict = Depends(get_current_user)):
    sale = sale_repo.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {
        "id": sale["Id"], "invoice": sale["Invoice"],
        "customerId": sale.get("CustomerId"),
        "customer": sale.get("CustomerName") or "Walk-in",
        "cashier": sale.get("CashierName") or "",
        "userId": sale.get("UserId"),
        "subtotal": float(sale.get("Subtotal", 0)),
        "discount": float(sale.get("Discount", 0)),
        "total": float(sale.get("Total", 0)),
        "method": sale.get("Method", "Cash"),
        "onCredit": bool(sale.get("OnCredit", False)),
        "amountPaid": float(sale["AmountPaid"]) if sale.get("AmountPaid") is not None else None,
        "notes": sale.get("Notes"),
        "at": str(sale.get("SoldAt", "")),
        "items": [
            {
                "productId": i["ProductId"], "name": i["ProductName"],
                "qty": i["Quantity"], "unitPrice": float(i["UnitPrice"]),
            }
            for i in sale.get("Items", [])
        ],
    }


@router.post("", status_code=201)
def create_sale(data: dict, user: dict = Depends(get_current_user)):
    items_data = data.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    for item in items_data:
        product = product_repo.get_by_id(item.get("productId"))
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.get('productId')} not found")
        available = (
            product.get("Boxes", 0) * product.get("ItemsPerBox", 0) + product.get("ExtraPieces", 0)
            if product.get("IsBoxed") else product.get("ExtraPieces", 0)
        )
        qty = item.get("qty", 0)
        if qty > available:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['Name']}: {available} available, {qty} requested")

    for item in items_data:
        product = product_repo.get_by_id(item.get("productId"))
        qty = item.get("qty", 0)
        update_data = {"updatedAt": now_iso()}
        if product.get("IsBoxed"):
            remaining = qty
            extra = product.get("ExtraPieces", 0)
            if remaining <= extra:
                update_data["extraPieces"] = extra - remaining
            else:
                remaining -= extra
                boxes = product.get("Boxes", 0)
                items_per_box = product.get("ItemsPerBox", 1)
                boxes_to_deduct = remaining // items_per_box
                leftover = remaining % items_per_box
                new_boxes = max(0, boxes - boxes_to_deduct)
                new_extra = items_per_box - leftover if leftover > 0 and new_boxes < boxes else 0
                if leftover > 0 and boxes_to_deduct >= boxes:
                    new_extra = extra - leftover
                update_data["boxes"] = new_boxes
                update_data["extraPieces"] = max(0, new_extra)
        else:
            extra = product.get("ExtraPieces", 0)
            update_data["extraPieces"] = extra - qty
        product_repo.update(item["productId"], update_data)

    sale_id = generate_id("s")
    invoice = sale_repo.next_invoice()

    customer_id = data.get("customerId")
    customer_name = "Walk-in"
    if customer_id:
        customer = customer_repo.get_by_id(customer_id)
        if customer:
            customer_name = customer["Name"]

    sale = {
        "id": sale_id, "invoice": invoice,
        "customerId": customer_id, "customerName": customer_name,
        "cashierName": user["Name"], "userId": user["Id"],
        "subtotal": data.get("subtotal", 0),
        "discount": data.get("discount", 0),
        "total": data.get("total", 0),
        "method": data.get("method", "Cash"),
        "onCredit": data.get("onCredit", False),
        "amountPaid": data.get("amountPaid"),
        "notes": data.get("notes"),
        "soldAt": now_iso(),
    }

    sale_items = []
    for item in items_data:
        sale_items.append({
            "id": generate_id("si"),
            "productId": item["productId"],
            "productName": item.get("name", ""),
            "quantity": item.get("qty", 0),
            "unitPrice": item.get("unitPrice", 0),
        })

    created = sale_repo.create(sale, sale_items)

    if data.get("onCredit") and customer_id:
        existing_entries = ledger_repo.get_by_customer(customer_id)
        current_balance = sum(
            e["Amount"] if e["Kind"] == "credit_sale" else -e["Amount"]
            for e in existing_entries
        )
        new_balance = current_balance + data.get("total", 0)
        line_summary = ", ".join(f"{i.get('qty', 0)}x {i.get('name', '')}" for i in items_data)
        ledger_repo.create({
            "id": generate_id("le"), "customerId": customer_id,
            "kind": "credit_sale", "amount": data.get("total", 0),
            "balanceAfter": new_balance, "method": None,
            "reference": None, "notes": data.get("notes"),
            "saleId": sale_id,
            "expectedPaymentDate": data.get("expectedPaymentDate"),
            "lineSummary": line_summary,
            "entryAt": now_iso(),
        })
        amount_paid = data.get("amountPaid")
        if amount_paid and amount_paid > 0:
            new_balance -= amount_paid
            ledger_repo.create({
                "id": generate_id("le"), "customerId": customer_id,
                "kind": "payment", "amount": amount_paid,
                "balanceAfter": new_balance, "method": data.get("method", "Cash"),
                "reference": f"Payment for {invoice}", "notes": data.get("notes"),
                "saleId": None, "expectedPaymentDate": None,
                "lineSummary": None, "entryAt": now_iso(),
            })

    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Sale Recorded", "target": invoice,
        "description": f"{data.get('method', 'Cash')} sale of {data.get('total', 0):.2f} to {customer_name}",
        "occurredAt": now_iso(),
    })

    activity_repo.add({
        "id": generate_id("a"), "kind": "sale",
        "title": "Sale recorded",
        "description": f"{invoice} — {customer_name}, {data.get('total', 0):.2f}",
        "actor": user["Name"], "occurredAt": now_iso(),
    })

    return {
        "id": created["Id"], "invoice": created["Invoice"],
        "customerId": customer_id,
        "customer": customer_name,
        "cashier": user["Name"],
        "subtotal": float(created.get("Subtotal", 0)),
        "discount": float(created.get("Discount", 0)),
        "total": float(created.get("Total", 0)),
        "method": created.get("Method", "Cash"),
        "onCredit": bool(created.get("OnCredit", False)),
        "amountPaid": float(created["AmountPaid"]) if created.get("AmountPaid") is not None else None,
        "notes": created.get("Notes"),
        "at": str(created.get("SoldAt", "")),
        "items": [
            {
                "productId": i["ProductId"], "name": i["ProductName"],
                "qty": i["Quantity"], "unitPrice": float(i["UnitPrice"]),
            }
            for i in created.get("Items", [])
        ],
    }
