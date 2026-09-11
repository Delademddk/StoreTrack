-- ============================================================
-- StoreTrack V3 — Report Views
-- ============================================================
-- Reporting layer for the StoreTrack V3 Reports page.
--
-- Supported report areas:
--   1. Report summary
--   2. 30-day revenue trend
--   3. Sales report
--   4. Sales by payment method
--   5. Sales by cashier
--   6. Product / inventory report
--   7. Audit log report
--   8. Creditor report
--   9. Inventory movement report
--
-- IMPORTANT:
-- InventoryValue represents potential selling value based on
-- current selling prices. It is NOT accounting cost valuation.
-- ============================================================

USE [StoreTrack];
GO


-- ============================================================
-- 1. vw_ReportSummary
-- ============================================================
-- Provides the four summary cards shown on the Reports page:
--
--   Daily Sales
--   Weekly Revenue
--   Monthly Revenue
--   Inventory Value
--
-- Sales/revenue are based on completed sales.
-- Credit sales are included because they are recorded sales.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportSummary', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportSummary];
END;
GO

CREATE VIEW [app].[vw_ReportSummary]
AS
SELECT
    -- Sales recorded today
    ISNULL
    (
        SUM
        (
            CASE
                WHEN CAST(s.[SoldAt] AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
                    THEN s.[Total]
                ELSE 0
            END
        ),
        0
    ) AS [DailySales],

    -- Revenue from the beginning of the current week.
    -- Monday is treated as the first day of the week.
    ISNULL
    (
        SUM
        (
            CASE
                WHEN s.[SoldAt] >=
                    DATEADD
                    (
                        DAY,
                        -((DATEDIFF(DAY, '19000101', CAST(SYSUTCDATETIME() AS DATE))) % 7),
                        CAST(SYSUTCDATETIME() AS DATE)
                    )
                    THEN s.[Total]
                ELSE 0
            END
        ),
        0
    ) AS [WeeklyRevenue],

    -- Revenue from the beginning of the current month.
    ISNULL
    (
        SUM
        (
            CASE
                WHEN s.[SoldAt] >=
                    DATEFROMPARTS
                    (
                        YEAR(SYSUTCDATETIME()),
                        MONTH(SYSUTCDATETIME()),
                        1
                    )
                    THEN s.[Total]
                ELSE 0
            END
        ),
        0
    ) AS [MonthlyRevenue],

    -- Current potential selling value of inventory.
    --
    -- Boxed product:
    --   complete boxes use PricePerBox
    --   loose pieces use IndividualPrice
    --
    -- Non-boxed product:
    --   all pieces use IndividualPrice
    ISNULL
    (
        (
            SELECT
                SUM
                (
                    CASE
                        WHEN p.[IsBoxed] = 1
                            THEN
                                (p.[Boxes] * p.[PricePerBox])
                                +
                                (p.[ExtraPieces] * p.[IndividualPrice])
                        ELSE
                            (p.[ExtraPieces] * p.[IndividualPrice])
                    END
                )
            FROM [app].[Products] p
        ),
        0
    ) AS [InventoryValue];

GO

PRINT 'View [app].[vw_ReportSummary] created.';
GO


-- ============================================================
-- 2. vw_ReportRevenueTrend30Days
-- ============================================================
-- Provides one row per day for the last 30 days.
--
-- Days with no sales are included with Revenue = 0 so the
-- frontend can render a continuous 30-day chart.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportRevenueTrend30Days', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportRevenueTrend30Days];
END;
GO

CREATE VIEW [app].[vw_ReportRevenueTrend30Days]
AS
WITH Numbers AS
(
    SELECT TOP (30)
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS [DayOffset]
    FROM sys.all_objects a
    CROSS JOIN sys.all_objects b
),
Dates AS
(
    SELECT
        CAST
        (
            DATEADD
            (
                DAY,
                -[DayOffset],
                CAST(SYSUTCDATETIME() AS DATE)
            )
            AS DATE
        ) AS [ReportDate]
    FROM Numbers
)
SELECT
    d.[ReportDate],
    ISNULL(SUM(s.[Total]), 0) AS [Revenue],
    COUNT(s.[Id]) AS [SaleCount]
FROM Dates d
LEFT JOIN [app].[Sales] s
    ON CAST(s.[SoldAt] AS DATE) = d.[ReportDate]
GROUP BY
    d.[ReportDate];
GO

PRINT 'View [app].[vw_ReportRevenueTrend30Days] created.';
GO


-- ============================================================
-- 3. vw_ReportSales
-- ============================================================
-- Detailed sales report for the Sales tab.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportSales', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportSales];
END;
GO

CREATE VIEW [app].[vw_ReportSales]
AS
SELECT
    s.[Id],
    s.[Invoice],

    s.[SoldAt],

    s.[CustomerId],
    s.[CustomerName],

    s.[CashierName],
    s.[UserId],

    s.[Subtotal],
    s.[Discount],
    s.[Total],

    s.[Method],
    s.[OnCredit],
    s.[AmountPaid],

    CASE
        WHEN s.[OnCredit] = 1
            THEN s.[Total] - ISNULL(s.[AmountPaid], 0)
        ELSE 0
    END AS [OutstandingAmount],

    s.[Notes],

    COUNT(si.[Id]) AS [ItemCount],

    ISNULL
    (
        SUM
        (
            CASE
                WHEN si.[SaleType] = N'box'
                    THEN si.[BoxQuantity]
                ELSE 0
            END
        ),
        0
    ) AS [BoxesSold],

    ISNULL
    (
        SUM
        (
            CASE
                WHEN si.[SaleType] = N'individual'
                    THEN si.[PieceQuantity]
                ELSE 0
            END
        ),
        0
    ) AS [IndividualPiecesSold],

    ISNULL(SUM(si.[Quantity]), 0) AS [TotalPiecesEquivalent]

FROM [app].[Sales] s
LEFT JOIN [app].[SaleItems] si
    ON s.[Id] = si.[SaleId]

GROUP BY
    s.[Id],
    s.[Invoice],
    s.[SoldAt],
    s.[CustomerId],
    s.[CustomerName],
    s.[CashierName],
    s.[UserId],
    s.[Subtotal],
    s.[Discount],
    s.[Total],
    s.[Method],
    s.[OnCredit],
    s.[AmountPaid],
    s.[Notes];
GO

PRINT 'View [app].[vw_ReportSales] created.';
GO


-- ============================================================
-- 4. vw_ReportSalesByPaymentMethod
-- ============================================================
-- Aggregates sales according to payment method.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportSalesByPaymentMethod', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportSalesByPaymentMethod];
END;
GO

CREATE VIEW [app].[vw_ReportSalesByPaymentMethod]
AS
SELECT
    s.[Method] AS [PaymentMethod],

    COUNT(*) AS [SaleCount],

    ISNULL(SUM(s.[Subtotal]), 0) AS [Subtotal],

    ISNULL(SUM(s.[Discount]), 0) AS [Discount],

    ISNULL(SUM(s.[Total]), 0) AS [Revenue],

    ISNULL(SUM(ISNULL(s.[AmountPaid], 0)), 0) AS [AmountPaid],

    ISNULL
    (
        SUM
        (
            CASE
                WHEN s.[OnCredit] = 1
                    THEN s.[Total] - ISNULL(s.[AmountPaid], 0)
                ELSE 0
            END
        ),
        0
    ) AS [OutstandingCredit]

FROM [app].[Sales] s
GROUP BY
    s.[Method];
GO

PRINT 'View [app].[vw_ReportSalesByPaymentMethod] created.';
GO


-- ============================================================
-- 5. vw_ReportSalesByCashier
-- ============================================================
-- Aggregates sales by cashier/user.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportSalesByCashier', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportSalesByCashier];
END;
GO

CREATE VIEW [app].[vw_ReportSalesByCashier]
AS
SELECT
    s.[UserId],
    s.[CashierName],

    COUNT(*) AS [SaleCount],

    ISNULL(SUM(s.[Subtotal]), 0) AS [Subtotal],

    ISNULL(SUM(s.[Discount]), 0) AS [Discount],

    ISNULL(SUM(s.[Total]), 0) AS [Revenue],

    ISNULL(SUM(ISNULL(s.[AmountPaid], 0)), 0) AS [AmountPaid]

FROM [app].[Sales] s
GROUP BY
    s.[UserId],
    s.[CashierName];
GO

PRINT 'View [app].[vw_ReportSalesByCashier] created.';
GO


-- ============================================================
-- 6. vw_ReportProducts
-- ============================================================
-- Product/inventory report for the Products tab.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportProducts', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportProducts];
END;
GO

CREATE VIEW [app].[vw_ReportProducts]
AS
SELECT
    p.[Id],
    p.[Sku],
    p.[Name],
    p.[Brand],
    p.[Supplier],

    p.[CategoryId],
    c.[Name] AS [CategoryName],

    p.[IsBoxed],
    p.[Boxes],
    p.[ItemsPerBox],
    p.[ExtraPieces],

    CASE
        WHEN p.[IsBoxed] = 1
            THEN
                (p.[Boxes] * p.[ItemsPerBox])
                + p.[ExtraPieces]
        ELSE
            p.[ExtraPieces]
    END AS [TotalQuantity],

    p.[PricePerBox],
    p.[IndividualPrice],

    CASE
        WHEN p.[IsBoxed] = 1
            THEN
                (p.[Boxes] * p.[PricePerBox])
                +
                (p.[ExtraPieces] * p.[IndividualPrice])
        ELSE
            (p.[ExtraPieces] * p.[IndividualPrice])
    END AS [InventoryValue],

    p.[LowStockThreshold],

    CASE
        WHEN
            (
                CASE
                    WHEN p.[IsBoxed] = 1
                        THEN
                            (p.[Boxes] * p.[ItemsPerBox])
                            + p.[ExtraPieces]
                    ELSE
                        p.[ExtraPieces]
                END
            ) = 0
            THEN N'out_of_stock'

        WHEN
            (
                CASE
                    WHEN p.[IsBoxed] = 1
                        THEN
                            (p.[Boxes] * p.[ItemsPerBox])
                            + p.[ExtraPieces]
                    ELSE
                        p.[ExtraPieces]
                END
            ) <= p.[LowStockThreshold]
            THEN N'low_stock'

        ELSE N'in_stock'
    END AS [StockStatus],

    p.[Barcode],
    p.[Image],
    p.[CreatedAt],
    p.[UpdatedAt]

FROM [app].[Products] p
LEFT JOIN [app].[Categories] c
    ON p.[CategoryId] = c.[Id];
GO

PRINT 'View [app].[vw_ReportProducts] created.';
GO


-- ============================================================
-- 7. vw_ReportAuditLog
-- ============================================================
-- Audit log data for the Audit Log tab.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportAuditLog', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportAuditLog];
END;
GO

CREATE VIEW [app].[vw_ReportAuditLog]
AS
SELECT
    al.[Id],
    al.[UserId],
    al.[UserName],
    al.[Action],
    al.[Target],
    al.[Description],
    al.[OccurredAt]

FROM [app].[AuditLog] al;
GO

PRINT 'View [app].[vw_ReportAuditLog] created.';
GO


-- ============================================================
-- 8. vw_ReportCreditors
-- ============================================================
-- Creditor/debt reporting.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportCreditors', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportCreditors];
END;
GO

CREATE VIEW [app].[vw_ReportCreditors]
AS
SELECT
    c.[Id] AS [CustomerId],
    c.[Name] AS [CustomerName],
    c.[Phone],
    c.[Address],

    ISNULL
    (
        SUM
        (
            CASE
                WHEN le.[Kind] = N'credit_sale'
                    THEN le.[Amount]
                ELSE 0
            END
        ),
        0
    ) AS [TotalCreditSales],

    ISNULL
    (
        SUM
        (
            CASE
                WHEN le.[Kind] = N'payment'
                    THEN le.[Amount]
                ELSE 0
            END
        ),
        0
    ) AS [TotalPaid],

    ISNULL
    (
        SUM
        (
            CASE
                WHEN le.[Kind] = N'credit_sale'
                    THEN le.[Amount]

                WHEN le.[Kind] = N'payment'
                    THEN -le.[Amount]

                ELSE 0
            END
        ),
        0
    ) AS [Outstanding],

    MAX
    (
        CASE
            WHEN le.[Kind] = N'credit_sale'
                THEN le.[EntryAt]
        END
    ) AS [LastCreditSaleAt],

    MAX(le.[EntryAt]) AS [LastActivityAt]

FROM [app].[Customers] c
LEFT JOIN [app].[LedgerEntries] le
    ON c.[Id] = le.[CustomerId]

GROUP BY
    c.[Id],
    c.[Name],
    c.[Phone],
    c.[Address];
GO

PRINT 'View [app].[vw_ReportCreditors] created.';
GO


-- ============================================================
-- 9. vw_ReportInventoryMovements
-- ============================================================
-- Inventory movement report.
-- ============================================================

IF OBJECT_ID(N'app.vw_ReportInventoryMovements', N'V') IS NOT NULL
BEGIN
    DROP VIEW [app].[vw_ReportInventoryMovements];
END;
GO

CREATE VIEW [app].[vw_ReportInventoryMovements]
AS
SELECT
    im.[Id],
    im.[ProductId],

    p.[Sku],
    p.[Name] AS [ProductName],

    c.[Name] AS [CategoryName],

    im.[MovementType],
    im.[Quantity],
    im.[Boxes],
    im.[Pieces],

    im.[Reference],
    im.[Reason],
    im.[Notes],

    im.[UserId],
    im.[UserName],
    im.[OccurredAt]

FROM [app].[InventoryMovements] im
INNER JOIN [app].[Products] p
    ON im.[ProductId] = p.[Id]
LEFT JOIN [app].[Categories] c
    ON p.[CategoryId] = c.[Id];
GO

PRINT 'View [app].[vw_ReportInventoryMovements] created.';
GO


-- ============================================================
-- FINAL VERIFICATION
-- ============================================================

PRINT '';
PRINT '============================================================';
PRINT 'StoreTrack V3 — Report View Verification';
PRINT '============================================================';

SELECT
    s.[name] AS [SchemaName],
    v.[name] AS [ViewName]
FROM sys.views v
INNER JOIN sys.schemas s
    ON v.[schema_id] = s.[schema_id]
WHERE s.[name] = N'app'
  AND v.[name] IN
  (
      N'vw_ReportSummary',
      N'vw_ReportRevenueTrend30Days',
      N'vw_ReportSales',
      N'vw_ReportSalesByPaymentMethod',
      N'vw_ReportSalesByCashier',
      N'vw_ReportProducts',
      N'vw_ReportAuditLog',
      N'vw_ReportCreditors',
      N'vw_ReportInventoryMovements'
  )
ORDER BY
    v.[name];


-- ============================================================
-- TEST REPORT SUMMARY
-- ============================================================

PRINT '';
PRINT '--- Report Summary ---';

SELECT
    [DailySales],
    [WeeklyRevenue],
    [MonthlyRevenue],
    [InventoryValue]
FROM [app].[vw_ReportSummary];


-- ============================================================
-- TEST 30-DAY REVENUE TREND
-- ============================================================

PRINT '';
PRINT '--- 30-Day Revenue Trend ---';

SELECT
    [ReportDate],
    [Revenue],
    [SaleCount]
FROM [app].[vw_ReportRevenueTrend30Days]
ORDER BY
    [ReportDate];


-- ============================================================
-- TEST PRODUCT REPORT
-- ============================================================

PRINT '';
PRINT '--- Product Report ---';

SELECT
    [Id],
    [Name],
    [TotalQuantity],
    [InventoryValue],
    [StockStatus]
FROM [app].[vw_ReportProducts]
ORDER BY
    [Id];


-- ============================================================
-- TEST CREDITOR REPORT
-- ============================================================

PRINT '';
PRINT '--- Creditor Report ---';

SELECT
    [CustomerId],
    [CustomerName],
    [TotalCreditSales],
    [TotalPaid],
    [Outstanding]
FROM [app].[vw_ReportCreditors]
ORDER BY
    [CustomerName];


PRINT '';
PRINT '============================================================';
PRINT 'All StoreTrack V3 report views created successfully.';
PRINT '============================================================';
GO