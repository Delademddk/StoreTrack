from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    totalProducts: int
    itemsInStock: int
    todaySales: float
    todayOrders: int
    weeklyRevenue: float
    inventoryValue: float
    lowStock: int
    outOfStock: int


class RevenuePoint(BaseModel):
    day: str
    revenue: float
    orders: int


class BestSeller(BaseModel):
    name: str
    units: int
    revenue: float


class CategoryBreakdown(BaseModel):
    name: str
    value: float


class ActivityEntry(BaseModel):
    id: str
    kind: str
    title: str
    description: str
    actor: str
    at: str


class AuditEntry(BaseModel):
    id: str
    at: str
    user: str
    action: str
    target: str
    description: str


class LowStockProduct(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    currentStock: int
    threshold: int
    burnRate: float
    daysToStockout: float


class ReportMetrics(BaseModel):
    dailySales: float
    weeklyRevenue: float
    monthlyRevenue: float
    inventoryValue: float
