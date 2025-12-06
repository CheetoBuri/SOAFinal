-- Migration: Add frequent_items table
-- Run this to add the frequent_items feature to existing database

CREATE TABLE IF NOT EXISTS frequent_items (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_icon TEXT,
    base_price REAL NOT NULL,
    order_count INTEGER DEFAULT 1,
    last_ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Customization options (stored as JSON)
    customization TEXT,
    -- Customization includes: size, temperature, milk, sugar, upsells, etc.
    UNIQUE(user_id, product_id, customization),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_frequent_items_user ON frequent_items(user_id);
CREATE INDEX IF NOT EXISTS idx_frequent_items_product ON frequent_items(product_id);
CREATE INDEX IF NOT EXISTS idx_frequent_items_last_ordered ON frequent_items(last_ordered_at);
