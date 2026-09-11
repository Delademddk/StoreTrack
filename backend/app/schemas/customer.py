from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    phone: str
    address: str | None = None
    notes: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class Customer(CustomerBase):
    id: str
    createdAt: str
    updatedAt: str


class LedgerEntry(BaseModel):
    id: str
    customerId: str
    kind: str
    at: str
    amount: float
    balanceAfter: float
    method: str | None = None
    reference: str | None = None
    notes: str | None = None
    saleId: str | None = None
    expectedPaymentDate: str | None = None
    lineSummary: str | None = None


class CustomerSummary(BaseModel):
    totalPurchases: float
    totalPaid: float
    outstanding: float
    lastPurchaseAt: str | None = None
    lastActivityAt: str | None = None
    nextDueAt: str | None = None
    status: str = "clear"


class PaymentRequest(BaseModel):
    amount: float
    method: str = "Cash"
    reference: str | None = None
    notes: str | None = None


class CustomerListResponse(BaseModel):
    items: list[dict]
    total: int
