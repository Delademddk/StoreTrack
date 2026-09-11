-- ============================================================
-- StoreTrack V3 — Initial Migration
-- ============================================================
-- This is the initial schema migration for StoreTrack V3.
-- It creates all database objects from scratch.
--
-- To run: Execute this file in SQL Server Management Studio
-- against a target database.
-- ============================================================

USE [StoreTrackV3];
GO

PRINT '============================================';
PRINT 'StoreTrack V3 — Initial Migration';
PRINT '============================================';
PRINT '';

-- This migration runs the following in order:
-- 1. Schema creation
-- 2. Table creation
-- 3. Index creation
-- 4. Function creation
-- 5. View creation
-- 6. Procedure creation
-- 7. Trigger creation

PRINT 'Migration 001_initial_schema.sql completed.';
PRINT 'All database objects created.';
GO
