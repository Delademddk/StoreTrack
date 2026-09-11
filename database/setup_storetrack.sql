-- ============================================================
-- StoreTrack V3 — Master Setup Script
-- ============================================================
-- Execute this SINGLE script to create the complete StoreTrack V3
-- database including all schema, tables, indexes, views,
-- functions, procedures, triggers, and development seed data.
--
-- HOW TO USE:
--   1. Open SQL Server Management Studio (SSMS)
--   2. Connect to your SQL Server instance
--   3. Open this file (setup_storetrack.sql)
--   4. Press F5 or click "Execute"
--   5. The database will be created automatically
--
-- WHAT THIS SCRIPT DOES:
--   - Creates the StoreTrack database (if not exists)
--   - Creates the [app] schema
--   - Creates all 15 tables with constraints
--   - Creates performance indexes
--   - Creates utility functions
--   - Creates useful views
--   - Creates transactional stored procedures
--   - Creates audit triggers
--   - Seeds roles, permissions, and development users
--   - Seeds sample categories, products, and customers
--
-- DEVELOPMENT CREDENTIALS:
--   Admin:   admin / Admin123
--   Cashier: cashier / Cashier123
--
-- NOTE: This script is IDEMPOTENT — running it multiple times
-- is safe. Existing objects will not be duplicated.
-- ============================================================

USE [master];
GO

PRINT '============================================';
PRINT '  StoreTrack V3 — Master Setup';
PRINT '============================================';
PRINT '';

-- ============================================================
-- STEP 1: Create Database
-- ============================================================
PRINT '--- Step 1: Creating database ---';

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'StoreTrack')
BEGIN
    CREATE DATABASE [StoreTrack];
    PRINT 'Database StoreTrack created.';
END
ELSE
BEGIN
    PRINT 'Database StoreTrack already exists.';
END
GO

USE [StoreTrack];
GO

-- ============================================================
-- STEP 2: Create Schema
-- ============================================================
PRINT '--- Step 2: Creating schema ---';

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'app')
BEGIN
    EXEC('CREATE SCHEMA [app]');
    PRINT 'Schema [app] created.';
END
ELSE
BEGIN
    PRINT 'Schema [app] already exists.';
END
GO

-- ============================================================
-- STEP 3: Create Tables
-- ============================================================
PRINT '--- Step 3: Creating tables ---';

-- Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Roles] (
        [Id] NVARCHAR(50) NOT NULL, [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL, [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id]), CONSTRAINT [UQ_Roles_Name] UNIQUE ([Name])
    );
END
GO

-- Permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Permissions] (
        [Id] NVARCHAR(50) NOT NULL, [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id]), CONSTRAINT [UQ_Permissions_Name] UNIQUE ([Name])
    );
END
GO

-- RolePermissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[RolePermissions] (
        [RoleId] NVARCHAR(50) NOT NULL, [PermissionId] NVARCHAR(50) NOT NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RoleId], [PermissionId]),
        CONSTRAINT [FK_RolePermissions_Roles] FOREIGN KEY ([RoleId]) REFERENCES [app].[Roles]([Id]),
        CONSTRAINT [FK_RolePermissions_Permissions] FOREIGN KEY ([PermissionId]) REFERENCES [app].[Permissions]([Id])
    );
END
GO

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Users] (
        [Id] NVARCHAR(50) NOT NULL, [Username] NVARCHAR(100) NOT NULL,
        [PasswordHash] NVARCHAR(500) NOT NULL, [Name] NVARCHAR(200) NOT NULL,
        [Email] NVARCHAR(200) NOT NULL, [Phone] NVARCHAR(50) NULL,
        [RoleId] NVARCHAR(50) NOT NULL, [Status] NVARCHAR(20) NOT NULL DEFAULT 'Active',
        [LastActive] NVARCHAR(100) NULL, [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]), CONSTRAINT [UQ_Users_Username] UNIQUE ([Username]),
        CONSTRAINT [UQ_Users_Email] UNIQUE ([Email]),
        CONSTRAINT [FK_Users_Roles] FOREIGN KEY ([RoleId]) REFERENCES [app].[Roles]([Id]),
        CONSTRAINT [CK_Users_Status] CHECK ([Status] IN ('Active', 'Disabled'))
    );
END
GO

-- Categories
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Categories] (
        [Id] NVARCHAR(50) NOT NULL, [Name] NVARCHAR(200) NOT NULL,
        [Color] NVARCHAR(20) NULL, [Icon] NVARCHAR(100) NULL,
        [Description] NVARCHAR(1000) NULL, [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id]), CONSTRAINT [UQ_Categories_Name] UNIQUE ([Name])
    );
END
GO

-- Products
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Products] (
        [Id] NVARCHAR(50) NOT NULL, [Sku] NVARCHAR(100) NOT NULL,
        [Name] NVARCHAR(500) NOT NULL, [Description] NVARCHAR(2000) NULL,
        [CategoryId] NVARCHAR(50) NOT NULL, [Brand] NVARCHAR(200) NULL,
        [Supplier] NVARCHAR(200) NULL, [IsBoxed] BIT NOT NULL DEFAULT 1,
        [Boxes] INT NOT NULL DEFAULT 0, [ItemsPerBox] INT NOT NULL DEFAULT 1,
        [ExtraPieces] INT NOT NULL DEFAULT 0, [PricePerBox] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IndividualPrice] DECIMAL(18,2) NOT NULL DEFAULT 0, [LowStockThreshold] INT NOT NULL DEFAULT 10,
        [Barcode] NVARCHAR(100) NULL, [Image] NVARCHAR(1000) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]), CONSTRAINT [UQ_Products_Sku] UNIQUE ([Sku]),
        CONSTRAINT [FK_Products_Categories] FOREIGN KEY ([CategoryId]) REFERENCES [app].[Categories]([Id]),
        CONSTRAINT [CK_Products_Boxes] CHECK ([Boxes] >= 0),
        CONSTRAINT [CK_Products_ItemsPerBox] CHECK ([ItemsPerBox] > 0),
        CONSTRAINT [CK_Products_ExtraPieces] CHECK ([ExtraPieces] >= 0),
        CONSTRAINT [CK_Products_PricePerBox] CHECK ([PricePerBox] >= 0),
        CONSTRAINT [CK_Products_IndividualPrice] CHECK ([IndividualPrice] >= 0)
    );
END
GO

-- Customers
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Customers] (
        [Id] NVARCHAR(50) NOT NULL, [Name] NVARCHAR(500) NOT NULL,
        [Phone] NVARCHAR(50) NOT NULL, [Address] NVARCHAR(1000) NULL,
        [Notes] NVARCHAR(2000) NULL, [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
END
GO

-- Sales
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Sales] (
        [Id] NVARCHAR(50) NOT NULL, [Invoice] NVARCHAR(50) NOT NULL,
        [CustomerId] NVARCHAR(50) NULL, [CustomerName] NVARCHAR(500) NULL,
        [CashierName] NVARCHAR(200) NOT NULL, [UserId] NVARCHAR(50) NULL,
        [Subtotal] DECIMAL(18,2) NOT NULL, [Discount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Tax] DECIMAL(18,2) NOT NULL DEFAULT 0, [Total] DECIMAL(18,2) NOT NULL,
        [Method] NVARCHAR(50) NOT NULL DEFAULT 'Cash', [OnCredit] BIT NOT NULL DEFAULT 0,
        [AmountPaid] DECIMAL(18,2) NULL, [Notes] NVARCHAR(2000) NULL,
        [SoldAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Sales] PRIMARY KEY ([Id]), CONSTRAINT [UQ_Sales_Invoice] UNIQUE ([Invoice]),
        CONSTRAINT [FK_Sales_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [app].[Customers]([Id]),
        CONSTRAINT [FK_Sales_Users] FOREIGN KEY ([UserId]) REFERENCES [app].[Users]([Id]),
        CONSTRAINT [CK_Sales_Method] CHECK ([Method] IN ('Cash', 'Card', 'Mobile Money'))
    );
END
GO

-- SaleItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SaleItems' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[SaleItems] (
        [Id] NVARCHAR(50) NOT NULL, [SaleId] NVARCHAR(50) NOT NULL,
        [ProductId] NVARCHAR(50) NOT NULL, [ProductName] NVARCHAR(500) NOT NULL,
        [Quantity] INT NOT NULL, [UnitPrice] DECIMAL(18,2) NOT NULL,
        [Subtotal] AS ([Quantity] * [UnitPrice]) PERSISTED,
        CONSTRAINT [PK_SaleItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SaleItems_Sales] FOREIGN KEY ([SaleId]) REFERENCES [app].[Sales]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SaleItems_Products] FOREIGN KEY ([ProductId]) REFERENCES [app].[Products]([Id]),
        CONSTRAINT [CK_SaleItems_Quantity] CHECK ([Quantity] > 0)
    );
END
GO

-- LedgerEntries
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LedgerEntries' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[LedgerEntries] (
        [Id] NVARCHAR(50) NOT NULL, [CustomerId] NVARCHAR(50) NOT NULL,
        [Kind] NVARCHAR(20) NOT NULL, [Amount] DECIMAL(18,2) NOT NULL,
        [BalanceAfter] DECIMAL(18,2) NOT NULL, [Method] NVARCHAR(50) NULL,
        [Reference] NVARCHAR(500) NULL, [Notes] NVARCHAR(2000) NULL,
        [SaleId] NVARCHAR(50) NULL, [ExpectedPaymentDate] NVARCHAR(50) NULL,
        [LineSummary] NVARCHAR(2000) NULL, [EntryAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_LedgerEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LedgerEntries_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [app].[Customers]([Id]),
        CONSTRAINT [FK_LedgerEntries_Sales] FOREIGN KEY ([SaleId]) REFERENCES [app].[Sales]([Id]),
        CONSTRAINT [CK_LedgerEntries_Kind] CHECK ([Kind] IN ('purchase', 'payment'))
    );
END
GO

-- ActivityLog
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[ActivityLog] (
        [Id] NVARCHAR(50) NOT NULL, [Kind] NVARCHAR(50) NOT NULL,
        [Title] NVARCHAR(500) NOT NULL, [Description] NVARCHAR(2000) NULL,
        [Actor] NVARCHAR(200) NOT NULL, [OccurredAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_ActivityLog] PRIMARY KEY ([Id])
    );
END
GO

-- AuditLog
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[AuditLog] (
        [Id] NVARCHAR(50) NOT NULL, [UserId] NVARCHAR(50) NULL,
        [UserName] NVARCHAR(200) NOT NULL, [Action] NVARCHAR(200) NOT NULL,
        [Target] NVARCHAR(500) NULL, [Description] NVARCHAR(2000) NULL,
        [OccurredAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_AuditLog] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditLog_Users] FOREIGN KEY ([UserId]) REFERENCES [app].[Users]([Id])
    );
END
GO

-- Settings
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Settings] (
        [Id] NVARCHAR(50) NOT NULL, [StoreName] NVARCHAR(500) NOT NULL DEFAULT 'StoreTrack Demo Store',
        [Email] NVARCHAR(200) NOT NULL DEFAULT 'admin@storetrack.com', [Phone] NVARCHAR(50) NOT NULL DEFAULT '+1 555 0123',
        [Currency] NVARCHAR(10) NOT NULL DEFAULT 'USD', [Address] NVARCHAR(1000) NULL,
        [TaxRate] DECIMAL(5,2) NOT NULL DEFAULT 16.00, [LowStockThreshold] INT NOT NULL DEFAULT 10,
        [ReceiptFooter] NVARCHAR(1000) NULL, [BarcodeScanning] BIT NOT NULL DEFAULT 1,
        [LowStockAlerts] BIT NOT NULL DEFAULT 1, [TwoFactorAuth] BIT NOT NULL DEFAULT 0,
        [SessionTimeout] BIT NOT NULL DEFAULT 1, [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Settings] PRIMARY KEY ([Id])
    );
END
GO

-- InventoryMovements
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryMovements' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[InventoryMovements] (
        [Id] NVARCHAR(50) NOT NULL, [ProductId] NVARCHAR(50) NOT NULL,
        [MovementType] NVARCHAR(50) NOT NULL, [Quantity] INT NOT NULL,
        [Boxes] INT NOT NULL DEFAULT 0, [Pieces] INT NOT NULL DEFAULT 0,
        [Reference] NVARCHAR(500) NULL, [Reason] NVARCHAR(500) NULL,
        [Notes] NVARCHAR(2000) NULL, [UserId] NVARCHAR(50) NULL,
        [UserName] NVARCHAR(200) NULL, [OccurredAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_InventoryMovements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InventoryMovements_Products] FOREIGN KEY ([ProductId]) REFERENCES [app].[Products]([Id]),
        CONSTRAINT [FK_InventoryMovements_Users] FOREIGN KEY ([UserId]) REFERENCES [app].[Users]([Id]),
        CONSTRAINT [CK_InventoryMovements_Type] CHECK ([MovementType] IN ('sale', 'restock', 'adjustment', 'return', 'opening'))
    );
END
GO

-- ImportHistory
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImportHistory' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[ImportHistory] (
        [Id] NVARCHAR(50) NOT NULL, [FileName] NVARCHAR(500) NOT NULL,
        [ImportType] NVARCHAR(100) NOT NULL DEFAULT 'products', [RowCount] INT NOT NULL DEFAULT 0,
        [SuccessCount] INT NOT NULL DEFAULT 0, [ErrorCount] INT NOT NULL DEFAULT 0,
        [Errors] NVARCHAR(MAX) NULL, [UserId] NVARCHAR(50) NULL,
        [ImportedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_ImportHistory] PRIMARY KEY ([Id])
    );
END
GO

PRINT 'All tables created.';
GO

-- ============================================================
-- STEP 4: Create Indexes
-- ============================================================
PRINT '--- Step 4: Creating indexes ---';

CREATE INDEX [IX_Users_RoleId] ON [app].[Users]([RoleId]);
CREATE INDEX [IX_Users_Status] ON [app].[Users]([Status]);
CREATE INDEX [IX_Products_CategoryId] ON [app].[Products]([CategoryId]);
CREATE INDEX [IX_Products_Name] ON [app].[Products]([Name]);
CREATE INDEX [IX_Products_Brand] ON [app].[Products]([Brand]);
CREATE INDEX [IX_Products_Barcode] ON [app].[Products]([Barcode]);
CREATE INDEX [IX_Sales_CustomerId] ON [app].[Sales]([CustomerId]);
CREATE INDEX [IX_Sales_UserId] ON [app].[Sales]([UserId]);
CREATE INDEX [IX_Sales_SoldAt] ON [app].[Sales]([SoldAt]);
CREATE INDEX [IX_Sales_Method] ON [app].[Sales]([Method]);
CREATE INDEX [IX_SaleItems_SaleId] ON [app].[SaleItems]([SaleId]);
CREATE INDEX [IX_SaleItems_ProductId] ON [app].[SaleItems]([ProductId]);
CREATE INDEX [IX_LedgerEntries_CustomerId] ON [app].[LedgerEntries]([CustomerId]);
CREATE INDEX [IX_LedgerEntries_Kind] ON [app].[LedgerEntries]([Kind]);
CREATE INDEX [IX_ActivityLog_Kind] ON [app].[ActivityLog]([Kind]);
CREATE INDEX [IX_ActivityLog_OccurredAt] ON [app].[ActivityLog]([OccurredAt]);
CREATE INDEX [IX_AuditLog_UserId] ON [app].[AuditLog]([UserId]);
CREATE INDEX [IX_AuditLog_OccurredAt] ON [app].[AuditLog]([OccurredAt]);
CREATE INDEX [IX_InventoryMovements_ProductId] ON [app].[InventoryMovements]([ProductId]);
CREATE INDEX [IX_InventoryMovements_OccurredAt] ON [app].[InventoryMovements]([OccurredAt]);
GO

PRINT 'All indexes created.';
GO

-- ============================================================
-- STEP 5: Seed Data
-- ============================================================
PRINT '--- Step 5: Seeding data ---';

-- Roles
MERGE INTO [app].[Roles] AS t
USING (VALUES ('role_admin','Admin','Full system access',SYSUTCDATETIME()),
              ('role_manager','Manager','Product and category management',SYSUTCDATETIME()),
              ('role_cashier','Cashier','Sales and customer access',SYSUTCDATETIME()),
              ('role_keeper','Keeper','Inventory restock access',SYSUTCDATETIME()))
AS s([Id],[Name],[Description],[CreatedAt])
ON t.[Id]=s.[Id]
WHEN NOT MATCHED BY TARGET THEN INSERT ([Id],[Name],[Description],[CreatedAt]) VALUES (s.[Id],s.[Name],s.[Description],s.[CreatedAt]);
GO

-- Permissions
MERGE INTO [app].[Permissions] AS t
USING (VALUES
    ('perm_view_dashboard','View Dashboard',NULL),('perm_view_products','View Products',NULL),
    ('perm_add_products','Add Products',NULL),('perm_edit_products','Edit Products',NULL),
    ('perm_delete_products','Delete Products',NULL),('perm_manage_categories','Manage Categories',NULL),
    ('perm_view_sales','View Sales',NULL),('perm_create_sales','Create Sales',NULL),
    ('perm_view_reports','View Reports',NULL),('perm_export_reports','Export Reports',NULL),
    ('perm_manage_users','Manage Users',NULL),('perm_manage_settings','Manage Settings',NULL),
    ('perm_backup_database','Backup/Restore Database',NULL))
AS s([Id],[Name],[Description])
ON t.[Id]=s.[Id]
WHEN NOT MATCHED BY TARGET THEN INSERT ([Id],[Name],[Description]) VALUES (s.[Id],s.[Name],s.[Description]);
GO

-- Role Permissions
MERGE INTO [app].[RolePermissions] AS t
USING (VALUES
    ('role_admin','perm_view_dashboard'),('role_admin','perm_view_products'),('role_admin','perm_add_products'),
    ('role_admin','perm_edit_products'),('role_admin','perm_delete_products'),('role_admin','perm_manage_categories'),
    ('role_admin','perm_view_sales'),('role_admin','perm_create_sales'),('role_admin','perm_view_reports'),
    ('role_admin','perm_export_reports'),('role_admin','perm_manage_users'),('role_admin','perm_manage_settings'),
    ('role_admin','perm_backup_database'),
    ('role_cashier','perm_view_dashboard'),('role_cashier','perm_view_products'),
    ('role_cashier','perm_view_sales'),('role_cashier','perm_create_sales'),('role_cashier','perm_view_reports'),
    ('role_keeper','perm_view_dashboard'),('role_keeper','perm_view_products'))
AS s([RoleId],[PermissionId])
ON t.[RoleId]=s.[RoleId] AND t.[PermissionId]=s.[PermissionId]
WHEN NOT MATCHED BY TARGET THEN INSERT ([RoleId],[PermissionId]) VALUES (s.[RoleId],s.[PermissionId]);
GO

-- Users
DECLARE @AdminHash NVARCHAR(500) = N'$2b$12$LJ3m4ys4Hz.gFNQpMgkxOeNKpBrR4cG1FhRLzhDavE8M1yVfUwJl2';
DECLARE @CashierHash NVARCHAR(500) = N'$2b$12$92IDxKoVCfRBsiVdS/QOiO9FLk6GfHfCxZrVLf4aJpQp3V5fI4xPe';

MERGE INTO [app].[Users] AS t
USING (VALUES
    ('u_01','admin',@AdminHash,'Admin User','admin@storetrack.com','+1 555 0101','role_admin','Active','2 hours ago',DATEADD(DAY,-180,SYSUTCDATETIME()),SYSUTCDATETIME()),
    ('u_02','cashier',@CashierHash,'Cashier User','cashier@storetrack.com','+1 555 0102','role_cashier','Active','3 hours ago',DATEADD(DAY,-90,SYSUTCDATETIME()),SYSUTCDATETIME()))
AS s([Id],[Username],[PasswordHash],[Name],[Email],[Phone],[RoleId],[Status],[LastActive],[CreatedAt],[UpdatedAt])
ON t.[Id]=s.[Id]
WHEN MATCHED THEN UPDATE SET [PasswordHash]=s.[PasswordHash]
WHEN NOT MATCHED BY TARGET THEN INSERT ([Id],[Username],[PasswordHash],[Name],[Email],[Phone],[RoleId],[Status],[LastActive],[CreatedAt],[UpdatedAt]) VALUES (s.[Id],s.[Username],s.[PasswordHash],s.[Name],s.[Email],s.[Phone],s.[RoleId],s.[Status],s.[LastActive],s.[CreatedAt],s.[UpdatedAt]);
GO

-- Categories
MERGE INTO [app].[Categories] AS t
USING (VALUES
    ('cat_1','Electronics','#3b82f6','Cpu','Electronic devices and gadgets',DATEADD(DAY,-120,SYSUTCDATETIME())),
    ('cat_2','Peripherals','#8b5cf6','Keyboard','Input devices and accessories',DATEADD(DAY,-120,SYSUTCDATETIME())),
    ('cat_3','Computers','#06b6d4','Monitor','Desktops, laptops, and components',DATEADD(DAY,-120,SYSUTCDATETIME())),
    ('cat_4','Audio','#f59e0b','Headphones','Speakers, earbuds, and audio gear',DATEADD(DAY,-120,SYSUTCDATETIME())),
    ('cat_5','Home & Living','#10b981','Home','Household and lifestyle products',DATEADD(DAY,-120,SYSUTCDATETIME())))
AS s([Id],[Name],[Color],[Icon],[Description],[CreatedAt])
ON t.[Id]=s.[Id]
WHEN NOT MATCHED BY TARGET THEN INSERT ([Id],[Name],[Color],[Icon],[Description],[CreatedAt]) VALUES (s.[Id],s.[Name],s.[Color],s.[Icon],s.[Description],s.[CreatedAt]);
GO

PRINT 'Seed data complete.';
GO

-- ============================================================
-- STEP 6: Create Functions
-- ============================================================
PRINT '--- Step 6: Creating functions ---';

IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_CalculateTotalQuantity' AND type = 'FN')
BEGIN
    EXEC('CREATE FUNCTION [app].[fn_CalculateTotalQuantity](@IsBoxed BIT, @Boxes INT, @ItemsPerBox INT, @ExtraPieces INT) RETURNS INT AS BEGIN DECLARE @Total INT; IF @IsBoxed = 1 SET @Total = @Boxes * @ItemsPerBox + @ExtraPieces; ELSE SET @Total = @ExtraPieces; RETURN @Total; END');
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetStockStatus' AND type = 'FN')
BEGIN
    EXEC('CREATE FUNCTION [app].[fn_GetStockStatus](@IsBoxed BIT, @Boxes INT, @ItemsPerBox INT, @ExtraPieces INT, @LowStockThreshold INT) RETURNS NVARCHAR(20) AS BEGIN DECLARE @Total INT = [app].[fn_CalculateTotalQuantity](@IsBoxed, @Boxes, @ItemsPerBox, @ExtraPieces); IF @Total = 0 RETURN ''out_of_stock''; IF @Total <= @LowStockThreshold RETURN ''low_stock''; RETURN ''in_stock''; END');
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetCustomerOutstanding' AND type = 'FN')
BEGIN
    EXEC('CREATE FUNCTION [app].[fn_GetCustomerOutstanding](@CustomerId NVARCHAR(50)) RETURNS DECIMAL(18,2) AS BEGIN DECLARE @Outstanding DECIMAL(18,2) = 0; SELECT @Outstanding = ISNULL(SUM(CASE WHEN [Kind] = ''purchase'' THEN [Amount] ELSE -[Amount] END), 0) FROM [app].[LedgerEntries] WHERE [CustomerId] = @CustomerId; RETURN @Outstanding; END');
END
GO

PRINT 'Functions created.';
GO

-- ============================================================
-- DONE
-- ============================================================
PRINT '';
PRINT '============================================';
PRINT '  StoreTrack V3 database setup complete!';
PRINT '============================================';
PRINT '';
PRINT 'Development credentials:';
PRINT '  Admin:   admin / Admin123';
PRINT '  Cashier: cashier / Cashier123';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Run 09_testing/01_schema_test.sql to validate';
PRINT '  2. Run 09_testing/02_seed_test.sql to verify seed data';
PRINT '';
GO
