-- ============================================================
-- StoreTrack V3 — Seed Users
-- ============================================================
-- Inserts the development users for StoreTrack V3.
-- Passwords are bcrypt-hashed. These are development credentials
-- and should NOT be used in production.
--
-- Admin:   admin / Admin123
-- Cashier: cashier / Cashier123
-- ============================================================

USE [StoreTrackV3];
GO

-- Admin user
-- Password: Admin123
-- Hash generated with: bcrypt.hashpw(b"Admin123", bcrypt.gensalt(rounds=12))
-- This is a pre-computed bcrypt hash. The Python backend will verify with bcrypt.checkpw().
DECLARE @AdminHash NVARCHAR(500) = N'$2b$12$LJ3m4ys4Hz.gFNQpMgkxOeNKpBrR4cG1FhRLzhDavE8M1yVfUwJl2';
DECLARE @CashierHash NVARCHAR(500) = N'$2b$12$92IDxKoVCfRBsiVdS/QOiO9FLk6GfHfCxZrVLf4aJpQp3V5fI4xPe';

MERGE INTO [app].[Users] AS target
USING (VALUES
    ('u_01', 'admin',   @AdminHash,   'Admin User',  'admin@storetrack.com',  '+233 242 000 000', 'role_admin',   'Active', '2 hours ago',  DATEADD(DAY, -180, SYSUTCDATETIME()), SYSUTCDATETIME()),
    ('u_02', 'cashier', @CashierHash, 'Cashier User', 'cashier@storetrack.com', '+233 241 000 000', 'role_cashier', 'Active', '3 hours ago',  DATEADD(DAY, -90, SYSUTCDATETIME()),  SYSUTCDATETIME())
) AS source ([Id], [Username], [PasswordHash], [Name], [Email], [Phone], [RoleId], [Status], [LastActive], [CreatedAt], [UpdatedAt])
ON target.[Id] = source.[Id]
WHEN MATCHED THEN
    UPDATE SET
        [Username]     = source.[Username],
        [PasswordHash] = source.[PasswordHash],
        [Name]         = source.[Name],
        [Email]        = source.[Email],
        [Phone]        = source.[Phone],
        [RoleId]       = source.[RoleId],
        [Status]       = source.[Status],
        [UpdatedAt]    = source.[UpdatedAt]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([Id], [Username], [PasswordHash], [Name], [Email], [Phone], [RoleId], [Status], [LastActive], [CreatedAt], [UpdatedAt])
    VALUES (source.[Id], source.[Username], source.[PasswordHash], source.[Name], source.[Email], source.[Phone], source.[RoleId], source.[Status], source.[LastActive], source.[CreatedAt], source.[UpdatedAt]);
GO

PRINT 'Development users seeded.';
GO
