-- ============================================================
-- StoreTrack V3 — Create Tables
-- ============================================================
-- Creates all tables for the StoreTrack V3 database.
-- Execute after 01_create_schema.sql.
-- ============================================================

USE [StoreTrackV3];
GO

-- ------------------------------------------------------------
-- 1. ROLES
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Roles] (
        [Id]          NVARCHAR(50)   NOT NULL,
        [Name]        NVARCHAR(100)  NOT NULL,
        [Description] NVARCHAR(500)  NULL,
        [CreatedAt]   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_Roles_Name] UNIQUE ([Name])
    );
    PRINT 'Table [app].[Roles] created.';
END
GO

-- ------------------------------------------------------------
-- 2. PERMISSIONS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Permissions] (
        [Id]          NVARCHAR(50)   NOT NULL,
        [Name]        NVARCHAR(200)  NOT NULL,
        [Description] NVARCHAR(500)  NULL,
        CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_Permissions_Name] UNIQUE ([Name])
    );
    PRINT 'Table [app].[Permissions] created.';
END
GO

-- ------------------------------------------------------------
-- 3. ROLE PERMISSIONS (junction)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[RolePermissions] (
        [RoleId]       NVARCHAR(50) NOT NULL,
        [PermissionId] NVARCHAR(50) NOT NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RoleId], [PermissionId]),
        CONSTRAINT [FK_RolePermissions_Roles] FOREIGN KEY ([RoleId]) REFERENCES [app].[Roles]([Id]),
        CONSTRAINT [FK_RolePermissions_Permissions] FOREIGN KEY ([PermissionId]) REFERENCES [app].[Permissions]([Id])
    );
    PRINT 'Table [app].[RolePermissions] created.';
END
GO

-- ------------------------------------------------------------
-- 4. USERS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Users] (
        [Id]           NVARCHAR(50)   NOT NULL,
        [Username]     NVARCHAR(100)  NOT NULL,
        [PasswordHash] NVARCHAR(500)  NOT NULL,
        [Name]         NVARCHAR(200)  NOT NULL,
        [Email]        NVARCHAR(200)  NOT NULL,
        [Phone]        NVARCHAR(50)   NULL,
        [RoleId]       NVARCHAR(50)   NOT NULL,
        [Status]       NVARCHAR(20)   NOT NULL DEFAULT 'Active',
        [LastActive]   NVARCHAR(100)  NULL,
        [CreatedAt]    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_Users_Username] UNIQUE ([Username]),
        CONSTRAINT [UQ_Users_Email] UNIQUE ([Email]),
        CONSTRAINT [FK_Users_Roles] FOREIGN KEY ([RoleId]) REFERENCES [app].[Roles]([Id]),
        CONSTRAINT [CK_Users_Status] CHECK ([Status] IN ('Active', 'Disabled'))
    );
    PRINT 'Table [app].[Users] created.';
END
GO

-- ------------------------------------------------------------
-- 5. CATEGORIES
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Categories] (
        [Id]          NVARCHAR(50)   NOT NULL,
        [Name]        NVARCHAR(200)  NOT NULL,
        [Color]       NVARCHAR(20)   NULL,
        [Icon]        NVARCHAR(100)  NULL,
        [Description] NVARCHAR(1000) NULL,
        [CreatedAt]   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_Categories_Name] UNIQUE ([Name])
    );
    PRINT 'Table [app].[Categories] created.';
END
GO

-- ------------------------------------------------------------
-- 6. PRODUCTS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Products] (
        [Id]                NVARCHAR(50)    NOT NULL,
        [Sku]               NVARCHAR(100)   NOT NULL,
        [Name]              NVARCHAR(500)   NOT NULL,
        [Description]       NVARCHAR(2000)  NULL,
        [CategoryId]        NVARCHAR(50)    NOT NULL,
        [Brand]             NVARCHAR(200)   NULL,
        [Supplier]          NVARCHAR(200)   NULL,
        [IsBoxed]           BIT             NOT NULL DEFAULT 1,
        [Boxes]             INT             NOT NULL DEFAULT 0,
        [ItemsPerBox]       INT             NOT NULL DEFAULT 1,
        [ExtraPieces]       INT             NOT NULL DEFAULT 0,
        [PricePerBox]       DECIMAL(18,2)   NOT NULL DEFAULT 0,
        [IndividualPrice]   DECIMAL(18,2)   NOT NULL DEFAULT 0,
        [LowStockThreshold] INT             NOT NULL DEFAULT 10,
        [Barcode]           NVARCHAR(100)   NULL,
        [Image]             NVARCHAR(1000)  NULL,
        [CreatedAt]         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_Products_Sku] UNIQUE ([Sku]),
        CONSTRAINT [FK_Products_Categories] FOREIGN KEY ([CategoryId]) REFERENCES [app].[Categories]([Id]),
        CONSTRAINT [CK_Products_Boxes] CHECK ([Boxes] >= 0),
        CONSTRAINT [CK_Products_ItemsPerBox] CHECK ([ItemsPerBox] > 0),
        CONSTRAINT [CK_Products_ExtraPieces] CHECK ([ExtraPieces] >= 0),
        CONSTRAINT [CK_Products_PricePerBox] CHECK ([PricePerBox] >= 0),
        CONSTRAINT [CK_Products_IndividualPrice] CHECK ([IndividualPrice] >= 0),
        CONSTRAINT [CK_Products_LowStockThreshold] CHECK ([LowStockThreshold] >= 0)
    );
    PRINT 'Table [app].[Products] created.';
END
GO

-- ------------------------------------------------------------
-- 7. CUSTOMERS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Customers] (
        [Id]        NVARCHAR(50)   NOT NULL,
        [Name]      NVARCHAR(500)  NOT NULL,
        [Phone]     NVARCHAR(50)   NOT NULL,
        [Address]   NVARCHAR(1000) NULL,
        [Notes]     NVARCHAR(2000) NULL,
        [CreatedAt] DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
    PRINT 'Table [app].[Customers] created.';
END
GO

-- ------------------------------------------------------------
-- 8. SALES
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Sales] (
        [Id]            NVARCHAR(50)    NOT NULL,
        [Invoice]       NVARCHAR(50)    NOT NULL,
        [CustomerId]    NVARCHAR(50)    NULL,
        [CustomerName]  NVARCHAR(500)   NULL,
        [CashierName]   NVARCHAR(200)   NOT NULL,
        [UserId]        NVARCHAR(50)    NULL,
        [Subtotal]      DECIMAL(18,2)   NOT NULL,
        [Discount]      DECIMAL(18,2)   NOT NULL DEFAULT 0,
        [Tax]           DECIMAL(18,2)   NOT NULL DEFAULT 0,
        [Total]         DECIMAL(18,2)   NOT NULL,
        [Method]        NVARCHAR(50)    NOT NULL DEFAULT 'Cash',
        [OnCredit]      BIT             NOT NULL DEFAULT 0,
        [AmountPaid]    DECIMAL(18,2)   NULL,
        [Notes]         NVARCHAR(2000)  NULL,
        [SoldAt]        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Sales] PRIMARY KEY ([Id]),
        CONSTRAINT [UQ_Sales_Invoice] UNIQUE ([Invoice]),
        CONSTRAINT [FK_Sales_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [app].[Customers]([Id]),
        CONSTRAINT [FK_Sales_Users] FOREIGN KEY ([UserId]) REFERENCES [app].[Users]([Id]),
        CONSTRAINT [CK_Sales_Method] CHECK ([Method] IN ('Cash', 'Card', 'Mobile Money')),
        CONSTRAINT [CK_Sales_Subtotal] CHECK ([Subtotal] >= 0),
        CONSTRAINT [CK_Sales_Discount] CHECK ([Discount] >= 0),
        CONSTRAINT [CK_Sales_Tax] CHECK ([Tax] >= 0),
        CONSTRAINT [CK_Sales_Total] CHECK ([Total] >= 0)
    );
    PRINT 'Table [app].[Sales] created.';
END
GO

-- ------------------------------------------------------------
-- 9. SALE ITEMS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SaleItems' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[SaleItems] (
        [Id]          NVARCHAR(50)    NOT NULL,
        [SaleId]      NVARCHAR(50)    NOT NULL,
        [ProductId]   NVARCHAR(50)    NOT NULL,
        [ProductName] NVARCHAR(500)   NOT NULL,
        [Quantity]    INT             NOT NULL,
        [UnitPrice]   DECIMAL(18,2)   NOT NULL,
        [Subtotal]    AS ([Quantity] * [UnitPrice]) PERSISTED,
        CONSTRAINT [PK_SaleItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SaleItems_Sales] FOREIGN KEY ([SaleId]) REFERENCES [app].[Sales]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SaleItems_Products] FOREIGN KEY ([ProductId]) REFERENCES [app].[Products]([Id]),
        CONSTRAINT [CK_SaleItems_Quantity] CHECK ([Quantity] > 0),
        CONSTRAINT [CK_SaleItems_UnitPrice] CHECK ([UnitPrice] >= 0)
    );
    PRINT 'Table [app].[SaleItems] created.';
END
GO

-- ------------------------------------------------------------
-- 10. LEDGER ENTRIES (Creditor Transactions)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LedgerEntries' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[LedgerEntries] (
        [Id]                   NVARCHAR(50)    NOT NULL,
        [CustomerId]           NVARCHAR(50)    NOT NULL,
        [Kind]                 NVARCHAR(20)    NOT NULL,
        [Amount]               DECIMAL(18,2)   NOT NULL,
        [BalanceAfter]         DECIMAL(18,2)   NOT NULL,
        [Method]               NVARCHAR(50)    NULL,
        [Reference]            NVARCHAR(500)   NULL,
        [Notes]                NVARCHAR(2000)  NULL,
        [SaleId]               NVARCHAR(50)    NULL,
        [ExpectedPaymentDate]  NVARCHAR(50)    NULL,
        [LineSummary]          NVARCHAR(2000)  NULL,
        [EntryAt]              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_LedgerEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LedgerEntries_Customers] FOREIGN KEY ([CustomerId]) REFERENCES [app].[Customers]([Id]),
        CONSTRAINT [FK_LedgerEntries_Sales] FOREIGN KEY ([SaleId]) REFERENCES [app].[Sales]([Id]),
        CONSTRAINT [CK_LedgerEntries_Kind] CHECK ([Kind] IN ('purchase', 'payment')),
        CONSTRAINT [CK_LedgerEntries_Amount] CHECK ([Amount] > 0)
    );
    PRINT 'Table [app].[LedgerEntries] created.';
END
GO

-- ------------------------------------------------------------
-- 11. ACTIVITY LOG
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[ActivityLog] (
        [Id]          NVARCHAR(50)   NOT NULL,
        [Kind]        NVARCHAR(50)   NOT NULL,
        [Title]       NVARCHAR(500)  NOT NULL,
        [Description] NVARCHAR(2000) NULL,
        [Actor]       NVARCHAR(200)  NOT NULL,
        [OccurredAt]  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_ActivityLog] PRIMARY KEY ([Id])
    );
    PRINT 'Table [app].[ActivityLog] created.';
END
GO

-- ------------------------------------------------------------
-- 12. AUDIT LOG
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[AuditLog] (
        [Id]          NVARCHAR(50)   NOT NULL,
        [UserId]      NVARCHAR(50)   NULL,
        [UserName]    NVARCHAR(200)  NOT NULL,
        [Action]      NVARCHAR(200)  NOT NULL,
        [Target]      NVARCHAR(500)  NULL,
        [Description] NVARCHAR(2000) NULL,
        [OccurredAt]  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_AuditLog] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditLog_Users] FOREIGN KEY ([UserId]) REFERENCES [app].[Users]([Id])
    );
    PRINT 'Table [app].[AuditLog] created.';
END
GO

-- ------------------------------------------------------------
-- 13. SETTINGS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[Settings] (
        [Id]        NVARCHAR(50)    NOT NULL,
        [StoreName] NVARCHAR(500)   NOT NULL DEFAULT 'StoreTrack Demo Store',
        [Email]     NVARCHAR(200)   NOT NULL DEFAULT 'admin@storetrack.com',
        [Phone]     NVARCHAR(50)    NOT NULL DEFAULT '+1 555 0123',
        [Currency]  NVARCHAR(10)    NOT NULL DEFAULT 'USD',
        [Address]   NVARCHAR(1000)  NULL,
        [TaxRate]   DECIMAL(5,2)    NOT NULL DEFAULT 16.00,
        [LowStockThreshold] INT     NOT NULL DEFAULT 10,
        [ReceiptFooter] NVARCHAR(1000) NULL,
        [BarcodeScanning]  BIT      NOT NULL DEFAULT 1,
        [LowStockAlerts]   BIT      NOT NULL DEFAULT 1,
        [TwoFactorAuth]    BIT      NOT NULL DEFAULT 0,
        [SessionTimeout]   BIT      NOT NULL DEFAULT 1,
        [UpdatedAt] DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Settings] PRIMARY KEY ([Id])
    );
    PRINT 'Table [app].[Settings] created.';
END
GO

-- ------------------------------------------------------------
-- 14. INVENTORY MOVEMENTS
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryMovements' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[InventoryMovements] (
        [Id]            NVARCHAR(50)    NOT NULL,
        [ProductId]     NVARCHAR(50)    NOT NULL,
        [MovementType]  NVARCHAR(50)    NOT NULL,
        [Quantity]      INT             NOT NULL,
        [Boxes]         INT             NOT NULL DEFAULT 0,
        [Pieces]        INT             NOT NULL DEFAULT 0,
        [Reference]     NVARCHAR(500)   NULL,
        [Reason]        NVARCHAR(500)   NULL,
        [Notes]         NVARCHAR(2000)  NULL,
        [UserId]        NVARCHAR(50)    NULL,
        [UserName]      NVARCHAR(200)   NULL,
        [OccurredAt]    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_InventoryMovements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InventoryMovements_Products] FOREIGN KEY ([ProductId]) REFERENCES [app].[Products]([Id]),
        CONSTRAINT [FK_InventoryMovements_Users] FOREIGN KEY ([UserId]) REFERENCES [app].[Users]([Id]),
        CONSTRAINT [CK_InventoryMovements_Type] CHECK ([MovementType] IN ('sale', 'restock', 'adjustment', 'return', 'opening')),
        CONSTRAINT [CK_InventoryMovements_Quantity] CHECK ([Quantity] <> 0)
    );
    PRINT 'Table [app].[InventoryMovements] created.';
END
GO

-- ------------------------------------------------------------
-- 15. IMPORT HISTORY
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImportHistory' AND schema_id = SCHEMA_ID('app'))
BEGIN
    CREATE TABLE [app].[ImportHistory] (
        [Id]           NVARCHAR(50)    NOT NULL,
        [FileName]     NVARCHAR(500)   NOT NULL,
        [ImportType]   NVARCHAR(100)   NOT NULL DEFAULT 'products',
        [RowCount]     INT             NOT NULL DEFAULT 0,
        [SuccessCount] INT             NOT NULL DEFAULT 0,
        [ErrorCount]   INT             NOT NULL DEFAULT 0,
        [Errors]       NVARCHAR(MAX)   NULL,
        [UserId]       NVARCHAR(50)    NULL,
        [ImportedAt]   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_ImportHistory] PRIMARY KEY ([Id])
    );
    PRINT 'Table [app].[ImportHistory] created.';
END
GO

PRINT 'All tables created successfully.';
GO
