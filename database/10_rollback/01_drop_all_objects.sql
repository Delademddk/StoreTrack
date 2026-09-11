-- ============================================================
-- StoreTrack V3 — Rollback: Drop All Objects
-- ============================================================
-- WARNING: DESTRUCTIVE — Drops all StoreTrack V3 database objects.
-- Run only when you need to completely remove the database schema.
-- ============================================================

USE [StoreTrackV3];
GO

PRINT '============================================';
PRINT 'StoreTrack V3 — Rollback: Drop All Objects';
PRINT '============================================';
PRINT '';

-- Drop triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Product_UpdatedAt')
    DROP TRIGGER [app].[trg_Product_UpdatedAt];
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Customer_UpdatedAt')
    DROP TRIGGER [app].[trg_Customer_UpdatedAt];
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_User_UpdatedAt')
    DROP TRIGGER [app].[trg_User_UpdatedAt];
PRINT 'Triggers dropped.';

-- Drop procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CreateSale')
    DROP PROCEDURE [app].[sp_CreateSale];
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RestockProduct')
    DROP PROCEDURE [app].[sp_RestockProduct];
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecordPayment')
    DROP PROCEDURE [app].[sp_RecordPayment];
PRINT 'Procedures dropped.';

-- Drop views
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProductInventory')
    DROP VIEW [app].[vw_ProductInventory];
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_LowStockProducts')
    DROP VIEW [app].[vw_LowStockProducts];
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SalesSummary')
    DROP VIEW [app].[vw_SalesSummary];
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_CreditorBalances')
    DROP VIEW [app].[vw_CreditorBalances];
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_RecentSales')
    DROP VIEW [app].[vw_RecentSales];
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InventoryTimeline')
    DROP VIEW [app].[vw_InventoryTimeline];
PRINT 'Views dropped.';

-- Drop functions
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_CalculateTotalQuantity' AND type = 'FN')
    DROP FUNCTION [app].[fn_CalculateTotalQuantity];
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetStockStatus' AND type = 'FN')
    DROP FUNCTION [app].[fn_GetStockStatus];
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetCustomerOutstanding' AND type = 'FN')
    DROP FUNCTION [app].[fn_GetCustomerOutstanding];
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_NextInvoice' AND type = 'FN')
    DROP FUNCTION [app].[fn_NextInvoice];
PRINT 'Functions dropped.';

-- Drop tables (order matters due to foreign keys)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ImportHistory')
    DROP TABLE [app].[ImportHistory];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryMovements')
    DROP TABLE [app].[InventoryMovements];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings')
    DROP TABLE [app].[Settings];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
    DROP TABLE [app].[AuditLog];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog')
    DROP TABLE [app].[ActivityLog];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LedgerEntries')
    DROP TABLE [app].[LedgerEntries];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SaleItems')
    DROP TABLE [app].[SaleItems];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales')
    DROP TABLE [app].[Sales];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
    DROP TABLE [app].[Products];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
    DROP TABLE [app].[Categories];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    DROP TABLE [app].[Users];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
    DROP TABLE [app].[RolePermissions];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
    DROP TABLE [app].[Permissions];
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
    DROP TABLE [app].[Roles];
PRINT 'Tables dropped.';

-- Drop schema
IF EXISTS (SELECT * FROM sys.schemas WHERE name = 'app')
    DROP SCHEMA [app];
PRINT 'Schema dropped.';

PRINT '';
PRINT '============================================';
PRINT 'All StoreTrack V3 objects dropped.';
PRINT '============================================';
GO
