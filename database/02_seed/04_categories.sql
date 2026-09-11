-- ============================================================
-- StoreTrack V3 — Seed Categories
-- ============================================================
-- Inserts the default product categories for StoreTrack V3.
-- ============================================================

USE [StoreTrackV3];
GO

MERGE INTO [app].[Categories] AS target
USING (VALUES
    ('cat_1', 'Electronics',     '#3b82f6', 'Cpu',          'Electronic devices and gadgets',       DATEADD(DAY, -120, SYSUTCDATETIME())),
    ('cat_2', 'Peripherals',     '#8b5cf6', 'Keyboard',     'Input devices and accessories',         DATEADD(DAY, -120, SYSUTCDATETIME())),
    ('cat_3', 'Computers',       '#06b6d4', 'Monitor',      'Desktops, laptops, and components',     DATEADD(DAY, -120, SYSUTCDATETIME())),
    ('cat_4', 'Audio',           '#f59e0b', 'Headphones',   'Speakers, earbuds, and audio gear',     DATEADD(DAY, -120, SYSUTCDATETIME())),
    ('cat_5', 'Home & Living',   '#10b981', 'Home',         'Household and lifestyle products',      DATEADD(DAY, -120, SYSUTCDATETIME()))
) AS source ([Id], [Name], [Color], [Icon], [Description], [CreatedAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [Name] = source.[Name], [Color] = source.[Color], [Icon] = source.[Icon], [Description] = source.[Description]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Name], [Color], [Icon], [Description], [CreatedAt])
    VALUES (source.[Id], source.[Name], source.[Color], source.[Icon], source.[Description], source.[CreatedAt]);
GO

PRINT 'Categories seeded.';
GO
