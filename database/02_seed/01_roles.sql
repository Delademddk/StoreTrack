-- ============================================================
-- StoreTrack V3 — Seed Roles
-- ============================================================
-- Inserts the default roles for StoreTrack V3.
-- ============================================================

USE [StoreTrackV3];
GO

MERGE INTO [app].[Roles] AS target
USING (VALUES
    ('role_admin',   'Admin',   'Full system access', SYSUTCDATETIME()),
    ('role_manager', 'Manager', 'Product and category management', SYSUTCDATETIME()),
    ('role_cashier', 'Cashier', 'Sales and customer access', SYSUTCDATETIME())
) AS source ([Id], [Name], [Description], [CreatedAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [Name] = source.[Name], [Description] = source.[Description]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Name], [Description], [CreatedAt])
    VALUES (source.[Id], source.[Name], source.[Description], source.[CreatedAt]);
GO

PRINT 'Roles seeded.';
GO
