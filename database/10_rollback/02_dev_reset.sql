-- ============================================================
-- StoreTrack V3 — Development Reset Script
-- ============================================================
-- DEVELOPMENT ONLY — DESTRUCTIVE
-- Drops all data and re-seeds from scratch.
-- ============================================================

USE [StoreTrackV3];
GO

PRINT '============================================';
PRINT 'DEVELOPMENT RESET — ALL DATA WILL BE LOST';
PRINT '============================================';
PRINT '';

-- Delete all data in reverse dependency order
DELETE FROM [app].[ImportHistory];
DELETE FROM [app].[InventoryMovements];
DELETE FROM [app].[AuditLog];
DELETE FROM [app].[ActivityLog];
DELETE FROM [app].[LedgerEntries];
DELETE FROM [app].[SaleItems];
DELETE FROM [app].[Sales];
DELETE FROM [app].[Products];
DELETE FROM [app].[Categories];
DELETE FROM [app].[RolePermissions];
DELETE FROM [app].[Permissions];
DELETE FROM [app].[Roles];
DELETE FROM [app].[Users];
DELETE FROM [app].[Settings];

PRINT 'All data deleted.';
PRINT '';
PRINT 'To re-seed, run the scripts in 02_seed/ directory.';
GO
