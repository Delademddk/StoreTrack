import copy
from app.mock_data.seed import (
    seed_products, seed_categories, seed_users, seed_customers,
    seed_sales, seed_ledger_entries, seed_activity, seed_audit_log,
    seed_revenue_series, seed_best_sellers, seed_category_breakdown,
)


class DataStore:
    def __init__(self):
        self.products: list[dict] = seed_products()
        self.categories: list[dict] = seed_categories()
        self.users: list[dict] = seed_users()
        self.customers: list[dict] = seed_customers()
        self.sales: list[dict] = seed_sales()
        self.ledger_entries: list[dict] = seed_ledger_entries()
        self.activity: list[dict] = seed_activity()
        self.audit_log: list[dict] = seed_audit_log()
        self.revenue_series: list[dict] = seed_revenue_series()
        self.best_sellers: list[dict] = seed_best_sellers()
        self.category_breakdown: list[dict] = seed_category_breakdown()
        self.settings = {
            "store": {
                "storeName": "StoreTrack Demo Store",
                "email": "admin@storetrack.com",
                "phone": "+1 555 0123",
                "currency": "USD",
                "address": "123 Main Street, Nairobi, Kenya",
            },
            "inventory": {
                "defaultLowStockThreshold": 10,
                "taxRate": 16.0,
                "receiptFooter": "Thank you for shopping with us!",
                "barcodeScanning": True,
                "lowStockAlerts": True,
            },
            "security": {
                "twoFactorAuth": False,
                "sessionTimeout": True,
            },
        }
        self.backups: list[dict] = []
        self._next_invoice = 9205

    def next_invoice(self) -> str:
        inv = f"INV-{self._next_invoice}"
        self._next_invoice += 1
        return inv

    def copy(self):
        return copy.deepcopy(self)


store = DataStore()
