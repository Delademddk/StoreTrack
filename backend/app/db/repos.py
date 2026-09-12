from datetime import datetime, timezone
from app.db.database import get_raw_connection


def _now():
    return datetime.now(timezone.utc)


def _dict_from_row(row, columns):
    if row is None:
        return None
    return {columns[i]: row[i] for i in range(len(columns))}


def _dict_list(rows, columns):
    return [_dict_from_row(r, columns) for r in rows]


class ProductRepository:
    def get_all(self, q: str = "", category: str = "", status: str = "") -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT p.Id, p.Sku, p.Name, p.Description, p.CategoryId,
                       c.Name AS CategoryName, p.Brand, p.Supplier,
                       p.IsBoxed, p.Boxes, p.ItemsPerBox, p.ExtraPieces,
                       p.PricePerBox, p.IndividualPrice, p.LowStockThreshold,
                       p.Barcode, p.Image, p.CreatedAt, p.UpdatedAt,
                       CASE
                         WHEN p.IsBoxed = 1 THEN p.Boxes * p.ItemsPerBox + p.ExtraPieces
                         ELSE p.ExtraPieces
                       END AS TotalQuantity,
                       CASE
                         WHEN (CASE WHEN p.IsBoxed = 1 THEN p.Boxes * p.ItemsPerBox + p.ExtraPieces ELSE p.ExtraPieces END) = 0 THEN 'out_of_stock'
                         WHEN (CASE WHEN p.IsBoxed = 1 THEN p.Boxes * p.ItemsPerBox + p.ExtraPieces ELSE p.ExtraPieces END) <= p.LowStockThreshold THEN 'low_stock'
                         ELSE 'in_stock'
                       END AS StockStatus
                FROM app.Products p
                LEFT JOIN app.Categories c ON p.CategoryId = c.Id
                WHERE 1=1
            """
            params = []
            if q:
                query += " AND (LOWER(p.Name) LIKE LOWER(?) OR LOWER(p.Sku) LIKE LOWER(?) OR LOWER(p.Brand) LIKE LOWER(?))"
                ql = f"%{q}%"
                params.extend([ql, ql, ql])
            if category:
                query += " AND c.Name = ?"
                params.append(category)
            if status:
                query += " AND CASE"
                query += "   WHEN (CASE WHEN p.IsBoxed=1 THEN p.Boxes*p.ItemsPerBox+p.ExtraPieces ELSE p.ExtraPieces END) = 0 THEN 'out_of_stock'"
                query += "   WHEN (CASE WHEN p.IsBoxed=1 THEN p.Boxes*p.ItemsPerBox+p.ExtraPieces ELSE p.ExtraPieces END) <= p.LowStockThreshold THEN 'low_stock'"
                query += "   ELSE 'in_stock'"
                query += " END = ?"
                params.append(status)

            cursor.execute(query, params)
            cols = [d[0] for d in cursor.description]
            rows = cursor.fetchall()
            return _dict_list(rows, cols)
        finally:
            conn.close()

    def get_by_id(self, product_id: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.Id, p.Sku, p.Name, p.Description, p.CategoryId,
                       c.Name AS CategoryName, p.Brand, p.Supplier,
                       p.IsBoxed, p.Boxes, p.ItemsPerBox, p.ExtraPieces,
                       p.PricePerBox, p.IndividualPrice, p.LowStockThreshold,
                       p.Barcode, p.Image, p.CreatedAt, p.UpdatedAt,
                       CASE
                         WHEN p.IsBoxed = 1 THEN p.Boxes * p.ItemsPerBox + p.ExtraPieces
                         ELSE p.ExtraPieces
                       END AS TotalQuantity,
                       CASE
                         WHEN (CASE WHEN p.IsBoxed=1 THEN p.Boxes*p.ItemsPerBox+p.ExtraPieces ELSE p.ExtraPieces END) = 0 THEN 'out_of_stock'
                         WHEN (CASE WHEN p.IsBoxed=1 THEN p.Boxes*p.ItemsPerBox+p.ExtraPieces ELSE p.ExtraPieces END) <= p.LowStockThreshold THEN 'low_stock'
                         ELSE 'in_stock'
                       END AS StockStatus
                FROM app.Products p
                LEFT JOIN app.Categories c ON p.CategoryId = c.Id
                WHERE p.Id = ?
            """, product_id)
            cols = [d[0] for d in cursor.description]
            row = cursor.fetchone()
            return _dict_from_row(row, cols)
        finally:
            conn.close()

    def create(self, product: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.Products
                    (Id, Sku, Name, Description, CategoryId, Brand, Supplier,
                     IsBoxed, Boxes, ItemsPerBox, ExtraPieces,
                     PricePerBox, IndividualPrice, LowStockThreshold,
                     Barcode, Image, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                product["id"], product["sku"], product["name"],
                product.get("description", ""), product["categoryId"],
                product.get("brand", ""), product.get("supplier", ""),
                product.get("isBoxed", True), product.get("boxes", 0),
                product.get("itemsPerBox", 1), product.get("extraPieces", 0),
                product.get("pricePerBox", 0), product.get("individualPrice", 0),
                product.get("lowStockThreshold", 10),
                product.get("barcode", ""), product.get("image", ""),
                product.get("createdAt", _now().isoformat()),
                product.get("updatedAt", _now().isoformat()),
            )
            conn.commit()
            return self.get_by_id(product["id"])
        finally:
            conn.close()

    def update(self, product_id: str, data: dict) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {
                "name": "Name", "description": "Description", "categoryId": "CategoryId",
                "brand": "Brand", "supplier": "Supplier", "isBoxed": "IsBoxed",
                "boxes": "Boxes", "itemsPerBox": "ItemsPerBox", "extraPieces": "ExtraPieces",
                "pricePerBox": "PricePerBox", "individualPrice": "IndividualPrice",
                "lowStockThreshold": "LowStockThreshold", "barcode": "Barcode",
                "image": "Image", "updatedAt": "UpdatedAt",
            }
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if not set_clauses:
                return self.get_by_id(product_id)
            params.append(product_id)
            cursor.execute(
                f"UPDATE app.Products SET {', '.join(set_clauses)} WHERE Id = ?",
                params,
            )
            conn.commit()
            return self.get_by_id(product_id)
        finally:
            conn.close()

    def delete(self, product_id: str) -> bool:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM app.Products WHERE Id = ?", product_id)
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def count(self) -> int:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM app.Products")
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def total_stock(self) -> int:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ISNULL(SUM(
                    CASE WHEN IsBoxed = 1 THEN Boxes * ItemsPerBox + ExtraPieces
                    ELSE ExtraPieces END
                ), 0) FROM app.Products
            """)
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def inventory_value(self) -> float:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ISNULL(SUM(
                    CASE WHEN IsBoxed = 1 THEN Boxes * ItemsPerBox + ExtraPieces
                    ELSE ExtraPieces END * IndividualPrice
                ), 0) FROM app.Products
            """)
            return float(cursor.fetchone()[0])
        finally:
            conn.close()

    def low_stock_count(self) -> int:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM app.vw_LowStockProducts")
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def out_of_stock_count(self) -> int:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM app.Products
                WHERE (CASE WHEN IsBoxed=1 THEN Boxes*ItemsPerBox+ExtraPieces ELSE ExtraPieces END) = 0
            """)
            return cursor.fetchone()[0]
        finally:
            conn.close()


class CategoryRepository:
    def get_all(self) -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT Id, Name, Color, Icon, Description, CreatedAt FROM app.Categories ORDER BY Name")
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def get_by_id(self, cat_id: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT Id, Name, Color, Icon, Description, CreatedAt FROM app.Categories WHERE Id = ?", cat_id)
            cols = [d[0] for d in cursor.description]
            return _dict_from_row(cursor.fetchone(), cols)
        finally:
            conn.close()

    def get_by_name(self, name: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT Id, Name, Color, Icon, Description, CreatedAt FROM app.Categories WHERE Name = ?", name)
            cols = [d[0] for d in cursor.description]
            return _dict_from_row(cursor.fetchone(), cols)
        finally:
            conn.close()

    def create(self, category: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.Categories (Id, Name, Color, Icon, Description, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                category["id"], category["name"],
                category.get("color", "#6b7280"), category.get("icon", "Package"),
                category.get("description", ""),
                category.get("createdAt", _now().isoformat()),
            )
            conn.commit()
            return self.get_by_id(category["id"])
        finally:
            conn.close()

    def update(self, cat_id: str, data: dict) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {"name": "Name", "color": "Color", "icon": "Icon", "description": "Description"}
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if not set_clauses:
                return self.get_by_id(cat_id)
            params.append(cat_id)
            cursor.execute(f"UPDATE app.Categories SET {', '.join(set_clauses)} WHERE Id = ?", params)
            conn.commit()
            return self.get_by_id(cat_id)
        finally:
            conn.close()

    def delete(self, cat_id: str) -> bool:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM app.Categories WHERE Id = ?", cat_id)
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


class UserRepository:
    def get_all(self, q: str = "", role: str = "") -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT u.Id, u.Username, u.Name, u.Email, u.Phone,
                       r.Name AS Role, u.Status, u.LastActive, u.CreatedAt, u.UpdatedAt,
                       u.PasswordHash
                FROM app.Users u
                LEFT JOIN app.Roles r ON u.RoleId = r.Id
                WHERE 1=1
            """
            params = []
            if q:
                query += " AND (LOWER(u.Name) LIKE LOWER(?) OR LOWER(u.Username) LIKE LOWER(?) OR LOWER(u.Email) LIKE LOWER(?))"
                ql = f"%{q}%"
                params.extend([ql, ql, ql])
            if role:
                query += " AND r.Name = ?"
                params.append(role)
            cursor.execute(query, params)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def get_by_id(self, user_id: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.Id, u.Username, u.Name, u.Email, u.Phone,
                       r.Name AS Role, u.Status, u.LastActive, u.CreatedAt, u.UpdatedAt,
                       u.PasswordHash
                FROM app.Users u
                LEFT JOIN app.Roles r ON u.RoleId = r.Id
                WHERE u.Id = ?
            """, user_id)
            cols = [d[0] for d in cursor.description]
            return _dict_from_row(cursor.fetchone(), cols)
        finally:
            conn.close()

    def get_by_username(self, username: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.Id, u.Username, u.Name, u.Email, u.Phone,
                       r.Name AS Role, u.Status, u.LastActive, u.CreatedAt, u.UpdatedAt,
                       u.PasswordHash
                FROM app.Users u
                LEFT JOIN app.Roles r ON u.RoleId = r.Id
                WHERE u.Username = ?
            """, username)
            cols = [d[0] for d in cursor.description]
            return _dict_from_row(cursor.fetchone(), cols)
        finally:
            conn.close()

    def create(self, user: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.Users (Id, Username, PasswordHash, Name, Email, Phone, RoleId, Status, LastActive, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                user["id"], user["username"], user["passwordHash"],
                user["name"], user["email"], user.get("phone", ""),
                user["roleId"], user.get("status", "Active"),
                user.get("lastActive", ""),
                user.get("createdAt", _now().isoformat()),
                user.get("updatedAt", _now().isoformat()),
            )
            conn.commit()
            return self.get_by_id(user["id"])
        finally:
            conn.close()

    def update(self, user_id: str, data: dict) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {
                "name": "Name", "email": "Email", "phone": "Phone",
                "status": "Status", "lastActive": "LastActive",
                "passwordHash": "PasswordHash", "roleId": "RoleId",
                "updatedAt": "UpdatedAt",
            }
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if not set_clauses:
                return self.get_by_id(user_id)
            params.append(user_id)
            cursor.execute(f"UPDATE app.Users SET {', '.join(set_clauses)} WHERE Id = ?", params)
            conn.commit()
            return self.get_by_id(user_id)
        finally:
            conn.close()

    def delete(self, user_id: str) -> bool:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM app.Users WHERE Id = ?", user_id)
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def get_role_id(self, role_name: str) -> str | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT Id FROM app.Roles WHERE Name = ?", role_name)
            row = cursor.fetchone()
            return row[0] if row else None
        finally:
            conn.close()

    def get_permissions(self, user_id: str) -> list[str]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.Name
                FROM app.Permissions p
                INNER JOIN app.RolePermissions rp ON p.Id = rp.PermissionId
                INNER JOIN app.Users u ON rp.RoleId = u.RoleId
                WHERE u.Id = ?
            """, user_id)
            return [row[0] for row in cursor.fetchall()]
        finally:
            conn.close()


class CustomerRepository:
    def get_all(self, q: str = "", filter_status: str = "", sort: str = "") -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT c.Id, c.Name, c.Phone, c.Address, c.Notes, c.CreatedAt, c.UpdatedAt,
                       ISNULL(cb.TotalPurchases, 0) AS TotalPurchases,
                       ISNULL(cb.TotalPaid, 0) AS TotalPaid,
                       ISNULL(cb.Outstanding, 0) AS Outstanding,
                       cb.LastPurchaseAt, cb.LastActivityAt
                FROM app.Customers c
                LEFT JOIN app.vw_CreditorBalances cb ON c.Id = cb.CustomerId
                WHERE 1=1
            """
            params = []
            if q:
                query += " AND (LOWER(c.Name) LIKE LOWER(?) OR LOWER(c.Phone) LIKE LOWER(?))"
                ql = f"%{q}%"
                params.extend([ql, ql])
            query += " ORDER BY c.Name"
            cursor.execute(query, params)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def get_by_id(self, customer_id: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT Id, Name, Phone, Address, Notes, CreatedAt, UpdatedAt FROM app.Customers WHERE Id = ?", customer_id)
            cols = [d[0] for d in cursor.description]
            return _dict_from_row(cursor.fetchone(), cols)
        finally:
            conn.close()

    def create(self, customer: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.Customers (Id, Name, Phone, Address, Notes, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                customer["id"], customer["name"], customer["phone"],
                customer.get("address", ""), customer.get("notes", ""),
                customer.get("createdAt", _now().isoformat()),
                customer.get("updatedAt", _now().isoformat()),
            )
            conn.commit()
            return self.get_by_id(customer["id"])
        finally:
            conn.close()

    def update(self, customer_id: str, data: dict) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {"name": "Name", "phone": "Phone", "address": "Address", "notes": "Notes", "updatedAt": "UpdatedAt"}
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if not set_clauses:
                return self.get_by_id(customer_id)
            params.append(customer_id)
            cursor.execute(f"UPDATE app.Customers SET {', '.join(set_clauses)} WHERE Id = ?", params)
            conn.commit()
            return self.get_by_id(customer_id)
        finally:
            conn.close()

    def delete(self, customer_id: str) -> bool:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM app.Customers WHERE Id = ?", customer_id)
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()


class SaleRepository:
    def get_all(self, q: str = "") -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            query = """
                SELECT s.Id, s.Invoice, s.CustomerId, s.CustomerName, s.CashierName,
                       s.UserId, s.Subtotal, s.Discount, s.Total, s.Method,
                       s.OnCredit, s.AmountPaid, s.Notes, s.SoldAt,
                       ISNULL(si.ItemCount, 0) AS ItemCount
                FROM app.Sales s
                LEFT JOIN (
                    SELECT SaleId, COUNT(*) AS ItemCount
                    FROM app.SaleItems
                    GROUP BY SaleId
                ) si ON s.Id = si.SaleId
                WHERE 1=1
            """
            params = []
            if q:
                query += " AND (LOWER(s.Invoice) LIKE LOWER(?) OR LOWER(s.CustomerName) LIKE LOWER(?))"
                ql = f"%{q}%"
                params.extend([ql, ql])
            query += " ORDER BY s.SoldAt DESC"
            cursor.execute(query, params)
            cols = [d[0] for d in cursor.description]
            rows = cursor.fetchall()
            sales = _dict_list(rows, cols)

            for sale in sales:
                cursor2 = conn.cursor()
                cursor2.execute("""
                    SELECT Id, ProductId, ProductName, Quantity, UnitPrice, Subtotal
                    FROM app.SaleItems WHERE SaleId = ?
                """, sale["Id"])
                item_cols = [d[0] for d in cursor2.description]
                sale["Items"] = _dict_list(cursor2.fetchall(), item_cols)

            return sales
        finally:
            conn.close()

    def get_by_id(self, sale_id: str) -> dict | None:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT s.Id, s.Invoice, s.CustomerId, s.CustomerName, s.CashierName,
                       s.UserId, s.Subtotal, s.Discount, s.Total, s.Method,
                       s.OnCredit, s.AmountPaid, s.Notes, s.SoldAt
                FROM app.Sales s WHERE s.Id = ?
            """, sale_id)
            cols = [d[0] for d in cursor.description]
            sale = _dict_from_row(cursor.fetchone(), cols)
            if sale:
                cursor2 = conn.cursor()
                cursor2.execute("""
                    SELECT Id, ProductId, ProductName, Quantity, UnitPrice, Subtotal
                    FROM app.SaleItems WHERE SaleId = ?
                """, sale_id)
                item_cols = [d[0] for d in cursor2.description]
                sale["Items"] = _dict_list(cursor2.fetchall(), item_cols)
            return sale
        finally:
            conn.close()

    def create(self, sale: dict, items: list[dict]) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.Sales
                    (Id, Invoice, CustomerId, CustomerName, CashierName, UserId,
                     Subtotal, Discount, Tax, Total, Method, OnCredit, AmountPaid, Notes, SoldAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
            """,
                sale["id"], sale["invoice"], sale.get("customerId"),
                sale.get("customerName", "Walk-in"), sale["cashierName"],
                sale.get("userId"), sale["subtotal"], sale.get("discount", 0),
                sale["total"], sale.get("method", "Cash"),
                sale.get("onCredit", False), sale.get("amountPaid"),
                sale.get("notes"), sale.get("soldAt", _now().isoformat()),
            )
            for item in items:
                cursor.execute("""
                    INSERT INTO app.SaleItems (Id, SaleId, ProductId, ProductName, Quantity, UnitPrice)
                    VALUES (?, ?, ?, ?, ?, ?)
                """,
                    item["id"], sale["id"], item["productId"],
                    item["productName"], item["quantity"], item["unitPrice"],
                )
            conn.commit()
            return self.get_by_id(sale["id"])
        finally:
            conn.close()

    def today_sales(self) -> tuple[float, int]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ISNULL(SUM(Total), 0), COUNT(*)
                FROM app.Sales
                WHERE CAST(SoldAt AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
            """)
            row = cursor.fetchone()
            return float(row[0]), row[1]
        finally:
            conn.close()

    def weekly_revenue(self) -> float:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ISNULL(SUM(Total), 0)
                FROM app.Sales
                WHERE SoldAt >= DATEADD(DAY, -7, SYSUTCDATETIME())
            """)
            return float(cursor.fetchone()[0])
        finally:
            conn.close()

    def sales_for_product(self, product_id: str) -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT s.Id, s.Invoice, s.CustomerName, s.CashierName,
                       s.Subtotal, s.Discount, s.Total, s.Method, s.SoldAt
                FROM app.Sales s
                INNER JOIN app.SaleItems si ON s.Id = si.SaleId
                WHERE si.ProductId = ?
                ORDER BY s.SoldAt DESC
            """, product_id)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def next_invoice(self) -> str:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT dbo.fn_NextInvoice()")
            return cursor.fetchone()[0]
        finally:
            conn.close()


class LedgerRepository:
    def get_by_customer(self, customer_id: str) -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, CustomerId, Kind, Amount, BalanceAfter, Method,
                       Reference, Notes, SaleId, ExpectedPaymentDate,
                       LineSummary, EntryAt
                FROM app.LedgerEntries
                WHERE CustomerId = ?
                ORDER BY EntryAt DESC
            """, customer_id)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def create(self, entry: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.LedgerEntries
                    (Id, CustomerId, Kind, Amount, BalanceAfter, Method,
                     Reference, Notes, SaleId, ExpectedPaymentDate, LineSummary, EntryAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                entry["id"], entry["customerId"], entry["kind"],
                entry["amount"], entry["balanceAfter"],
                entry.get("method"), entry.get("reference"),
                entry.get("notes"), entry.get("saleId"),
                entry.get("expectedPaymentDate"), entry.get("lineSummary"),
                entry.get("entryAt", _now().isoformat()),
            )
            conn.commit()
            return entry
        finally:
            conn.close()

    def summary(self, customer_id: str) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    ISNULL(SUM(CASE WHEN Kind = 'credit_sale' THEN Amount ELSE 0 END), 0) AS TotalPurchases,
                    ISNULL(SUM(CASE WHEN Kind = 'payment' THEN Amount ELSE 0 END), 0) AS TotalPaid,
                    ISNULL(SUM(CASE WHEN Kind = 'credit_sale' THEN Amount ELSE -Amount END), 0) AS Outstanding
                FROM app.LedgerEntries
                WHERE CustomerId = ?
            """, customer_id)
            row = cursor.fetchone()
            total_purchases = float(row[0])
            total_paid = float(row[1])
            outstanding = float(row[2])

            cursor.execute("""
                SELECT TOP 1 EntryAt FROM app.LedgerEntries
                WHERE CustomerId = ? AND Kind = 'credit_sale'
                ORDER BY EntryAt DESC
            """, customer_id)
            last_purchase_row = cursor.fetchone()
            last_purchase = last_purchase_row[0].isoformat() if last_purchase_row and last_purchase_row[0] else None

            cursor.execute("""
                SELECT TOP 1 EntryAt FROM app.LedgerEntries
                WHERE CustomerId = ?
                ORDER BY EntryAt DESC
            """, customer_id)
            last_activity_row = cursor.fetchone()
            last_activity = last_activity_row[0].isoformat() if last_activity_row and last_activity_row[0] else None

            cursor.execute("""
                SELECT TOP 1 ExpectedPaymentDate FROM app.LedgerEntries
                WHERE CustomerId = ? AND Kind = 'credit_sale' AND ExpectedPaymentDate IS NOT NULL
                ORDER BY EntryAt DESC
            """, customer_id)
            due_row = cursor.fetchone()
            next_due = due_row[0] if due_row else None

            status = "clear"
            if outstanding > 0:
                if next_due:
                    try:
                        from datetime import datetime as dt
                        due_dt = dt.fromisoformat(next_due.replace("Z", "+00:00")) if "T" in next_due else dt.strptime(next_due, "%Y-%m-%d")
                        if due_dt.date() < _now().date():
                            status = "overdue"
                        else:
                            status = "outstanding"
                    except (ValueError, TypeError):
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
        finally:
            conn.close()


class ActivityRepository:
    def get_all(self) -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, Kind, Title, Description, Actor, OccurredAt
                FROM app.ActivityLog
                ORDER BY OccurredAt DESC
            """)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def add(self, entry: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.ActivityLog (Id, Kind, Title, Description, Actor, OccurredAt)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                entry["id"], entry["kind"], entry["title"],
                entry.get("description", ""), entry["actor"],
                entry.get("occurredAt", _now().isoformat()),
            )
            conn.commit()
            return entry
        finally:
            conn.close()


class AuditRepository:
    def get_all(self) -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT Id, UserId, UserName, Action, Target, Description, OccurredAt
                FROM app.AuditLog
                ORDER BY OccurredAt DESC
            """)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def get_for_product(self, product_id: str) -> list[dict]:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.Id, a.UserId, a.UserName, a.Action, a.Target, a.Description, a.OccurredAt
                FROM app.AuditLog a
                INNER JOIN app.Products p ON a.Target = p.Sku
                WHERE p.Id = ?
                ORDER BY a.OccurredAt DESC
            """, product_id)
            cols = [d[0] for d in cursor.description]
            return _dict_list(cursor.fetchall(), cols)
        finally:
            conn.close()

    def add(self, entry: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO app.AuditLog (Id, UserId, UserName, Action, Target, Description, OccurredAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                entry["id"], entry.get("userId"), entry["userName"],
                entry["action"], entry.get("target", ""),
                entry.get("description", ""),
                entry.get("occurredAt", _now().isoformat()),
            )
            conn.commit()
            return entry
        finally:
            conn.close()


class SettingsRepository:
    def get(self) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM app.Settings WHERE Id = 'default'")
            cols = [d[0] for d in cursor.description]
            row = cursor.fetchone()
            if not row:
                return {}
            d = _dict_from_row(row, cols)
            return {
                "store": {
                    "storeName": d.get("StoreName", ""),
                    "email": d.get("Email", ""),
                    "phone": d.get("Phone", ""),
                    "currency": d.get("Currency", "GHS"),
                    "address": d.get("Address", ""),
                },
                "inventory": {
                    "defaultLowStockThreshold": d.get("LowStockThreshold", 10),
                    "taxRate": float(d.get("TaxRate", 0)),
                    "receiptFooter": d.get("ReceiptFooter", ""),
                    "barcodeScanning": bool(d.get("BarcodeScanning", True)),
                    "lowStockAlerts": bool(d.get("LowStockAlerts", True)),
                },
                "security": {
                    "twoFactorAuth": bool(d.get("TwoFactorAuth", False)),
                    "sessionTimeout": bool(d.get("SessionTimeout", True)),
                },
            }
        finally:
            conn.close()

    def update_store(self, data: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {
                "storeName": "StoreName", "email": "Email", "phone": "Phone",
                "currency": "Currency", "address": "Address",
            }
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if set_clauses:
                cursor.execute(f"UPDATE app.Settings SET {', '.join(set_clauses)} WHERE Id = 'default'", params)
                conn.commit()
            return self.get()
        finally:
            conn.close()

    def update_inventory(self, data: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {
                "defaultLowStockThreshold": "LowStockThreshold",
                "taxRate": "TaxRate", "receiptFooter": "ReceiptFooter",
                "barcodeScanning": "BarcodeScanning", "lowStockAlerts": "LowStockAlerts",
            }
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if set_clauses:
                cursor.execute(f"UPDATE app.Settings SET {', '.join(set_clauses)} WHERE Id = 'default'", params)
                conn.commit()
            return self.get()
        finally:
            conn.close()

    def update_security(self, data: dict) -> dict:
        conn = get_raw_connection()
        try:
            cursor = conn.cursor()
            set_clauses = []
            params = []
            field_map = {"twoFactorAuth": "TwoFactorAuth", "sessionTimeout": "SessionTimeout"}
            for key, val in data.items():
                if key in field_map:
                    set_clauses.append(f"{field_map[key]} = ?")
                    params.append(val)
            if set_clauses:
                cursor.execute(f"UPDATE app.Settings SET {', '.join(set_clauses)} WHERE Id = 'default'", params)
                conn.commit()
            return self.get()
        finally:
            conn.close()


product_repo = ProductRepository()
category_repo = CategoryRepository()
user_repo = UserRepository()
customer_repo = CustomerRepository()
sale_repo = SaleRepository()
ledger_repo = LedgerRepository()
activity_repo = ActivityRepository()
audit_repo = AuditRepository()
settings_repo = SettingsRepository()
