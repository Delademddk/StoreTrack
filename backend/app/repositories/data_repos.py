from app.mock_data.store import store


def get_total_qty(product: dict) -> int:
    if product.get("isBoxed"):
        return product.get("boxes", 0) * product.get("itemsPerBox", 0) + product.get("extraPieces", 0)
    return product.get("extraPieces", 0)


def get_stock_status(product: dict) -> str:
    total = get_total_qty(product)
    threshold = product.get("lowStockThreshold", 10)
    if total == 0:
        return "out_of_stock"
    if total <= threshold:
        return "low_stock"
    return "in_stock"


class ProductRepository:
    def get_all(self, q: str = "", category: str = "", status: str = "") -> list[dict]:
        items = store.products
        if q:
            ql = q.lower()
            items = [p for p in items if ql in p["name"].lower() or ql in p["sku"].lower() or ql in p.get("brand", "").lower()]
        if category:
            items = [p for p in items if p["category"] == category]
        if status:
            items = [p for p in items if get_stock_status(p) == status]
        return items

    def get_by_id(self, product_id: str) -> dict | None:
        return next((p for p in store.products if p["id"] == product_id), None)

    def create(self, product: dict) -> dict:
        store.products.append(product)
        return product

    def update(self, product_id: str, data: dict) -> dict | None:
        product = self.get_by_id(product_id)
        if not product:
            return None
        product.update(data)
        return product

    def delete(self, product_id: str) -> bool:
        before = len(store.products)
        store.products = [p for p in store.products if p["id"] != product_id]
        return len(store.products) < before

    def count(self) -> int:
        return len(store.products)

    def total_stock(self) -> int:
        return sum(get_total_qty(p) for p in store.products)

    def inventory_value(self) -> float:
        return sum(get_total_qty(p) * p.get("individualPrice", 0) for p in store.products)

    def low_stock_count(self) -> int:
        return sum(1 for p in store.products if get_stock_status(p) == "low_stock")

    def out_of_stock_count(self) -> int:
        return sum(1 for p in store.products if get_stock_status(p) == "out_of_stock")


class CategoryRepository:
    def get_all(self) -> list[dict]:
        return store.categories

    def get_by_id(self, cat_id: str) -> dict | None:
        return next((c for c in store.categories if c["id"] == cat_id), None)

    def get_by_name(self, name: str) -> dict | None:
        return next((c for c in store.categories if c["name"] == name), None)

    def create(self, category: dict) -> dict:
        store.categories.append(category)
        return category

    def update(self, cat_id: str, data: dict) -> dict | None:
        cat = self.get_by_id(cat_id)
        if not cat:
            return None
        cat.update(data)
        return cat

    def delete(self, cat_id: str) -> bool:
        before = len(store.categories)
        store.categories = [c for c in store.categories if c["id"] != cat_id]
        return len(store.categories) < before


class UserRepository:
    def get_all(self, q: str = "", role: str = "") -> list[dict]:
        items = store.users
        if q:
            ql = q.lower()
            items = [u for u in items if ql in u["name"].lower() or ql in u["username"].lower() or ql in u["email"].lower()]
        if role:
            items = [u for u in items if u["role"] == role]
        return items

    def get_by_id(self, user_id: str) -> dict | None:
        return next((u for u in store.users if u["id"] == user_id), None)

    def get_by_username(self, username: str) -> dict | None:
        return next((u for u in store.users if u["username"] == username), None)

    def create(self, user: dict) -> dict:
        store.users.append(user)
        return user

    def update(self, user_id: str, data: dict) -> dict | None:
        user = self.get_by_id(user_id)
        if not user:
            return None
        user.update(data)
        return user

    def delete(self, user_id: str) -> bool:
        before = len(store.users)
        store.users = [u for u in store.users if u["id"] != user_id]
        return len(store.users) < before


class CustomerRepository:
    def get_all(self, q: str = "", filter_status: str = "", sort: str = "") -> list[dict]:
        items = store.customers
        if q:
            ql = q.lower()
            items = [c for c in items if ql in c["name"].lower() or ql in c["phone"].lower()]
        return items

    def get_by_id(self, customer_id: str) -> dict | None:
        return next((c for c in store.customers if c["id"] == customer_id), None)

    def create(self, customer: dict) -> dict:
        store.customers.append(customer)
        return customer

    def update(self, customer_id: str, data: dict) -> dict | None:
        customer = self.get_by_id(customer_id)
        if not customer:
            return None
        customer.update(data)
        return customer

    def delete(self, customer_id: str) -> bool:
        before = len(store.customers)
        store.customers = [c for c in store.customers if c["id"] != customer_id]
        return len(store.customers) < before


class SaleRepository:
    def get_all(self, q: str = "") -> list[dict]:
        items = sorted(store.sales, key=lambda s: s["at"], reverse=True)
        if q:
            ql = q.lower()
            items = [s for s in items if ql in s["invoice"].lower() or ql in s["customer"].lower()]
        return items

    def get_by_id(self, sale_id: str) -> dict | None:
        return next((s for s in store.sales if s["id"] == sale_id), None)

    def create(self, sale: dict) -> dict:
        store.sales.append(sale)
        return sale

    def today_sales(self) -> tuple[float, int]:
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).date()
        total = 0.0
        count = 0
        for s in store.sales:
            try:
                d = datetime.fromisoformat(s["at"]).date()
                if d == today:
                    total += s["total"]
                    count += 1
            except (ValueError, KeyError):
                pass
        return total, count

    def weekly_revenue(self) -> float:
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        total = 0.0
        for s in store.sales:
            try:
                d = datetime.fromisoformat(s["at"])
                if d >= week_ago:
                    total += s["total"]
            except (ValueError, KeyError):
                pass
        return total

    def sales_for_product(self, product_id: str) -> list[dict]:
        return [s for s in store.sales if any(i.get("productId") == product_id for i in s.get("items", []))]


class LedgerRepository:
    def get_by_customer(self, customer_id: str) -> list[dict]:
        entries = [e for e in store.ledger_entries if e["customerId"] == customer_id]
        return sorted(entries, key=lambda e: e["at"], reverse=True)

    def create(self, entry: dict) -> dict:
        store.ledger_entries.append(entry)
        return entry

    def summary(self, customer_id: str) -> dict:
        entries = self.get_by_customer(customer_id)
        total_purchases = sum(e["amount"] for e in entries if e["kind"] == "purchase")
        total_paid = sum(e["amount"] for e in entries if e["kind"] == "payment")
        outstanding = total_purchases - total_paid
        purchase_entries = [e for e in entries if e["kind"] == "purchase"]
        last_purchase = max((e["at"] for e in purchase_entries), default=None)
        payment_entries = [e for e in entries if e["kind"] == "payment"]
        last_activity = max((e["at"] for e in entries), default=None)
        due_dates = [e.get("expectedPaymentDate") for e in purchase_entries if e.get("expectedPaymentDate")]
        next_due = max(due_dates, default=None) if due_dates else None

        status = "clear"
        if outstanding > 0:
            from datetime import datetime, timezone
            if next_due:
                try:
                    due_dt = datetime.fromisoformat(next_due)
                    if due_dt.date() < datetime.now(timezone.utc).date():
                        status = "overdue"
                    else:
                        status = "outstanding"
                except ValueError:
                    status = "outstanding"
            else:
                status = "outstanding"

        return {
            "totalPurchases": total_purchases,
            "totalPaid": total_paid,
            "outstanding": outstanding,
            "lastPurchaseAt": last_purchase,
            "lastActivityAt": last_activity,
            "nextDueAt": next_due,
            "status": status,
        }


class ActivityRepository:
    def get_all(self) -> list[dict]:
        return sorted(store.activity, key=lambda a: a["at"], reverse=True)


class AuditRepository:
    def get_all(self) -> list[dict]:
        return sorted(store.audit_log, key=lambda a: a["at"], reverse=True)

    def get_for_product(self, product_id: str) -> list[dict]:
        product = ProductRepository().get_by_id(product_id)
        if not product:
            return []
        sku = product.get("sku", "")
        return [a for a in store.audit_log if sku in a.get("target", "")]

    def add(self, entry: dict) -> dict:
        store.audit_log.append(entry)
        return entry


product_repo = ProductRepository()
category_repo = CategoryRepository()
user_repo = UserRepository()
customer_repo = CustomerRepository()
sale_repo = SaleRepository()
ledger_repo = LedgerRepository()
activity_repo = ActivityRepository()
audit_repo = AuditRepository()
