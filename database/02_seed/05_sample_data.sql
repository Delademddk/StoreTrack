-- ============================================================
-- StoreTrack V3 — Seed Sample Data
-- ============================================================
-- Inserts development sample data: products, customers, sales,
-- ledger entries, activity, audit log, and settings.
-- ALL DATA IS FOR DEVELOPMENT/TESTING ONLY.
-- ============================================================

USE [StoreTrackV3];
GO

-- ============================================================
-- 1. ROLE PERMISSIONS
-- ============================================================
-- Admin gets all permissions
MERGE INTO [app].[RolePermissions] AS target
USING (VALUES
    ('role_admin', 'perm_view_dashboard'),
    ('role_admin', 'perm_view_products'),
    ('role_admin', 'perm_add_products'),
    ('role_admin', 'perm_edit_products'),
    ('role_admin', 'perm_delete_products'),
    ('role_admin', 'perm_manage_categories'),
    ('role_admin', 'perm_view_sales'),
    ('role_admin', 'perm_create_sales'),
    ('role_admin', 'perm_view_reports'),
    ('role_admin', 'perm_export_reports'),
    ('role_admin', 'perm_manage_users'),
    ('role_admin', 'perm_manage_settings'),
    ('role_admin', 'perm_backup_database'),
    ('role_cashier', 'perm_view_dashboard'),
    ('role_cashier', 'perm_view_products'),
    ('role_cashier', 'perm_view_sales'),
    ('role_cashier', 'perm_create_sales'),
    ('role_cashier', 'perm_view_reports'),
    ('role_keeper', 'perm_view_dashboard'),
    ('role_keeper', 'perm_view_products')
) AS source ([RoleId], [PermissionId])
ON target.[RoleId] = source.[RoleId] AND target.[PermissionId] = source.[PermissionId]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([RoleId], [PermissionId]) VALUES (source.[RoleId], source.[PermissionId]);
GO

PRINT 'Role permissions seeded.';
GO

-- ============================================================
-- 2. SAMPLE PRODUCTS
-- ============================================================
MERGE INTO [app].[Products] AS target
USING (VALUES
    ('p_01', 'SKU-SPH-2024-BK', 'Studio Pro Headphones',    'Premium noise-cancelling headphones with deep bass.', 'cat_1', 'AudioTech',    'Northwind Traders', 1, 42, 12, 3,  1200.00, 129.99, 10, '5901234123457', NULL, DATEADD(DAY, -90, SYSUTCDATETIME()), DATEADD(DAY, -2, SYSUTCDATETIME())),
    ('p_02', 'SKU-NAR-7520-V2', 'NuPhy Air75 V2 Mechanical', 'Ultra-slim mechanical keyboard with hot-swappable switches.', 'cat_2', 'NuPhy', 'Keyboardery', 1, 2, 5, 0, 800.00, 175.00, 8, '6512345678901', NULL, DATEADD(DAY, -60, SYSUTCDATETIME()), DATEADD(DAY, -5, SYSUTCDATETIME())),
    ('p_03', 'SKU-MXW-2024-G2', 'MX-Wireless Mouse G2',     'Ergonomic wireless mouse with adjustable DPI.', 'cat_2', 'LogiMax', 'Halcyon Direct', 0, 0, 1, 24, 0.00, 64.50, 15, '4901234567890', NULL, DATEADD(DAY, -45, SYSUTCDATETIME()), DATEADD(DAY, -1, SYSUTCDATETIME())),
    ('p_04', 'SKU-UBP-14M3-PRO', 'UltraBook Pro 14" M3',    '14-inch laptop with M3 chip, 16GB RAM, 512GB SSD.', 'cat_3', 'Apple', 'Halcyon Direct', 0, 0, 1, 8, 0.00, 2149.00, 5, '1234567890123', NULL, DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, -3, SYSUTCDATETIME())),
    ('p_05', 'SKU-SWE-ANC-EL', 'SonicWave Elite ANC',      'True wireless earbuds with active noise cancellation.', 'cat_4', 'SonicWave', 'Northwind Traders', 1, 1, 10, 2, 450.00, 99.00, 12, '7891234560123', NULL, DATEADD(DAY, -75, SYSUTCDATETIME()), DATEADD(DAY, -7, SYSUTCDATETIME())),
    ('p_06', 'SKU-ACM-2024-CS', 'Artisan Ceramic Mug Set',  'Handcrafted 4-piece ceramic mug set in matte finish.', 'cat_5', 'KilnCraft', 'Kiln & Co', 1, 18, 6, 2, 90.00, 18.00, 20, '3456789012345', NULL, DATEADD(DAY, -120, SYSUTCDATETIME()), DATEADD(DAY, -10, SYSUTCDATETIME())),
    ('p_07', 'SKU-MBEK-2024-MB', 'Matte Black Electric Kettle', '1.7L fast-boil kettle with matte black stainless steel finish.', 'cat_5', 'KilnCraft', 'Muji Wholesale', 0, 0, 1, 8, 0.00, 58.00, 10, '2345678901234', NULL, DATEADD(DAY, -50, SYSUTCDATETIME()), DATEADD(DAY, -4, SYSUTCDATETIME())),
    ('p_08', 'SKU-MDL-2024-SL', 'Minimalist Desk Lamp',     'Adjustable LED desk lamp with touch dimmer and USB port.', 'cat_5', 'LumaHome', 'Nord Distributors', 1, 6, 8, 3, 480.00, 72.00, 8, '8901234567890', NULL, DATEADD(DAY, -40, SYSUTCDATETIME()), DATEADD(DAY, -6, SYSUTCDATETIME()))
) AS source ([Id], [Sku], [Name], [Description], [CategoryId], [Brand], [Supplier], [IsBoxed], [Boxes], [ItemsPerBox], [ExtraPieces], [PricePerBox], [IndividualPrice], [LowStockThreshold], [Barcode], [Image], [CreatedAt], [UpdatedAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [Sku] = source.[Sku], [Name] = source.[Name], [Description] = source.[Description],
               [CategoryId] = source.[CategoryId], [Brand] = source.[Brand], [Supplier] = source.[Supplier],
               [IsBoxed] = source.[IsBoxed], [Boxes] = source.[Boxes], [ItemsPerBox] = source.[ItemsPerBox],
               [ExtraPieces] = source.[ExtraPieces], [PricePerBox] = source.[PricePerBox],
               [IndividualPrice] = source.[IndividualPrice], [LowStockThreshold] = source.[LowStockThreshold],
               [Barcode] = source.[Barcode], [UpdatedAt] = source.[UpdatedAt]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Sku], [Name], [Description], [CategoryId], [Brand], [Supplier], [IsBoxed], [Boxes], [ItemsPerBox], [ExtraPieces], [PricePerBox], [IndividualPrice], [LowStockThreshold], [Barcode], [Image], [CreatedAt], [UpdatedAt])
    VALUES (source.[Id], source.[Sku], source.[Name], source.[Description], source.[CategoryId], source.[Brand], source.[Supplier], source.[IsBoxed], source.[Boxes], source.[ItemsPerBox], source.[ExtraPieces], source.[PricePerBox], source.[IndividualPrice], source.[LowStockThreshold], source.[Barcode], source.[Image], source.[CreatedAt], source.[UpdatedAt]);
GO

PRINT 'Sample products seeded.';
GO

-- ============================================================
-- 3. SAMPLE CUSTOMERS
-- ============================================================
MERGE INTO [app].[Customers] AS target
USING (VALUES
    ('c_01', 'Bloom Interiors Ltd', '+254 712 345 678', 'Kenyatta Avenue, Nairobi', 'Interior design firm, bulk buyer', DATEADD(DAY, -90, SYSUTCDATETIME()), DATEADD(DAY, -2, SYSUTCDATETIME())),
    ('c_02', 'Priya Menon',         '+254 723 456 789', 'Westlands, Nairobi',       NULL,                               DATEADD(DAY, -60, SYSUTCDATETIME()), DATEADD(DAY, -5, SYSUTCDATETIME())),
    ('c_03', 'Ken Miles',           '+254 734 567 890', 'Kasarani, Nairobi',        'Regular customer',                 DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, -1, SYSUTCDATETIME()))
) AS source ([Id], [Name], [Phone], [Address], [Notes], [CreatedAt], [UpdatedAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [Name] = source.[Name], [Phone] = source.[Phone], [Address] = source.[Address], [Notes] = source.[Notes], [UpdatedAt] = source.[UpdatedAt]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Name], [Phone], [Address], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (source.[Id], source.[Name], source.[Phone], source.[Address], source.[Notes], source.[CreatedAt], source.[UpdatedAt]);
GO

PRINT 'Sample customers seeded.';
GO

-- ============================================================
-- 4. SAMPLE SALES
-- ============================================================
MERGE INTO [app].[Sales] AS target
USING (VALUES
    ('s_01', 'INV-9204', 'c_01', 'Bloom Interiors Ltd', 'Admin User', 'u_01', 216.00, 0.00, 0.00, 216.00, 'Cash',       0, NULL, NULL, DATEADD(HOUR, -3,  SYSUTCDATETIME())),
    ('s_02', 'INV-9203', 'c_02', 'Priya Menon',         'Admin User', 'u_01', 163.50, 10.00, 0.00, 153.50, 'Card',       0, NULL, NULL, DATEADD(HOUR, -6,  SYSUTCDATETIME())),
    ('s_03', 'INV-9202', 'c_03', 'Ken Miles',           'Admin User', 'u_01', 2149.00, 0.00, 0.00, 2149.00, 'Mobile Money', 0, NULL, NULL, DATEADD(HOUR, -12, SYSUTCDATETIME())),
    ('s_04', 'INV-9198', 'c_01', 'Bloom Interiors Ltd', 'Admin User', 'u_01', 564.97, 50.00, 0.00, 514.97, 'Cash',       0, NULL, NULL, DATEADD(DAY, -1, SYSUTCDATETIME()))
) AS source ([Id], [Invoice], [CustomerId], [CustomerName], [CashierName], [UserId], [Subtotal], [Discount], [Tax], [Total], [Method], [OnCredit], [AmountPaid], [Notes], [SoldAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [Invoice] = source.[Invoice], [Total] = source.[Total]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Invoice], [CustomerId], [CustomerName], [CashierName], [UserId], [Subtotal], [Discount], [Tax], [Total], [Method], [OnCredit], [AmountPaid], [Notes], [SoldAt])
    VALUES (source.[Id], source.[Invoice], source.[CustomerId], source.[CustomerName], source.[CashierName], source.[UserId], source.[Subtotal], source.[Discount], source.[Tax], source.[Total], source.[Method], source.[OnCredit], source.[AmountPaid], source.[Notes], source.[SoldAt]);
GO

-- Sample Sale Items
MERGE INTO [app].[SaleItems] AS target
USING (VALUES
    ('si_01', 's_01', 'p_08', 'Minimalist Desk Lamp',      2, 72.00),
    ('si_02', 's_01', 'p_06', 'Artisan Ceramic Mug Set',   4, 18.00),
    ('si_03', 's_02', 'p_05', 'SonicWave Elite ANC',       1, 99.00),
    ('si_04', 's_02', 'p_03', 'MX-Wireless Mouse G2',      1, 64.50),
    ('si_05', 's_03', 'p_04', 'UltraBook Pro 14" M3',      1, 2149.00),
    ('si_06', 's_04', 'p_01', 'Studio Pro Headphones',     3, 129.99),
    ('si_07', 's_04', 'p_02', 'NuPhy Air75 V2 Mechanical', 1, 175.00)
) AS source ([Id], [SaleId], [ProductId], [ProductName], [Quantity], [UnitPrice])
ON target.[Id] = source.[Id]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [SaleId], [ProductId], [ProductName], [Quantity], [UnitPrice])
    VALUES (source.[Id], source.[SaleId], source.[ProductId], source.[ProductName], source.[Quantity], source.[UnitPrice]);
GO

PRINT 'Sample sales seeded.';
GO

-- ============================================================
-- 5. SAMPLE LEDGER ENTRIES
-- ============================================================
MERGE INTO [app].[LedgerEntries] AS target
USING (VALUES
    ('le_01', 'c_01', 'purchase', 514.97, 514.97, NULL, NULL, NULL, 's_04', NULL, '3x Studio Pro Headphones, 1x NuPhy Air75 V2 Mechanical', DATEADD(DAY, -60, SYSUTCDATETIME())),
    ('le_02', 'c_01', 'payment',  200.00, 314.97, 'Cash', 'Partial payment', NULL, NULL, NULL, NULL, DATEADD(DAY, -45, SYSUTCDATETIME())),
    ('le_03', 'c_01', 'purchase', 216.00, 530.97, NULL, NULL, NULL, 's_01', DATEADD(DAY, -5, SYSUTCDATETIME()), '2x Minimalist Desk Lamp, 4x Artisan Ceramic Mug Set', DATEADD(DAY, -10, SYSUTCDATETIME())),
    ('le_04', 'c_02', 'purchase', 350.00, 350.00, NULL, NULL, NULL, NULL,   DATEADD(DAY, -2, SYSUTCDATETIME()), '2x MX-Wireless Mouse G2', DATEADD(DAY, -20, SYSUTCDATETIME())),
    ('le_05', 'c_02', 'payment',  100.00, 250.00, 'Mobile Money', 'M-Pesa', NULL, NULL, NULL, NULL, DATEADD(DAY, -15, SYSUTCDATETIME())),
    ('le_06', 'c_03', 'purchase', 149.00, 149.00, NULL, NULL, NULL, NULL,   DATEADD(DAY, -10, SYSUTCDATETIME()), '2x Matte Black Electric Kettle', DATEADD(DAY, -5, SYSUTCDATETIME()))
) AS source ([Id], [CustomerId], [Kind], [Amount], [BalanceAfter], [Method], [Reference], [Notes], [SaleId], [ExpectedPaymentDate], [LineSummary], [EntryAt])
ON target.[Id] = source.[Id]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [CustomerId], [Kind], [Amount], [BalanceAfter], [Method], [Reference], [Notes], [SaleId], [ExpectedPaymentDate], [LineSummary], [EntryAt])
    VALUES (source.[Id], source.[CustomerId], source.[Kind], source.[Amount], source.[BalanceAfter], source.[Method], source.[Reference], source.[Notes], source.[SaleId], source.[ExpectedPaymentDate], source.[LineSummary], source.[EntryAt]);
GO

PRINT 'Sample ledger entries seeded.';
GO

-- ============================================================
-- 6. SAMPLE ACTIVITY
-- ============================================================
MERGE INTO [app].[ActivityLog] AS target
USING (VALUES
    ('a_01', 'sale',      'Sale recorded',      'INV-9204 — Bloom Interiors Ltd, $216.00', 'Admin User', DATEADD(HOUR, -2,  SYSUTCDATETIME())),
    ('a_02', 'restock',   'Inventory restocked', 'Studio Pro Headphones: +20 units',        'Admin User', DATEADD(HOUR, -5,  SYSUTCDATETIME())),
    ('a_03', 'low_stock', 'Low stock alert',     'NuPhy Air75 V2 Mechanical below threshold (10 units left)', 'System', DATEADD(HOUR, -8,  SYSUTCDATETIME())),
    ('a_04', 'edit',      'Product updated',     'Studio Pro Headphones — price adjusted to $129.99', 'Admin User', DATEADD(HOUR, -12, SYSUTCDATETIME())),
    ('a_05', 'user',      'New user added',      'Cashier User joined as Cashier',         'Admin User', DATEADD(DAY, -1,  SYSUTCDATETIME())),
    ('a_06', 'settings',  'Backup completed',    'Full database backup exported successfully', 'System', DATEADD(DAY, -2,  SYSUTCDATETIME()))
) AS source ([Id], [Kind], [Title], [Description], [Actor], [OccurredAt])
ON target.[Id] = source.[Id]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Kind], [Title], [Description], [Actor], [OccurredAt])
    VALUES (source.[Id], source.[Kind], source.[Title], source.[Description], source.[Actor], source.[OccurredAt]);
GO

PRINT 'Sample activity seeded.';
GO

-- ============================================================
-- 7. SAMPLE AUDIT LOG
-- ============================================================
MERGE INTO [app].[AuditLog] AS target
USING (VALUES
    ('al_01', 'u_01', 'Admin User',  'Product Updated',   'SKU-SPH-2024-BK',   'Studio Pro Headphones — price adjusted to $129.99', DATEADD(HOUR, -1,  SYSUTCDATETIME())),
    ('al_02', 'u_01', 'Admin User',  'Sale Recorded',     'INV-9204',          'Cash sale of $216.00 to Bloom Interiors Ltd',       DATEADD(HOUR, -3,  SYSUTCDATETIME())),
    ('al_03', 'u_01', 'Admin User',  'Sale Recorded',     'INV-9203',          'Card sale of $153.50 to Priya Menon',               DATEADD(HOUR, -6,  SYSUTCDATETIME())),
    ('al_04', 'u_01', 'Admin User',  'Inventory Restock', 'SKU-SPH-2024-BK',   'Added 20 units to Studio Pro Headphones',           DATEADD(HOUR, -8,  SYSUTCDATETIME())),
    ('al_05', NULL,   'System',      'Low Stock Alert',   'SKU-NAR-7520-V2',   'NuPhy Air75 V2 Mechanical below threshold',         DATEADD(HOUR, -10, SYSUTCDATETIME())),
    ('al_06', 'u_01', 'Admin User',  'User Created',      'cashier',           'New user Cashier User created with role Cashier',    DATEADD(HOUR, -14, SYSUTCDATETIME())),
    ('al_07', NULL,   'System',      'Backup Completed',  'backup_2024_07_22', 'Full database backup exported',                     DATEADD(HOUR, -20, SYSUTCDATETIME()))
) AS source ([Id], [UserId], [UserName], [Action], [Target], [Description], [OccurredAt])
ON target.[Id] = source.[Id]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [UserId], [UserName], [Action], [Target], [Description], [OccurredAt])
    VALUES (source.[Id], source.[UserId], source.[UserName], source.[Action], source.[Target], source.[Description], source.[OccurredAt]);
GO

PRINT 'Sample audit log seeded.';
GO

-- ============================================================
-- 8. DEFAULT SETTINGS
-- ============================================================
MERGE INTO [app].[Settings] AS target
USING (VALUES
    ('default', 'StoreTrack Demo Store', 'admin@storetrack.com', '+1 555 0123', 'USD', '123 Main Street, Nairobi, Kenya',
     16.00, 10, 'Thank you for shopping with us!', 1, 1, 0, 1, SYSUTCDATETIME())
) AS source ([Id], [StoreName], [Email], [Phone], [Currency], [Address], [TaxRate], [LowStockThreshold], [ReceiptFooter], [BarcodeScanning], [LowStockAlerts], [TwoFactorAuth], [SessionTimeout], [UpdatedAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET [StoreName] = source.[StoreName], [Email] = source.[Email], [Phone] = source.[Phone],
               [Currency] = source.[Currency], [Address] = source.[Address], [TaxRate] = source.[TaxRate],
               [UpdatedAt] = source.[UpdatedAt]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [StoreName], [Email], [Phone], [Currency], [Address], [TaxRate], [LowStockThreshold], [ReceiptFooter], [BarcodeScanning], [LowStockAlerts], [TwoFactorAuth], [SessionTimeout], [UpdatedAt])
    VALUES (source.[Id], source.[StoreName], source.[Email], source.[Phone], source.[Currency], source.[Address], source.[TaxRate], source.[LowStockThreshold], source.[ReceiptFooter], source.[BarcodeScanning], source.[LowStockAlerts], source.[TwoFactorAuth], source.[SessionTimeout], source.[UpdatedAt]);
GO

PRINT 'Default settings seeded.';
GO

PRINT '=== All sample data seeded successfully ===';
GO
