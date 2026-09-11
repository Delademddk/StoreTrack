-- ============================================================
-- StoreTrack V3 — Seed Permissions
-- ============================================================
-- Inserts the default permissions for StoreTrack V3.
-- ============================================================

USE [StoreTrackV3];
GO

MERGE INTO [app].[Permissions] AS target
USING (VALUES
    ('perm_view_dashboard',      'View Dashboard',       'View dashboard KPIs and analytics'),
    ('perm_view_products',       'View Products',        'View product catalog'),
    ('perm_add_products',        'Add Products',         'Create new products'),
    ('perm_edit_products',       'Edit Products',        'Edit existing products'),
    ('perm_delete_products',     'Delete Products',      'Delete products'),
    ('perm_manage_categories',   'Manage Categories',    'Create, edit, and delete categories'),
    ('perm_view_sales',          'View Sales',           'View sales history'),
    ('perm_create_sales',        'Create Sales',         'Record new sales'),
    ('perm_view_reports',        'View Reports',         'View reports and analytics'),
    ('perm_export_reports',      'Export Reports',       'Export reports to CSV/PDF'),
    ('perm_manage_users',        'Manage Users',         'Create, edit, and delete users'),
    ('perm_manage_settings',     'Manage Settings',      'Manage store settings'),
    ('perm_backup_database',     'Backup/Restore Database', 'Backup and restore database')
) AS source ([Id], [Name], [Description])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [Name] = source.[Name], [Description] = source.[Description]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Name], [Description])
    VALUES (source.[Id], source.[Name], source.[Description]);
GO

PRINT 'Permissions seeded.';
GO
