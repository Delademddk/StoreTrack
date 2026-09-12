from fastapi import APIRouter, HTTPException, Depends, Query
from app.db.repos import customer_repo, ledger_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.utils.helpers import generate_id, now_iso

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("/summary")
def customer_summary(user: dict = Depends(get_current_user)):
    customers = customer_repo.get_all()
    total_outstanding = 0
    overdue_count = 0
    for c in customers:
        outstanding = float(c.get("Outstanding", 0))
        total_outstanding += outstanding
        if outstanding > 0:
            summary = ledger_repo.summary(c["Id"])
            if summary.get("status") == "overdue":
                overdue_count += 1
    return {
        "totalCustomers": len(customers),
        "totalOutstanding": total_outstanding,
        "overdueCount": overdue_count,
    }


@router.get("")
def list_customers(
    q: str = "",
    filter: str = "",
    sort: str = "",
    page: int = 1,
    pageSize: int = 50,
    user: dict = Depends(get_current_user),
):
    items = customer_repo.get_all(q=q, filter_status=filter, sort=sort)
    total = len(items)
    start = (page - 1) * pageSize
    page_items = items[start:start + pageSize]

    result = []
    for c in page_items:
        s = ledger_repo.summary(c["Id"])
        result.append({
            "id": c["Id"], "name": c["Name"], "phone": c["Phone"],
            "address": c.get("Address") or "", "notes": c.get("Notes") or "",
            "createdAt": str(c.get("CreatedAt", "")),
            "updatedAt": str(c.get("UpdatedAt", "")),
            **s,
        })
    return {"items": result, "total": total}


@router.get("/{customer_id}")
def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "id": customer["Id"], "name": customer["Name"], "phone": customer["Phone"],
        "address": customer.get("Address") or "", "notes": customer.get("Notes") or "",
        "createdAt": str(customer.get("CreatedAt", "")),
        "updatedAt": str(customer.get("UpdatedAt", "")),
    }


@router.post("", status_code=201)
def create_customer(data: dict, user: dict = Depends(get_current_user)):
    customer = {
        "id": generate_id("c"), "name": data.get("name", ""),
        "phone": data.get("phone", ""), "address": data.get("address", ""),
        "notes": data.get("notes", ""),
        "createdAt": now_iso(), "updatedAt": now_iso(),
    }
    created = customer_repo.create(customer)
    return {
        "id": created["Id"], "name": created["Name"], "phone": created["Phone"],
        "address": created.get("Address") or "", "notes": created.get("Notes") or "",
        "createdAt": str(created.get("CreatedAt", "")),
        "updatedAt": str(created.get("UpdatedAt", "")),
    }


@router.put("/{customer_id}")
def update_customer(customer_id: str, data: dict, user: dict = Depends(get_current_user)):
    existing = customer_repo.get_by_id(customer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    update_data = {"updatedAt": now_iso()}
    if "name" in data:
        update_data["name"] = data["name"]
    if "phone" in data:
        update_data["phone"] = data["phone"]
    if "address" in data:
        update_data["address"] = data["address"]
    if "notes" in data:
        update_data["notes"] = data["notes"]
    updated = customer_repo.update(customer_id, update_data)
    return {
        "id": updated["Id"], "name": updated["Name"], "phone": updated["Phone"],
        "address": updated.get("Address") or "", "notes": updated.get("Notes") or "",
        "createdAt": str(updated.get("CreatedAt", "")),
        "updatedAt": str(updated.get("UpdatedAt", "")),
    }


@router.delete("/{customer_id}")
def delete_customer(customer_id: str, user: dict = Depends(require_role("Admin", "Manager"))):
    existing = customer_repo.get_by_id(customer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer_repo.delete(customer_id)
    return {"message": "Customer deleted"}


@router.get("/{customer_id}/ledger")
def get_customer_ledger(customer_id: str, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    entries = ledger_repo.get_by_customer(customer_id)
    return [
        {
            "id": e["Id"], "customerId": e["CustomerId"], "kind": e["Kind"],
            "at": str(e.get("EntryAt", "")),
            "amount": float(e["Amount"]),
            "balanceAfter": float(e["BalanceAfter"]),
            "method": e.get("Method"), "reference": e.get("Reference"),
            "notes": e.get("Notes"), "saleId": e.get("SaleId"),
            "expectedPaymentDate": e.get("ExpectedPaymentDate"),
            "lineSummary": e.get("LineSummary"),
        }
        for e in entries
    ]


@router.get("/{customer_id}/summary")
def get_customer_financial_summary(customer_id: str, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ledger_repo.summary(customer_id)


@router.post("/{customer_id}/payments")
def record_payment(customer_id: str, data: dict, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    amount = data.get("amount", 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")

    existing_entries = ledger_repo.get_by_customer(customer_id)
    current_balance = sum(
        e["Amount"] if e["Kind"] == "credit_sale" else -e["Amount"]
        for e in existing_entries
    )
    if amount > current_balance:
        raise HTTPException(status_code=400, detail=f"Payment of {amount:.2f} exceeds outstanding balance of {current_balance:.2f}")

    new_balance = current_balance - amount
    entry = ledger_repo.create({
        "id": generate_id("le"), "customerId": customer_id,
        "kind": "payment", "amount": amount,
        "balanceAfter": new_balance, "method": data.get("method", "Cash"),
        "reference": data.get("reference"), "notes": data.get("notes"),
        "saleId": None, "expectedPaymentDate": None, "lineSummary": None,
        "entryAt": now_iso(),
    })

    audit_repo.add({
        "id": generate_id("al"), "userName": user["Name"],
        "action": "Payment Received", "target": customer["Name"],
        "description": f"{amount:.2f} payment from {customer['Name']}",
        "occurredAt": now_iso(),
    })

    return {
        "id": entry["id"], "customerId": entry["customerId"],
        "kind": entry["kind"], "at": entry.get("entryAt", ""),
        "amount": entry["amount"],
        "balanceAfter": entry["balanceAfter"],
        "method": entry.get("method"),
        "reference": entry.get("reference"),
        "notes": entry.get("notes"),
    }
