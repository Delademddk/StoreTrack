-- ============================================================
-- StoreTrack V3 — Drop Database
-- ============================================================
-- WARNING: DESTRUCTIVE — This will permanently delete the
-- StoreTrackV3 database and ALL its data.
-- Use only in development environments.
-- ============================================================

USE [master];
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'StoreTrackV3')
BEGIN
    ALTER DATABASE [StoreTrackV3] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [StoreTrackV3];
    PRINT 'Database StoreTrackV3 dropped.';
END
ELSE
BEGIN
    PRINT 'Database StoreTrackV3 does not exist.';
END
GO
