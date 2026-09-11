-- ============================================================
-- StoreTrack V3 — Create Indexes
-- ============================================================
-- Creates performance indexes for StoreTrack V3.
-- Execute after 02_create_tables.sql.
-- ============================================================

USE [StoreTrackV3];
GO

-- Users
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_RoleId' AND object_id = OBJECT_ID('app.Users'))
    CREATE INDEX [IX_Users_RoleId] ON [app].[Users]([RoleId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Status' AND object_id = OBJECT_ID('app.Users'))
    CREATE INDEX [IX_Users_Status] ON [app].[Users]([Status]);
GO

-- Products
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_CategoryId' AND object_id = OBJECT_ID('app.Products'))
    CREATE INDEX [IX_Products_CategoryId] ON [app].[Products]([CategoryId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Name' AND object_id = OBJECT_ID('app.Products'))
    CREATE INDEX [IX_Products_Name] ON [app].[Products]([Name]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Brand' AND object_id = OBJECT_ID('app.Products'))
    CREATE INDEX [IX_Products_Brand] ON [app].[Products]([Brand]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Barcode' AND object_id = OBJECT_ID('app.Products'))
    CREATE INDEX [IX_Products_Barcode] ON [app].[Products]([Barcode]);
GO

-- Sales
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_CustomerId' AND object_id = OBJECT_ID('app.Sales'))
    CREATE INDEX [IX_Sales_CustomerId] ON [app].[Sales]([CustomerId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_UserId' AND object_id = OBJECT_ID('app.Sales'))
    CREATE INDEX [IX_Sales_UserId] ON [app].[Sales]([UserId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_SoldAt' AND object_id = OBJECT_ID('app.Sales'))
    CREATE INDEX [IX_Sales_SoldAt] ON [app].[Sales]([SoldAt]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_Method' AND object_id = OBJECT_ID('app.Sales'))
    CREATE INDEX [IX_Sales_Method] ON [app].[Sales]([Method]);
GO

-- Sale Items
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SaleItems_SaleId' AND object_id = OBJECT_ID('app.SaleItems'))
    CREATE INDEX [IX_SaleItems_SaleId] ON [app].[SaleItems]([SaleId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SaleItems_ProductId' AND object_id = OBJECT_ID('app.SaleItems'))
    CREATE INDEX [IX_SaleItems_ProductId] ON [app].[SaleItems]([ProductId]);
GO

-- Ledger Entries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LedgerEntries_CustomerId' AND object_id = OBJECT_ID('app.LedgerEntries'))
    CREATE INDEX [IX_LedgerEntries_CustomerId] ON [app].[LedgerEntries]([CustomerId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LedgerEntries_Kind' AND object_id = OBJECT_ID('app.LedgerEntries'))
    CREATE INDEX [IX_LedgerEntries_Kind] ON [app].[LedgerEntries]([Kind]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_LedgerEntries_SaleId' AND object_id = OBJECT_ID('app.LedgerEntries'))
    CREATE INDEX [IX_LedgerEntries_SaleId] ON [app].[LedgerEntries]([SaleId]);
GO

-- Activity Log
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_Kind' AND object_id = OBJECT_ID('app.ActivityLog'))
    CREATE INDEX [IX_ActivityLog_Kind] ON [app].[ActivityLog]([Kind]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ActivityLog_OccurredAt' AND object_id = OBJECT_ID('app.ActivityLog'))
    CREATE INDEX [IX_ActivityLog_OccurredAt] ON [app].[ActivityLog]([OccurredAt]);
GO

-- Audit Log
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_UserId' AND object_id = OBJECT_ID('app.AuditLog'))
    CREATE INDEX [IX_AuditLog_UserId] ON [app].[AuditLog]([UserId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_Action' AND object_id = OBJECT_ID('app.AuditLog'))
    CREATE INDEX [IX_AuditLog_Action] ON [app].[AuditLog]([Action]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLog_OccurredAt' AND object_id = OBJECT_ID('app.AuditLog'))
    CREATE INDEX [IX_AuditLog_OccurredAt] ON [app].[AuditLog]([OccurredAt]);
GO

-- Inventory Movements
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InventoryMovements_ProductId' AND object_id = OBJECT_ID('app.InventoryMovements'))
    CREATE INDEX [IX_InventoryMovements_ProductId] ON [app].[InventoryMovements]([ProductId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InventoryMovements_Type' AND object_id = OBJECT_ID('app.InventoryMovements'))
    CREATE INDEX [IX_InventoryMovements_Type] ON [app].[InventoryMovements]([MovementType]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InventoryMovements_OccurredAt' AND object_id = OBJECT_ID('app.InventoryMovements'))
    CREATE INDEX [IX_InventoryMovements_OccurredAt] ON [app].[InventoryMovements]([OccurredAt]);
GO

PRINT 'All indexes created successfully.';
GO
