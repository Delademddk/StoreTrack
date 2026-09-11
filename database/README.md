# StoreTrack V3 — Database Package

Complete SQL Server database package for the StoreTrack V3 inventory management system.

## Overview

This package contains everything needed to create, populate, maintain, test, and eventually connect the StoreTrack V3 backend to a Microsoft SQL Server database.

**Current status:** The backend currently uses mock/in-memory data. This database is prepared for future integration.

## Database Name

```
StoreTrackV3
```

## Quick Start

### Option A: Run the Master Setup Script (Recommended)

1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance
3. Open `database/setup_storetrack.sql`
4. Press **F5** or click **Execute**
5. The database is created with all schema, seed data, and objects

### Option B: Run Individual Scripts

Execute scripts in this order:

```
1. 00_database/01_create_database.sql
2. 01_schema/01_create_schema.sql
3. 01_schema/02_create_tables.sql
4. 01_schema/04_create_indexes.sql
5. 05_functions/01_create_functions.sql
6. 03_views/01_create_views.sql
7. 04_stored_procedures/01_create_procedures.sql
8. 06_triggers/01_create_triggers.sql
9. 02_seed/01_roles.sql
10. 02_seed/02_permissions.sql
11. 02_seed/03_users.sql
12. 02_seed/04_categories.sql
13. 02_seed/05_sample_data.sql
```

## Development Credentials

| Role    | Username | Password  |
|---------|----------|-----------|
| Admin   | admin    | Admin123  |
| Cashier | cashier  | Cashier123|

Passwords are bcrypt-hashed in the database. The Python backend verifies using `bcrypt.checkpw()`.

## Folder Structure

```
database/
├── README.md                    # This file
├── schema-reference.md          # Complete schema documentation
├── setup_storetrack.sql         # Master setup script (run this)
│
├── 00_database/
│   ├── 01_create_database.sql   # Create StoreTrackV3 database
│   └── 02_drop_database.sql     # Drop database (DEVELOPMENT ONLY)
│
├── 01_schema/
│   ├── 01_create_schema.sql     # Create [app] schema
│   ├── 02_create_tables.sql     # Create all 15 tables
│   └── 04_create_indexes.sql    # Performance indexes
│
├── 02_seed/
│   ├── 01_roles.sql             # Admin, Manager, Cashier, Keeper roles
│   ├── 02_permissions.sql       # 13 system permissions
│   ├── 03_users.sql             # Development users (admin, cashier)
│   ├── 04_categories.sql        # 5 product categories
│   └── 05_sample_data.sql       # Products, customers, sales, ledger, etc.
│
├── 03_views/
│   └── 01_create_views.sql      # 6 useful views
│
├── 04_stored_procedures/
│   └── 01_create_procedures.sql # 3 transactional procedures
│
├── 05_functions/
│   └── 01_create_functions.sql  # 4 utility functions
│
├── 06_triggers/
│   └── 01_create_triggers.sql   # 3 audit triggers
│
├── 08_migrations/
│   └── 001_initial_schema.sql   # Initial migration
│
├── 09_testing/
│   ├── 01_schema_test.sql       # Schema validation (27 tests)
│   ├── 02_seed_test.sql         # Seed data validation (16 tests)
│   └── 03_transaction_test.sql  # Business logic tests (5 tests)
│
├── 10_rollback/
│   ├── 01_drop_all_objects.sql  # Drop all objects (DEVELOPMENT ONLY)
│   └── 02_dev_reset.sql         # Clear all data (DEVELOPMENT ONLY)
│
└── erd/
    └── storetrack-erd.mmd       # Mermaid ER diagram
```

## Tables (15 total)

| # | Table | Purpose |
|---|-------|---------|
| 1 | Roles | User roles (Admin, Manager, Cashier, Keeper) |
| 2 | Permissions | System permissions (13 total) |
| 3 | RolePermissions | Role-permission junction table |
| 4 | Users | System users with bcrypt password hashes |
| 5 | Categories | Product categories |
| 6 | Products | Product catalog with box/individual inventory |
| 7 | Customers | Customer/creditor records |
| 8 | Sales | Sales transactions |
| 9 | SaleItems | Individual line items in each sale |
| 10 | LedgerEntries | Creditor purchase/payment history |
| 11 | ActivityLog | Recent activity feed |
| 12 | AuditLog | Detailed audit trail |
| 13 | Settings | Application settings |
| 14 | InventoryMovements | Inventory change history |
| 15 | ImportHistory | CSV import history |

## Key Design Decisions

### Product Inventory (Box Logic)

Products support two modes:
- **Boxed**: `IsBoxed=1`, inventory = `Boxes * ItemsPerBox + ExtraPieces`
- **Non-boxed**: `IsBoxed=0`, inventory = `ExtraPieces`

Total quantity is computed, not stored, to prevent inconsistency.

### Creditor Balances

Outstanding balances are derived from `LedgerEntries` (purchase - payment), not stored as a field. This ensures accuracy.

### Password Storage

Passwords use bcrypt hashing (`$2b$12$...`). The database never stores plaintext passwords.

### Financial Precision

All monetary values use `DECIMAL(18,2)` for fixed-point accuracy.

## Validation

Run these scripts to verify the database was created correctly:

```sql
-- Schema validation (27 tests)
-- Run: 09_testing/01_schema_test.sql

-- Seed data validation (16 tests)
-- Run: 09_testing/02_seed_test.sql

-- Transaction tests (5 tests)
-- Run: 09_testing/03_transaction_test.sql
```

## Future Backend Integration

When ready to connect the backend:

```
Current:  React → FastAPI → Service → Mock Repository → In-Memory Data
Future:   React → FastAPI → Service → SQL Repository → SQL Server
```

The repository layer (`data_repos.py`) will be replaced with SQL-based implementations. The service layer and API routes remain unchanged.

## Development vs Production

### Development
- Run `setup_storetrack.sql` for full setup with sample data
- Use `10_rollback/02_dev_reset.sql` to clear and re-seed

### Production
- Run `00_database/01_create_database.sql`
- Run `01_schema/` scripts
- Run `02_seed/01_roles.sql` and `02_seed/02_permissions.sql` only
- Do NOT run `02_seed/05_sample_data.sql` in production

## Naming Conventions

| Object | Convention | Example |
|--------|-----------|---------|
| Tables | PascalCase | `Products`, `SaleItems` |
| Columns | PascalCase | `IndividualPrice`, `CategoryId` |
| Primary Keys | `PK_TableName` | `PK_Products` |
| Foreign Keys | `FK_Table_RefTable` | `FK_Products_Categories` |
| Unique Constraints | `UQ_Table_Column` | `UQ_Products_Sku` |
| Indexes | `IX_Table_Column` | `IX_Products_Name` |
| Check Constraints | `CK_Table_Column` | `CK_Products_Boxes` |
| Schema | `app` | `app.Products` |

## SQL Server Compatibility

All scripts are written for Microsoft SQL Server (2016+). They use:
- `DATETIME2` for timestamps
- `NVARCHAR` for strings
- `DECIMAL(18,2)` for money
- `BIT` for booleans
- `MERGE` for idempotent upserts
- `SYSUTCDATETIME()` for UTC timestamps
- `AS ... PERSISTED` for computed columns
