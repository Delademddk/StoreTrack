-- ============================================================
-- StoreTrack V3 — Create Database
-- ============================================================
-- Creates the StoreTrackV3 database.
-- Execute this script first in SQL Server Management Studio.
-- ============================================================

USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'StoreTrackV3')
BEGIN
    CREATE DATABASE [StoreTrackV3];
    PRINT 'Database StoreTrackV3 created successfully.';
END
ELSE
BEGIN
    PRINT 'Database StoreTrackV3 already exists.';
END
GO

USE [StoreTrackV3];
GO

PRINT 'Switched to StoreTrackV3 database.';
GO
