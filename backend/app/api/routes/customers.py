from fastapi import APIRouter, HTTPException, Depends, Query
from app.schemas.customer import CustomerCreate, CustomerUpdate, PaymentRequest, CustomerListResponse
from app.repositories.data_repos import customer_repo, ledger_repo, audit_repo
from app.core.dependencies import get_current_user, require_role
from app.mock_data.seed import generate_id, now_iso

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("/summary")
def customer_summary(user: dict = Depends(get_current_user)):
    customers = customer_repo.get_all()
    total_outstanding = 0
    overdue_count = 0
    for c in customers:
        s = ledger_repo.summary(c["id"])
        total_outstanding += s["outstanding"]
        if s["status"] == "overdue":
            overdue_count += 1
    return {
        "totalCustomers": len(customers),
        "totalOutstanding": total_outstanding,
        "overdueCount": overdue_count,
    }


@router.get("", response_model=CustomerListResponse)
def list_customers(
    q: str = "",
    filter: str = "",
    sort: str = "",
    page: int = 1,
    pageSize: int = 50,
    user: dict = Depends(get_current_user),
):
    items = customer_repo.get_all(q=q, filter_status=filter, sort=sort)
    # Enrich with summaries
    enriched = []
    for c in items:
        s = ledger_repo.summary(c["id"])
        enriched.append({**c, **s})
    total = len(enriched)
    start = (page - 1) * pageSize
    enriched = enriched[start:start + pageSize]
    return CustomerListResponse(items=enriched, total=total)


@router.get("/{customer_id}")
def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("", status_code=201)
def create_customer(req: CustomerCreate, user: dict = Depends(get_current_user)):
    customer = {
        **req.model_dump(),
        "id": generate_id("c"),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    created = customer_repo.create(customer)
    return created


@router.put("/{customer_id}")
def update_customer(customer_id: str, req: CustomerUpdate, user: dict = Depends(get_current_user)):
    existing = customer_repo.get_by_id(customer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    data["updatedAt"] = now_iso()
    updated = customer_repo.update(customer_id, data)
    return updated


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
    return ledger_repo.get_by_customer(customer_id)


@router.get("/{customer_id}/summary")
def get_customer_financial_summary(customer_id: str, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ledger_repo.summary(customer_id)


@router.post("/{customer_id}/payments")
def record_payment(customer_id: str, req: PaymentRequest, user: dict = Depends(get_current_user)):
    customer = customer_repo.get_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    existing_entries = ledger_repo.get_by_customer(customer_id)
    current_balance = sum(
        e["amount"] if e["kind"] == "purchase" else -e["amount"]
        for e in existing_entries
    )
    new_balance = current_balance - req.amount
    entry = ledger_repo.create({
        "id": generate_id("le"), "customerId": customer_id,
        "kind": "payment", "at": now_iso(), "amount": req.amount,
        "balanceAfter": new_balance, "method": req.method,
        "reference": req.reference, "notes": req.notes,
        "saleId": None, "expectedPaymentDate": None, "lineSummary": None,
    })
    audit_repo.add({
        "id": generate_id("al"), "at": now_iso(), "user": user["name"],
        "action": "Payment Received", "target": customer["name"],
        "description": f"${req.amount:.2f} payment from {customer['name']}",
    })
    return entry
