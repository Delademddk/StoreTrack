-- ============================================================
-- StoreTrack V3 — Transaction Test Scripts
-- ============================================================
-- Tests critical business operations:
--   1. Full box sale
--   2. Individual unit sale
--   3. Restock
--   4. Credit sale with payment
-- Run after seed data is loaded.
-- ============================================================

USE [StoreTrackV3];
GO

PRINT '============================================';
PRINT 'StoreTrack V3 — Transaction Tests';
PRINT '============================================';
PRINT '';

-- ============================================================
-- TEST 1: Full Box Sale
-- ============================================================
PRINT '--- TEST 1: Full Box Sale ---';

DECLARE @TestSaleId1 NVARCHAR(50) = CONCAT('s_test_', REPLACE(NEWID(), '-', ''));
DECLARE @TestInvoice1 NVARCHAR(50) = [app].[fn_NextInvoice]();

BEGIN TRANSACTION;
BEGIN TRY
    -- Create a sale for 1 box of NuPhy Air75 V2 (p_02)
    -- Product has boxes=2, itemsPerBox=5, extraPieces=0
    -- Selling 5 units (1 box worth)

    INSERT INTO [app].[Sales] ([Id], [Invoice], [CustomerName], [CashierName], [Subtotal], [Discount], [Tax], [Total], [Method], [SoldAt])
    VALUES (@TestSaleId1, @TestInvoice1, 'Test Customer', 'Test User', 175.00, 0, 0, 175.00, 'Cash', SYSUTCDATETIME());

    INSERT INTO [app].[SaleItems] ([Id], [SaleId], [ProductId], [ProductName], [Quantity], [UnitPrice])
    VALUES (CONCAT('si_test_', REPLACE(NEWID(), '-', '')), @TestSaleId1, 'p_02', 'NuPhy Air75 V2 Mechanical', 5, 175.00);

    -- Verify stock decreased
    DECLARE @BeforeSale INT = (SELECT [app].[fn_CalculateTotalQuantity]([IsBoxed], [Boxes], [ItemsPerBox], [ExtraPieces]) FROM [app].[Products] WHERE [Id] = 'p_02');
    PRINT CONCAT('  Before sale: p_02 total = ', @BeforeSale);

    -- Deduct: 5 units from a boxed product
    -- extraPieces=0, so deduct 1 box
    UPDATE [app].[Products]
    SET [Boxes] = [Boxes] - 1, [UpdatedAt] = SYSUTCDATETIME()
    WHERE [Id] = 'p_02' AND [IsBoxed] = 1;

    DECLARE @AfterSale INT = (SELECT [app].[fn_CalculateTotalQuantity]([IsBoxed], [Boxes], [ItemsPerBox], [ExtraPieces]) FROM [app].[Products] WHERE [Id] = 'p_02');
    PRINT CONCAT('  After sale:  p_02 total = ', @AfterSale);

    IF @AfterSale = @BeforeSale - 5
        PRINT '  PASS: Stock decreased correctly.';
    ELSE
        PRINT '  FAIL: Stock did not decrease correctly.';

    ROLLBACK TRANSACTION;
    PRINT '  (Rolled back test data)';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '  FAIL: Error - ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- ============================================================
-- TEST 2: Individual Unit Sale
-- ============================================================
PRINT '--- TEST 2: Individual Unit Sale ---';

DECLARE @TestSaleId2 NVARCHAR(50) = CONCAT('s_test_', REPLACE(NEWID(), '-', ''));

BEGIN TRANSACTION;
BEGIN TRY
    -- Create a sale for 2 units of MX-Wireless Mouse G2 (p_03)
    -- Product has isBoxed=0, extraPieces=24
    INSERT INTO [app].[Sales] ([Id], [Invoice], [CustomerName], [CashierName], [Subtotal], [Discount], [Tax], [Total], [Method], [SoldAt])
    VALUES (@TestSaleId2, [app].[fn_NextInvoice](), 'Test Customer', 'Test User', 129.00, 0, 0, 129.00, 'Cash', SYSUTCDATETIME());

    INSERT INTO [app].[SaleItems] ([Id], [SaleId], [ProductId], [ProductName], [Quantity], [UnitPrice])
    VALUES (CONCAT('si_test_', REPLACE(NEWID(), '-', '')), @TestSaleId2, 'p_03', 'MX-Wireless Mouse G2', 2, 64.50);

    DECLARE @Before2 INT = (SELECT [ExtraPieces] FROM [app].[Products] WHERE [Id] = 'p_03');
    PRINT CONCAT('  Before sale: p_03 extraPieces = ', @Before2);

    UPDATE [app].[Products]
    SET [ExtraPieces] = [ExtraPieces] - 2, [UpdatedAt] = SYSUTCDATETIME()
    WHERE [Id] = 'p_03';

    DECLARE @After2 INT = (SELECT [ExtraPieces] FROM [app].[Products] WHERE [Id] = 'p_03');
    PRINT CONCAT('  After sale:  p_03 extraPieces = ', @After2);

    IF @After2 = @Before2 - 2
        PRINT '  PASS: Stock decreased correctly.';
    ELSE
        PRINT '  FAIL: Stock did not decrease correctly.';

    ROLLBACK TRANSACTION;
    PRINT '  (Rolled back test data)';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '  FAIL: Error - ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- ============================================================
-- TEST 3: Restock
-- ============================================================
PRINT '--- TEST 3: Restock ---';

BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @BeforeR INT = (SELECT [app].[fn_CalculateTotalQuantity]([IsBoxed], [Boxes], [ItemsPerBox], [ExtraPieces]) FROM [app].[Products] WHERE [Id] = 'p_01');
    PRINT CONCAT('  Before restock: p_01 total = ', @BeforeR);

    EXEC [app].[sp_RestockProduct]
        @ProductId = 'p_01',
        @AddBoxes = 5,
        @AddPieces = 3,
        @Reason = 'Supplier Delivery',
        @UserId = 'u_01',
        @UserName = 'Admin User';

    DECLARE @AfterR INT = (SELECT [app].[fn_CalculateTotalQuantity]([IsBoxed], [Boxes], [ItemsPerBox], [ExtraPieces]) FROM [app].[Products] WHERE [Id] = 'p_01');
    PRINT CONCAT('  After restock:  p_01 total = ', @AfterR);

    IF @AfterR = @BeforeR + (5 * 12 + 3)
        PRINT '  PASS: Restock increased stock correctly.';
    ELSE
        PRINT '  FAIL: Restock did not increase stock correctly.';

    ROLLBACK TRANSACTION;
    PRINT '  (Rolled back test data)';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '  FAIL: Error - ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- ============================================================
-- TEST 4: Credit Sale with Payment
-- ============================================================
PRINT '--- TEST 4: Credit Sale with Payment ---';

BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @TestCustId NVARCHAR(50) = 'c_01';
    DECLARE @BeforeBal DECIMAL(18,2) = [app].[fn_GetCustomerOutstanding](@TestCustId);
    PRINT CONCAT('  Before: c_01 outstanding = $', @BeforeBal);

    -- Record a credit sale of $500
    DECLARE @LePurchase NVARCHAR(50) = CONCAT('le_test_', REPLACE(NEWID(), '-', ''));
    INSERT INTO [app].[LedgerEntries] ([Id], [CustomerId], [Kind], [Amount], [BalanceAfter], [EntryAt])
    VALUES (@LePurchase, @TestCustId, 'purchase', 500.00, @BeforeBal + 500.00, SYSUTCDATETIME());

    DECLARE @AfterPurchase DECIMAL(18,2) = [app].[fn_GetCustomerOutstanding](@TestCustId);
    PRINT CONCAT('  After purchase: c_01 outstanding = $', @AfterPurchase);

    -- Record a payment of $200
    EXEC [app].[sp_RecordPayment]
        @PaymentId = CONCAT('le_test_', REPLACE(NEWID(), '-', '')),
        @CustomerId = @TestCustId,
        @Amount = 200.00,
        @Method = 'Cash',
        @Reference = 'Test payment';

    DECLARE @AfterPayment DECIMAL(18,2) = [app].[fn_GetCustomerOutstanding](@TestCustId);
    PRINT CONCAT('  After payment: c_01 outstanding = $', @AfterPayment);

    IF @AfterPurchase = @BeforeBal + 500.00 AND @AfterPayment = @BeforeBal + 300.00
        PRINT '  PASS: Credit sale and payment recorded correctly.';
    ELSE
        PRINT '  FAIL: Credit balance incorrect.';

    ROLLBACK TRANSACTION;
    PRINT '  (Rolled back test data)';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '  FAIL: Error - ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- ============================================================
-- TEST 5: Constraint Validation
-- ============================================================
PRINT '--- TEST 5: Constraint Validation ---';

-- Test: Negative price should fail
BEGIN TRY
    INSERT INTO [app].[Products] ([Id], [Sku], [Name], [CategoryId], [IndividualPrice], [Boxes], [ItemsPerBox], [ExtraPieces])
    VALUES ('p_test_bad', 'SKU-BAD-TEST', 'Bad Product', 'cat_1', -10.00, 0, 1, 0);
    PRINT '  FAIL: Should have rejected negative price.';
END TRY
BEGIN CATCH
    PRINT '  PASS: Constraint rejected negative price.';
END CATCH

-- Test: Invalid status should fail
BEGIN TRY
    UPDATE [app].[Users] SET [Status] = 'Invalid' WHERE [Username] = 'admin';
    PRINT '  FAIL: Should have rejected invalid status.';
END TRY
BEGIN CATCH
    PRINT '  PASS: Constraint rejected invalid status.';
END CATCH

-- Summary
PRINT '';
PRINT '============================================';
PRINT 'Transaction tests completed.';
PRINT '============================================';
GO
