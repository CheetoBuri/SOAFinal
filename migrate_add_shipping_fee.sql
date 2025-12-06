-- Migration: Add shipping_fee column to orders table
-- Run this to add shipping fee feature to existing database

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee REAL DEFAULT 30000;

-- Update existing orders to have shipping fee
UPDATE orders SET shipping_fee = 30000 WHERE shipping_fee IS NULL;
