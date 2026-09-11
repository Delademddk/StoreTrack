-- ============================================================
-- StoreTrack V3 — Seed Data Validation Tests
-- ============================================================
-- Verifies that seed data was inserted correctly.
-- Run after 02_seed scripts.
-- ============================================================

USE [StoreTrackV3];
GO

PRINT '============================================';
PRINT 'StoreTrack V3 — Seed Data Tests';
PRINT '============================================';
PRINT '';

DECLARE @PassCount INT = 0;
DECLARE @FailCount INT = 0;

-- Test: Roles exist
IF (SELECT COUNT(*) FROM [app].[Roles]) >= 4
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 4 roles.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Admin role exists
IF EXISTS (SELECT 1 FROM [app].[Roles] WHERE [Name] = 'Admin')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Admin role not found.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Cashier role exists
IF EXISTS (SELECT 1 FROM [app].[Roles] WHERE [Name] = 'Cashier')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Cashier role not found.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Permissions exist
IF (SELECT COUNT(*) FROM [app].[Permissions]) >= 13
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 13 permissions.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Admin user exists
IF EXISTS (SELECT 1 FROM [app].[Users] WHERE [Username] = 'admin' AND [Status] = 'Active')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Admin user not found.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Cashier user exists
IF EXISTS (SELECT 1 FROM [app].[Users] WHERE [Username] = 'cashier' AND [Status] = 'Active')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Cashier user not found.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Password hash is bcrypt format (starts with $2b$)
IF EXISTS (SELECT 1 FROM [app].[Users] WHERE [Username] = 'admin' AND [PasswordHash] LIKE '$2b$%')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Admin password hash is not bcrypt format.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Categories exist
IF (SELECT COUNT(*) FROM [app].[Categories]) >= 5
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 5 categories.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Products exist
IF (SELECT COUNT(*) FROM [app].[Products]) >= 8
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 8 products.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Products have unique SKUs
IF (SELECT COUNT(*) FROM [app].[Products]) = (SELECT COUNT(DISTINCT [Sku]) FROM [app].[Products])
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Duplicate SKUs found.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Customers exist
IF (SELECT COUNT(*) FROM [app].[Customers]) >= 3
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 3 customers.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Sales exist
IF (SELECT COUNT(*) FROM [app].[Sales]) >= 4
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 4 sales.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Sale items exist
IF (SELECT COUNT(*) FROM [app].[SaleItems]) >= 7
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 7 sale items.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Ledger entries exist
IF (SELECT COUNT(*) FROM [app].[LedgerEntries]) >= 6
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Expected at least 6 ledger entries.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Settings exist
IF EXISTS (SELECT 1 FROM [app].[Settings] WHERE [Id] = 'default')
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Default settings not found.';
    SET @FailCount = @FailCount + 1;
END

-- Test: Product-Category FK works
IF NOT EXISTS (
    SELECT 1 FROM [app].[Products] p
    WHERE NOT EXISTS (SELECT 1 FROM [app].[Categories] c WHERE c.[Id] = p.[CategoryId])
)
    SET @PassCount = @PassCount + 1;
ELSE
BEGIN
    PRINT 'FAIL: Orphaned products found (invalid CategoryId).';
    SET @FailCount = @FailCount + 1;
END

-- Summary
PRINT '';
PRINT '============================================';
PRINT CONCAT('Results: ', @PassCount, ' passed, ', @FailCount, ' failed');
PRINT '============================================';

IF @FailCount = 0
    PRINT 'ALL SEED DATA TESTS PASSED.';
ELSE
    PRINT 'SOME TESTS FAILED. Review output above.';
GO
