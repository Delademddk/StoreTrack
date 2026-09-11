# StoreTrack V3 — Schema Reference

Complete database schema documentation for StoreTrack V3.

## Tables

### 1. Roles

User roles for role-based access control.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Name | NVARCHAR(100) | NOT NULL | Role name (unique) |
| Description | NVARCHAR(500) | NULL | Role description |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

**Seed values:** Admin, Manager, Cashier, Keeper

---

### 2. Permissions

System permissions that can be assigned to roles.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Name | NVARCHAR(200) | NOT NULL | Permission name (unique) |
| Description | NVARCHAR(500) | NULL | Permission description |

**Seed values:** 13 permissions (View Dashboard, View Products, etc.)

---

### 3. RolePermissions

Junction table linking roles to their permissions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| RoleId | NVARCHAR(50) | NOT NULL | FK → Roles |
| PermissionId | NVARCHAR(50) | NOT NULL | FK → Permissions |

**Primary key:** (RoleId, PermissionId)

---

### 4. Users

System users with authentication credentials.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Username | NVARCHAR(100) | NOT NULL | Login username (unique) |
| PasswordHash | NVARCHAR(500) | NOT NULL | Bcrypt password hash |
| Name | NVARCHAR(200) | NOT NULL | Display name |
| Email | NVARCHAR(200) | NOT NULL | Email address (unique) |
| Phone | NVARCHAR(50) | NULL | Phone number |
| RoleId | NVARCHAR(50) | NOT NULL | FK → Roles |
| Status | NVARCHAR(20) | NOT NULL | 'Active' or 'Disabled' |
| LastActive | NVARCHAR(100) | NULL | Human-readable last active |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Constraints:** CHECK (Status IN ('Active', 'Disabled'))

---

### 5. Categories

Product categories.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Name | NVARCHAR(200) | NOT NULL | Category name (unique) |
| Color | NVARCHAR(20) | NULL | Hex color code |
| Icon | NVARCHAR(100) | NULL | Lucide icon name |
| Description | NVARCHAR(1000) | NULL | Category description |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |

---

### 6. Products

Product catalog with box/individual inventory tracking.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Sku | NVARCHAR(100) | NOT NULL | Stock keeping unit (unique) |
| Name | NVARCHAR(500) | NOT NULL | Product name |
| Description | NVARCHAR(2000) | NULL | Product description |
| CategoryId | NVARCHAR(50) | NOT NULL | FK → Categories |
| Brand | NVARCHAR(200) | NULL | Product brand |
| Supplier | NVARCHAR(200) | NULL | Supplier name |
| IsBoxed | BIT | NOT NULL | 1=boxed product, 0=individual |
| Boxes | INT | NOT NULL | Number of sealed boxes |
| ItemsPerBox | INT | NOT NULL | Units per box |
| ExtraPieces | INT | NOT NULL | Loose units / total for non-boxed |
| PricePerBox | DECIMAL(18,2) | NOT NULL | Price per sealed box |
| IndividualPrice | DECIMAL(18,2) | NOT NULL | Price per unit |
| LowStockThreshold | INT | NOT NULL | Low stock alert threshold |
| Barcode | NVARCHAR(100) | NULL | Product barcode |
| Image | NVARCHAR(1000) | NULL | Image URL |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

**Computed total:** `CASE WHEN IsBoxed=1 THEN Boxes*ItemsPerBox+ExtraPieces ELSE ExtraPieces END`

**Constraints:** CHECK (Boxes >= 0), CHECK (ItemsPerBox > 0), CHECK (ExtraPieces >= 0), CHECK (PricePerBox >= 0), CHECK (IndividualPrice >= 0)

---

### 7. Customers

Customer/creditor records.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Name | NVARCHAR(500) | NOT NULL | Customer name |
| Phone | NVARCHAR(50) | NOT NULL | Phone number |
| Address | NVARCHAR(1000) | NULL | Physical address |
| Notes | NVARCHAR(2000) | NULL | Additional notes |
| CreatedAt | DATETIME2 | NOT NULL | Creation timestamp |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

---

### 8. Sales

Sales transactions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Invoice | NVARCHAR(50) | NOT NULL | Invoice number (unique) |
| CustomerId | NVARCHAR(50) | NULL | FK → Customers (NULL for walk-in) |
| CustomerName | NVARCHAR(500) | NULL | Customer display name |
| CashierName | NVARCHAR(200) | NOT NULL | Cashier display name |
| UserId | NVARCHAR(50) | NULL | FK → Users |
| Subtotal | DECIMAL(18,2) | NOT NULL | Pre-discount total |
| Discount | DECIMAL(18,2) | NOT NULL | Discount amount |
| Tax | DECIMAL(18,2) | NOT NULL | Tax amount |
| Total | DECIMAL(18,2) | NOT NULL | Final total |
| Method | NVARCHAR(50) | NOT NULL | 'Cash', 'Card', or 'Mobile Money' |
| OnCredit | BIT | NOT NULL | 1 if sold on credit |
| AmountPaid | DECIMAL(18,2) | NULL | Partial payment amount |
| Notes | NVARCHAR(2000) | NULL | Sale notes |
| SoldAt | DATETIME2 | NOT NULL | Sale timestamp |

**Constraints:** CHECK (Method IN ('Cash', 'Card', 'Mobile Money'))

---

### 9. SaleItems

Individual line items within a sale.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| SaleId | NVARCHAR(50) | NOT NULL | FK → Sales (CASCADE DELETE) |
| ProductId | NVARCHAR(50) | NOT NULL | FK → Products |
| ProductName | NVARCHAR(500) | NOT NULL | Product name at time of sale |
| Quantity | INT | NOT NULL | Units sold |
| UnitPrice | DECIMAL(18,2) | NOT NULL | Price per unit at time of sale |
| Subtotal | DECIMAL(18,2) | COMPUTED | Quantity × UnitPrice (persisted) |

**Constraints:** CHECK (Quantity > 0)

---

### 10. LedgerEntries

Creditor transaction history (purchases and payments).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| CustomerId | NVARCHAR(50) | NOT NULL | FK → Customers |
| Kind | NVARCHAR(20) | NOT NULL | 'purchase' or 'payment' |
| Amount | DECIMAL(18,2) | NOT NULL | Transaction amount |
| BalanceAfter | DECIMAL(18,2) | NOT NULL | Running balance after this entry |
| Method | NVARCHAR(50) | NULL | Payment method (for payments) |
| Reference | NVARCHAR(500) | NULL | Payment reference |
| Notes | NVARCHAR(2000) | NULL | Transaction notes |
| SaleId | NVARCHAR(50) | NULL | FK → Sales (for purchases) |
| ExpectedPaymentDate | NVARCHAR(50) | NULL | Due date |
| LineSummary | NVARCHAR(2000) | NULL | Item summary for purchases |
| EntryAt | DATETIME2 | NOT NULL | Transaction timestamp |

**Constraints:** CHECK (Kind IN ('purchase', 'payment'))

---

### 11. ActivityLog

Recent activity feed for the dashboard.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| Kind | NVARCHAR(50) | NOT NULL | 'sale', 'restock', 'low_stock', 'edit', 'user', 'settings' |
| Title | NVARCHAR(500) | NOT NULL | Activity title |
| Description | NVARCHAR(2000) | NULL | Activity description |
| Actor | NVARCHAR(200) | NOT NULL | Who performed the action |
| OccurredAt | DATETIME2 | NOT NULL | When it happened |

---

### 12. AuditLog

Detailed audit trail for compliance and debugging.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| UserId | NVARCHAR(50) | NULL | FK → Users |
| UserName | NVARCHAR(200) | NOT NULL | Display name |
| Action | NVARCHAR(200) | NOT NULL | What was done |
| Target | NVARCHAR(500) | NULL | What was affected (SKU, invoice, etc.) |
| Description | NVARCHAR(2000) | NULL | Detailed description |
| OccurredAt | DATETIME2 | NOT NULL | When it happened |

---

### 13. Settings

Application configuration.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key (always 'default') |
| StoreName | NVARCHAR(500) | NOT NULL | Store display name |
| Email | NVARCHAR(200) | NOT NULL | Store email |
| Phone | NVARCHAR(50) | NOT NULL | Store phone |
| Currency | NVARCHAR(10) | NOT NULL | Currency code (e.g., 'USD') |
| Address | NVARCHAR(1000) | NULL | Store address |
| TaxRate | DECIMAL(5,2) | NOT NULL | Tax rate percentage |
| LowStockThreshold | INT | NOT NULL | Default low stock threshold |
| ReceiptFooter | NVARCHAR(1000) | NULL | Receipt footer text |
| BarcodeScanning | BIT | NOT NULL | Enable barcode scanning |
| LowStockAlerts | BIT | NOT NULL | Enable low stock alerts |
| TwoFactorAuth | BIT | NOT NULL | Enable 2FA |
| SessionTimeout | BIT | NOT NULL | Enable session timeout |
| UpdatedAt | DATETIME2 | NOT NULL | Last update timestamp |

---

### 14. InventoryMovements

Audit trail for all inventory changes.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| ProductId | NVARCHAR(50) | NOT NULL | FK → Products |
| MovementType | NVARCHAR(50) | NOT NULL | 'sale', 'restock', 'adjustment', 'return', 'opening' |
| Quantity | INT | NOT NULL | Units changed (positive=in, negative=out) |
| Boxes | INT | NOT NULL | Boxes changed |
| Pieces | INT | NOT NULL | Individual pieces changed |
| Reference | NVARCHAR(500) | NULL | Related sale/invoice number |
| Reason | NVARCHAR(500) | NULL | Reason for movement |
| Notes | NVARCHAR(2000) | NULL | Additional notes |
| UserId | NVARCHAR(50) | NULL | FK → Users |
| UserName | NVARCHAR(200) | NULL | Display name |
| OccurredAt | DATETIME2 | NOT NULL | When it happened |

**Constraints:** CHECK (MovementType IN ('sale', 'restock', 'adjustment', 'return', 'opening'))

---

### 15. ImportHistory

CSV import tracking.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | NVARCHAR(50) | NOT NULL | Primary key |
| FileName | NVARCHAR(500) | NOT NULL | Imported file name |
| ImportType | NVARCHAR(100) | NOT NULL | 'products', etc. |
| RowCount | INT | NOT NULL | Total rows in file |
| SuccessCount | INT | NOT NULL | Successfully imported rows |
| ErrorCount | INT | NOT NULL | Failed rows |
| Errors | NVARCHAR(MAX) | NULL | JSON error details |
| UserId | NVARCHAR(50) | NULL | FK → Users |
| ImportedAt | DATETIME2 | NOT NULL | Import timestamp |

---

## Views

### vw_ProductInventory
Products with computed `TotalQuantity` and `StockStatus`.

### vw_LowStockProducts
Products at or below low stock threshold.

### vw_SalesSummary
Sales with item count aggregation.

### vw_CreditorBalances
Computed outstanding balances from ledger entries.

### vw_RecentSales
Latest 100 sales with item count.

### vw_InventoryTimeline
Inventory movements with product details.

---

## Functions

### fn_CalculateTotalQuantity(@IsBoxed, @Boxes, @ItemsPerBox, @ExtraPieces)
Returns total stock quantity.

### fn_GetStockStatus(@IsBoxed, @Boxes, @ItemsPerBox, @ExtraPieces, @LowStockThreshold)
Returns 'in_stock', 'low_stock', or 'out_of_stock'.

### fn_GetCustomerOutstanding(@CustomerId)
Returns current outstanding balance for a customer.

### fn_NextInvoice()
Returns next invoice number (INV-XXXX format).

---

## Stored Procedures

### sp_CreateSale
Creates a sale with items in a transaction. Accepts JSON for sale items.

### sp_RestockProduct
Adds inventory to a product and logs the movement.

### sp_RecordPayment
Records a creditor payment and updates ledger balance.

---

## Triggers

### trg_Product_UpdatedAt
Auto-sets `UpdatedAt` on product updates.

### trg_Customer_UpdatedAt
Auto-sets `UpdatedAt` on customer updates.

### trg_User_UpdatedAt
Auto-sets `UpdatedAt` on user updates.

---

## Relationships

```
Roles ──1:N── Users ──1:N── Sales ──1:N── SaleItems ──N:1── Products
   │                                         │
   └──M:N── Permissions                      └──N:1── Customers ──1:N── LedgerEntries
                                                         │
Categories ──1:N── Products                             └──1:N── Sales
```

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| Users | IX_Users_RoleId | RoleId |
| Users | IX_Users_Status | Status |
| Products | IX_Products_CategoryId | CategoryId |
| Products | IX_Products_Name | Name |
| Products | IX_Products_Brand | Brand |
| Products | IX_Products_Barcode | Barcode |
| Sales | IX_Sales_CustomerId | CustomerId |
| Sales | IX_Sales_UserId | UserId |
| Sales | IX_Sales_SoldAt | SoldAt |
| Sales | IX_Sales_Method | Method |
| SaleItems | IX_SaleItems_SaleId | SaleId |
| SaleItems | IX_SaleItems_ProductId | ProductId |
| LedgerEntries | IX_LedgerEntries_CustomerId | CustomerId |
| LedgerEntries | IX_LedgerEntries_Kind | Kind |
| ActivityLog | IX_ActivityLog_Kind | Kind |
| ActivityLog | IX_ActivityLog_OccurredAt | OccurredAt |
| AuditLog | IX_AuditLog_UserId | UserId |
| AuditLog | IX_AuditLog_OccurredAt | OccurredAt |
| InventoryMovements | IX_InventoryMovements_ProductId | ProductId |
| InventoryMovements | IX_InventoryMovements_OccurredAt | OccurredAt |
