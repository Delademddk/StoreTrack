-- ============================================================
-- StoreTrack V3 — Create Schema
-- ============================================================
-- Creates the application schema for StoreTrack V3 objects.
-- All tables, views, procedures, and functions live in [app].
-- ============================================================

USE [StoreTrackV3];
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'app')
BEGIN
    EXEC('CREATE SCHEMA [app]');
    PRINT 'Schema [app] created.';
END
ELSE
BEGIN
    PRINT 'Schema [app] already exists.';
END
GO
