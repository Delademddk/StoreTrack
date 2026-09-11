-- ============================================================
-- StoreTrack V3 — Schema Validation Tests
-- ============================================================
-- Verifies that all required database objects exist.
-- Run after setup_storetrack.sql to validate the installation.
-- ============================================================

USE [StoreTrackV3];
GO

PRINT '============================================';
PRINT 'StoreTrack V3 — Schema Validation Tests';
PRINT '============================================';
PRINT '';

DECLARE @PassCount INT = 0;
DECLARE @FailCount INT = 0;

-- Test 1: Tables exist
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Roles] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Permissions] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[RolePermissions] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Users] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Categories] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Products' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Products] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Customers] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Sales' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Sales] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SaleItems' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[SaleItems] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LedgerEntries' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[LedgerEntries] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLog' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[ActivityLog] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[AuditLog] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[Settings] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InventoryMovements' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[InventoryMovements] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ImportHistory' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Table [app].[ImportHistory] does not exist.';
    SET @FailCount = @FailCount + 1;
END

-- Test 2: Views exist
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProductInventory' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: View [app].[vw_ProductInventory] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_LowStockProducts' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: View [app].[vw_LowStockProducts] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SalesSummary' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: View [app].[vw_SalesSummary] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_CreditorBalances' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: View [app].[vw_CreditorBalances] does not exist.';
    SET @FailCount = @FailCount + 1;
END

-- Test 3: Functions exist
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_CalculateTotalQuantity' AND type = 'FN' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Function [app].[fn_CalculateTotalQuantity] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetStockStatus' AND type = 'FN' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Function [app].[fn_GetStockStatus] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetCustomerOutstanding' AND type = 'FN' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Function [app].[fn_GetCustomerOutstanding] does not exist.';
    SET @FailCount = @FailCount + 1;
END

-- Test 4: Procedures exist
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CreateSale' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Procedure [app].[sp_CreateSale] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RestockProduct' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Procedure [app].[sp_RestockProduct] does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecordPayment' AND schema_id = SCHEMA_ID('app'))
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Procedure [app].[sp_RecordPayment] does not exist.';
    SET @FailCount = @FailCount + 1;
END

-- Test 5: Triggers exist
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Product_UpdatedAt')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Trigger [app].[trg_Product_UpdatedAt] does not exist.';
    SET @FailCount = @FailCount + 1;
END

-- Test 6: Foreign keys exist
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Products_Categories')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: FK_Products_Categories does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_Roles')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: FK_Users_Roles does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Sales_Customers')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: FK_Sales_Customers does not exist.';
    SET @FailCount = @FailCount + 1;
END

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_SaleItems_Sales')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: FK_SaleItems_Sales does not exist.';
    SET @FailCount = @FailCount + 1;
END

-- Summary
PRINT '';
PRINT '============================================';
PRINT CONCAT('Results: ', @PassCount, ' passed, ', @FailCount, ' failed');
PRINT '============================================';

IF @FailCount = 0
    PRINT 'ALL TESTS PASSED.';
ELSE
    PRINT 'SOME TESTS FAILED. Review output above.';
GO
