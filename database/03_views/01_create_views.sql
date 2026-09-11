-- ============================================================
-- StoreTrack V3 — Create Views
-- ============================================================
-- Useful views for common read operations.
-- ============================================================

USE [StoreTrackV3];
GO

-- ------------------------------------------------------------
-- vw_ProductInventory
-- Shows each product with computed total quantity and status.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ProductInventory' AND schema_id = SCHEMA_ID('app'))
    DROP VIEW [app].[vw_ProductInventory];
GO

CREATE VIEW [app].[vw_ProductInventory]
AS
SELECT
    p.[Id],
    p.[Sku],
    p.[Name],
    p.[Brand],
    p.[Supplier],
    p.[IsBoxed],
    p.[Boxes],
    p.[ItemsPerBox],
    p.[ExtraPieces],
    CASE
        WHEN p.[IsBoxed] = 1 THEN p.[Boxes] * p.[ItemsPerBox] + p.[ExtraPieces]
        ELSE p.[ExtraPieces]
    END AS [TotalQuantity],
    p.[PricePerBox],
    p.[IndividualPrice],
    p.[LowStockThreshold],
    p.[Barcode],
    p.[Image],
    p.[Description],
    c.[Id]   AS [CategoryId],
    c.[Name] AS [CategoryName],
    c.[Color] AS [CategoryColor],
    p.[CreatedAt],
    p.[UpdatedAt],
    CASE
        WHEN p.[IsBoxed] = 1 AND (p.[Boxes] * p.[ItemsPerBox] + p.[ExtraPieces]) = 0 THEN 'out_of_stock'
        WHEN p.[IsBoxed] = 0 AND p.[ExtraPieces] = 0 THEN 'out_of_stock'
        WHEN p.[IsBoxed] = 1 AND (p.[Boxes] * p.[ItemsPerBox] + p.[ExtraPieces]) <= p.[LowStockThreshold] THEN 'low_stock'
        WHEN p.[IsBoxed] = 0 AND p.[ExtraPieces] <= p.[LowStockThreshold] THEN 'low_stock'
        ELSE 'in_stock'
    END AS [StockStatus]
FROM [app].[Products] p
INNER JOIN [app].[Categories] c ON p.[CategoryId] = c.[Id];
GO

PRINT 'View [app].[vw_ProductInventory] created.';
GO

-- ------------------------------------------------------------
-- vw_LowStockProducts
-- Shows only products at or below low stock threshold.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_LowStockProducts' AND schema_id = SCHEMA_ID('app'))
    DROP VIEW [app].[vw_LowStockProducts];
GO

CREATE VIEW [app].[vw_LowStockProducts]
AS
SELECT * FROM [app].[vw_ProductInventory]
WHERE [StockStatus] IN ('low_stock', 'out_of_stock');
GO

PRINT 'View [app].[vw_LowStockProducts] created.';
GO

-- ------------------------------------------------------------
-- vw_SalesSummary
-- Aggregated sales data per invoice.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SalesSummary' AND schema_id = SCHEMA_ID('app'))
    DROP VIEW [app].[vw_SalesSummary];
GO

CREATE VIEW [app].[vw_SalesSummary]
AS
SELECT
    s.[Id],
    s.[Invoice],
    s.[CustomerId],
    s.[CustomerName],
    s.[CashierName],
    s.[Subtotal],
    s.[Discount],
    s.[Tax],
    s.[Total],
    s.[Method],
    s.[OnCredit],
    s.[SoldAt],
    COUNT(si.[Id]) AS [ItemCount]
FROM [app].[Sales] s
LEFT JOIN [app].[SaleItems] si ON s.[Id] = si.[SaleId]
GROUP BY
    s.[Id], s.[Invoice], s.[CustomerId], s.[CustomerName],
    s.[CashierName], s.[Subtotal], s.[Discount], s.[Tax],
    s.[Total], s.[Method], s.[OnCredit], s.[SoldAt];
GO

PRINT 'View [app].[vw_SalesSummary] created.';
GO

-- ------------------------------------------------------------
-- vw_CreditorBalances
-- Computed outstanding balances from ledger entries.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_CreditorBalances' AND schema_id = SCHEMA_ID('app'))
    DROP VIEW [app].[vw_CreditorBalances];
GO

CREATE VIEW [app].[vw_CreditorBalances]
AS
SELECT
    c.[Id] AS [CustomerId],
    c.[Name] AS [CustomerName],
    c.[Phone],
    ISNULL(SUM(CASE WHEN le.[Kind] = 'purchase' THEN le.[Amount] ELSE 0 END), 0) AS [TotalPurchases],
    ISNULL(SUM(CASE WHEN le.[Kind] = 'payment' THEN le.[Amount] ELSE 0 END), 0) AS [TotalPaid],
    ISNULL(SUM(CASE WHEN le.[Kind] = 'purchase' THEN le.[Amount] ELSE -le.[Amount] END), 0) AS [Outstanding],
    MAX(CASE WHEN le.[Kind] = 'purchase' THEN le.[EntryAt] END) AS [LastPurchaseAt],
    MAX(le.[EntryAt]) AS [LastActivityAt]
FROM [app].[Customers] c
LEFT JOIN [app].[LedgerEntries] le ON c.[Id] = le.[CustomerId]
GROUP BY c.[Id], c.[Name], c.[Phone];
GO

PRINT 'View [app].[vw_CreditorBalances] created.';
GO

-- ------------------------------------------------------------
-- vw_RecentSales
-- Latest 100 sales with item count.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_RecentSales' AND schema_id = SCHEMA_ID('app'))
    DROP VIEW [app].[vw_RecentSales];
GO

CREATE VIEW [app].[vw_RecentSales]
AS
SELECT TOP 100
    s.[Id],
    s.[Invoice],
    s.[CustomerName],
    s.[CashierName],
    s.[Total],
    s.[Method],
    s.[SoldAt],
    (SELECT COUNT(*) FROM [app].[SaleItems] si WHERE si.[SaleId] = s.[Id]) AS [ItemCount]
FROM [app].[Sales] s
ORDER BY s.[SoldAt] DESC;
GO

PRINT 'View [app].[vw_RecentSales] created.';
GO

-- ------------------------------------------------------------
-- vw_InventoryTimeline
-- Chronological inventory movements with product info.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InventoryTimeline' AND schema_id = SCHEMA_ID('app'))
    DROP VIEW [app].[vw_InventoryTimeline];
GO

CREATE VIEW [app].[vw_InventoryTimeline]
AS
SELECT
    im.[Id],
    im.[ProductId],
    p.[Name] AS [ProductName],
    p.[Sku],
    im.[MovementType],
    im.[Quantity],
    im.[Boxes],
    im.[Pieces],
    im.[Reason],
    im.[Notes],
    im.[UserName],
    im.[OccurredAt]
FROM [app].[InventoryMovements] im
INNER JOIN [app].[Products] p ON im.[ProductId] = p.[Id];
GO

PRINT 'View [app].[vw_InventoryTimeline] created.';
GO

PRINT 'All views created successfully.';
GO
