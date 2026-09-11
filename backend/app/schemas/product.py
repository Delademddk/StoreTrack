from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    category: str
    brand: str
    supplier: str
    isBoxed: bool = True
    boxes: int = 0
    itemsPerBox: int = 1
    extraPieces: int = 0
    pricePerBox: float = 0
    individualPrice: float = 0
    lowStockThreshold: int = 10
    description: str = ""
    barcode: str | None = None
    image: str | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    brand: str | None = None
    supplier: str | None = None
    isBoxed: bool | None = None
    boxes: int | None = None
    itemsPerBox: int | None = None
    extraPieces: int | None = None
    pricePerBox: float | None = None
    individualPrice: float | None = None
    lowStockThreshold: int | None = None
    description: str | None = None
    barcode: str | None = None
    image: str | None = None


class Product(ProductBase):
    id: str
    sku: str
    createdAt: str
    updatedAt: str


class RestockRequest(BaseModel):
    addBoxes: int = 0
    addPieces: int = 0
    reason: str = "Supplier Delivery"
    notes: str = ""


class ProductListResponse(BaseModel):
    items: list[Product]
    total: int
