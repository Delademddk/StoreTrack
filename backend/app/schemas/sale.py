from pydantic import BaseModel


class SaleItem(BaseModel):
    productId: str
    name: str
    qty: int
    unitPrice: float


class SaleBase(BaseModel):
    items: list[SaleItem]
    subtotal: float
    discount: float = 0
    tax: float = 0
    total: float
    method: str = "Cash"
    onCredit: bool = False
    customerId: str | None = None
    amountPaid: float | None = None
    expectedPaymentDate: str | None = None
    notes: str | None = None


class SaleCreate(SaleBase):
    pass


class Sale(SaleBase):
    id: str
    invoice: str
    customer: str
    cashier: str
    at: str


class SaleListResponse(BaseModel):
    items: list[Sale]
    total: int
