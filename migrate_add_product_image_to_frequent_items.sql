-- Migration: Add product_image column to frequent_items table
-- Run this to add image URLs to frequent items

ALTER TABLE frequent_items ADD COLUMN product_image TEXT;
