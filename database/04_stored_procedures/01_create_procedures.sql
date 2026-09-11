-- ============================================================
-- StoreTrack V3 — Create Stored Procedures
-- ============================================================
-- Transactional stored procedures for critical operations.
-- ============================================================

USE [StoreTrackV3];
GO

-- ------------------------------------------------------------
-- sp_CreateSale
-- Creates a sale with items, deducts inventory, and logs audit.
-- Uses a transaction to ensure atomicity.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CreateSale')
    DROP PROCEDURE [app].[sp_CreateSale];
GO

CREATE PROCEDURE [app].[sp_CreateSale]
    @SaleId       NVARCHAR(50),
    @Invoice      NVARCHAR(50),
    @CustomerId   NVARCHAR(50) = NULL,
    @CustomerName NVARCHAR(500) = NULL,
    @CashierName  NVARCHAR(200),
    @UserId       NVARCHAR(50) = NULL,
    @Subtotal     DECIMAL(18,2),
    @Discount     DECIMAL(18,2) = 0,
    @Tax          DECIMAL(18,2) = 0,
    @Total        DECIMAL(18,2),
    @Method       NVARCHAR(50) = 'Cash',
    @OnCredit     BIT = 0,
    @AmountPaid   DECIMAL(18,2) = NULL,
    @Notes        NVARCHAR(2000) = NULL,
    @SaleItems    NVARCHAR(MAX)  -- JSON array of items
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Insert the sale
        INSERT INTO [app].[Sales] ([Id], [Invoice], [CustomerId], [CustomerName], [CashierName], [UserId],
                                   [Subtotal], [Discount], [Tax], [Total], [Method], [OnCredit], [AmountPaid], [Notes])
        VALUES (@SaleId, @Invoice, @CustomerId, @CustomerName, @CashierName, @UserId,
                @Subtotal, @Discount, @Tax, @Total, @Method, @OnCredit, @AmountPaid, @Notes);

        -- Audit
        INSERT INTO [app].[AuditLog] ([Id], [UserId], [UserName], [Action], [Target], [Description], [OccurredAt])
        VALUES (CONCAT('al_', REPLACE(NEWID(), '-', '')),
                @UserId, @CashierName, 'Sale Recorded', @Invoice,
                CONCAT(@Method, ' sale of $', CAST(@Total AS NVARCHAR(20)), ' to ', ISNULL(@CustomerName, 'Walk-in')),
                SYSUTCDATETIME());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Procedure [app].[sp_CreateSale] created.';
GO

-- ------------------------------------------------------------
-- sp_RestockProduct
-- Adds inventory to a product and logs the movement.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RestockProduct')
    DROP PROCEDURE [app].[sp_RestockProduct];
GO

CREATE PROCEDURE [app].[sp_RestockProduct]
    @ProductId NVARCHAR(50),
    @AddBoxes  INT = 0,
    @AddPieces INT = 0,
    @Reason    NVARCHAR(500) = 'Supplier Delivery',
    @Notes     NVARCHAR(2000) = NULL,
    @UserId    NVARCHAR(50) = NULL,
    @UserName  NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @IsBoxed BIT;
        SELECT @IsBoxed = [IsBoxed] FROM [app].[Products] WHERE [Id] = @ProductId;

        IF @IsBoxed = 1
        BEGIN
            UPDATE [app].[Products]
            SET [Boxes] = [Boxes] + @AddBoxes,
                [ExtraPieces] = [ExtraPieces] + @AddPieces,
                [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @ProductId;
        END
        ELSE
        BEGIN
            UPDATE [app].[Products]
            SET [ExtraPieces] = [ExtraPieces] + @AddPieces + @AddBoxes,
                [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @ProductId;
        END

        -- Log inventory movement
        INSERT INTO [app].[InventoryMovements] ([Id], [ProductId], [MovementType], [Quantity], [Boxes], [Pieces],
                                                [Reason], [Notes], [UserId], [UserName], [OccurredAt])
        VALUES (CONCAT('im_', REPLACE(NEWID(), '-', '')),
                @ProductId, 'restock', @AddBoxes + @AddPieces, @AddBoxes, @AddPieces,
                @Reason, @Notes, @UserId, @UserName, SYSUTCDATETIME());

        -- Audit
        INSERT INTO [app].[AuditLog] ([Id], [UserId], [UserName], [Action], [Target], [Description], [OccurredAt])
        SELECT CONCAT('al_', REPLACE(NEWID(), '-', '')),
               @UserId, @UserName, 'Inventory Restock', [Sku],
               CONCAT([Name], ' restocked: +', @AddBoxes, ' boxes, +', @AddPieces, ' pieces (', @Reason, ')'),
               SYSUTCDATETIME()
        FROM [app].[Products] WHERE [Id] = @ProductId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Procedure [app].[sp_RestockProduct] created.';
GO

-- ------------------------------------------------------------
-- sp_RecordPayment
-- Records a creditor payment and updates ledger.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RecordPayment')
    DROP PROCEDURE [app].[sp_RecordPayment];
GO

CREATE PROCEDURE [app].[sp_RecordPayment]
    @PaymentId  NVARCHAR(50),
    @CustomerId NVARCHAR(50),
    @Amount     DECIMAL(18,2),
    @Method     NVARCHAR(50) = 'Cash',
    @Reference  NVARCHAR(500) = NULL,
    @Notes      NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Calculate current balance
        DECLARE @CurrentBalance DECIMAL(18,2) = 0;
        SELECT @CurrentBalance = ISNULL(
            SUM(CASE WHEN [Kind] = 'purchase' THEN [Amount] ELSE -[Amount] END), 0)
        FROM [app].[LedgerEntries]
        WHERE [CustomerId] = @CustomerId;

        DECLARE @NewBalance DECIMAL(18,2) = @CurrentBalance - @Amount;

        -- Insert payment entry
        INSERT INTO [app].[LedgerEntries] ([Id], [CustomerId], [Kind], [Amount], [BalanceAfter],
                                           [Method], [Reference], [Notes], [EntryAt])
        VALUES (@PaymentId, @CustomerId, 'payment', @Amount, @NewBalance,
                @Method, @Reference, @Notes, SYSUTCDATETIME());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Procedure [app].[sp_RecordPayment] created.';
GO

PRINT 'All stored procedures created successfully.';
GO
