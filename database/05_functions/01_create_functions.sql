-- ============================================================
-- StoreTrack V3 — Create Functions
-- ============================================================
-- Utility functions for common calculations.
-- ============================================================

USE [StoreTrackV3];
GO

-- ------------------------------------------------------------
-- fn_CalculateTotalQuantity
-- Returns total stock for a product given its parameters.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_CalculateTotalQuantity' AND type = 'FN')
    DROP FUNCTION [app].[fn_CalculateTotalQuantity];
GO

CREATE FUNCTION [app].[fn_CalculateTotalQuantity]
(
    @IsBoxed     BIT,
    @Boxes       INT,
    @ItemsPerBox INT,
    @ExtraPieces INT
)
RETURNS INT
AS
BEGIN
    DECLARE @Total INT;
    IF @IsBoxed = 1
        SET @Total = @Boxes * @ItemsPerBox + @ExtraPieces;
    ELSE
        SET @Total = @ExtraPieces;
    RETURN @Total;
END;
GO

PRINT 'Function [app].[fn_CalculateTotalQuantity] created.';
GO

-- ------------------------------------------------------------
-- fn_GetStockStatus
-- Returns stock status string for a product.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetStockStatus' AND type = 'FN')
    DROP FUNCTION [app].[fn_GetStockStatus];
GO

CREATE FUNCTION [app].[fn_GetStockStatus]
(
    @IsBoxed           BIT,
    @Boxes             INT,
    @ItemsPerBox       INT,
    @ExtraPieces       INT,
    @LowStockThreshold INT
)
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @Total INT = [app].[fn_CalculateTotalQuantity](@IsBoxed, @Boxes, @ItemsPerBox, @ExtraPieces);
    IF @Total = 0 RETURN 'out_of_stock';
    IF @Total <= @LowStockThreshold RETURN 'low_stock';
    RETURN 'in_stock';
END;
GO

PRINT 'Function [app].[fn_GetStockStatus] created.';
GO

-- ------------------------------------------------------------
-- fn_GetCustomerOutstanding
-- Returns the current outstanding balance for a customer.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_GetCustomerOutstanding' AND type = 'FN')
    DROP FUNCTION [app].[fn_GetCustomerOutstanding];
GO

CREATE FUNCTION [app].[fn_GetCustomerOutstanding]
(
    @CustomerId NVARCHAR(50)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @Outstanding DECIMAL(18,2) = 0;
    SELECT @Outstanding = ISNULL(
        SUM(CASE WHEN [Kind] = 'purchase' THEN [Amount] ELSE -[Amount] END), 0)
    FROM [app].[LedgerEntries]
    WHERE [CustomerId] = @CustomerId;
    RETURN @Outstanding;
END;
GO

PRINT 'Function [app].[fn_GetCustomerOutstanding] created.';
GO

-- ------------------------------------------------------------
-- fn_NextInvoice
-- Generates the next invoice number.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fn_NextInvoice' AND type = 'FN')
    DROP FUNCTION [app].[fn_NextInvoice];
GO

CREATE FUNCTION [app].[fn_NextInvoice]()
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @MaxNum INT;
    DECLARE @NextNum INT;
    DECLARE @Invoice NVARCHAR(50);

    SELECT @MaxNum = ISNULL(
        MAX(CAST(SUBSTRING([Invoice], 5, LEN([Invoice]) - 4) AS INT)), 9200)
    FROM [app].[Sales]
    WHERE [Invoice] LIKE 'INV-%';

    SET @NextNum = @MaxNum + 1;
    SET @Invoice = 'INV-' + CAST(@NextNum AS NVARCHAR(20));
    RETURN @Invoice;
END;
GO

PRINT 'Function [app].[fn_NextInvoice] created.';
GO

PRINT 'All functions created successfully.';
GO
