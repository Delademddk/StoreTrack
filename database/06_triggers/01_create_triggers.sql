-- ============================================================
-- StoreTrack V3 — Create Triggers
-- ============================================================
-- Audit triggers for important data changes.
-- ============================================================

USE [StoreTrackV3];
GO

-- ------------------------------------------------------------
-- trg_Product_UpdatedAt
-- Auto-sets UpdatedAt when a product is modified.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Product_UpdatedAt')
    DROP TRIGGER [app].[trg_Product_UpdatedAt];
GO

CREATE TRIGGER [app].[trg_Product_UpdatedAt]
ON [app].[Products]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [app].[Products]
    SET [UpdatedAt] = SYSUTCDATETIME()
    FROM [app].[Products] p
    INNER JOIN inserted i ON p.[Id] = i.[Id];
END;
GO

PRINT 'Trigger [app].[trg_Product_UpdatedAt] created.';
GO

-- ------------------------------------------------------------
-- trg_Customer_UpdatedAt
-- Auto-sets UpdatedAt when a customer is modified.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Customer_UpdatedAt')
    DROP TRIGGER [app].[trg_Customer_UpdatedAt];
GO

CREATE TRIGGER [app].[trg_Customer_UpdatedAt]
ON [app].[Customers]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [app].[Customers]
    SET [UpdatedAt] = SYSUTCDATETIME()
    FROM [app].[Customers] c
    INNER JOIN inserted i ON c.[Id] = i.[Id];
END;
GO

PRINT 'Trigger [app].[trg_Customer_UpdatedAt] created.';
GO

-- ------------------------------------------------------------
-- trg_User_UpdatedAt
-- Auto-sets UpdatedAt when a user is modified.
-- ------------------------------------------------------------
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_User_UpdatedAt')
    DROP TRIGGER [app].[trg_User_UpdatedAt];
GO

CREATE TRIGGER [app].[trg_User_UpdatedAt]
ON [app].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [app].[Users]
    SET [UpdatedAt] = SYSUTCDATETIME()
    FROM [app].[Users] u
    INNER JOIN inserted i ON u.[Id] = i.[Id];
END;
GO

PRINT 'Trigger [app].[trg_User_UpdatedAt] created.';
GO

PRINT 'All triggers created successfully.';
GO
