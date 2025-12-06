# Frequent Items with Customization Options - Feature Documentation

## Overview
This feature enhances the "Frequent Items" section to save and recall not just the product, but the exact customization options (size, temperature, milk, sugar, upsells, etc.) that users ordered.

## How It Works

### 1. **Data Storage**
When a user marks an order as "Received":
- The system saves each item from the order into the `frequent_items` table
- Saves: product info + quantity + **full customization options** (size, temperature, milk, sugar, upsells)
- Each unique combination of (product + customization) is tracked separately
- Order count increases if the same combination is ordered again

### 2. **Database Schema**
```sql
CREATE TABLE frequent_items (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_icon TEXT,
    base_price REAL NOT NULL,
    order_count INTEGER DEFAULT 1,
    last_ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customization TEXT, -- JSON: {size, temperature, milk, sugar, upsells}
    UNIQUE(user_id, product_id, customization),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### 3. **API Endpoint**
**GET** `/api/frequent-items?user_id={user_id}&limit={limit}`

Returns user's most frequently ordered items with their customization options.

**Response:**
```json
{
  "items": [
    {
      "product_id": "cf_1",
      "product_name": "Espresso",
      "icon": "☕",
      "price": 45000,
      "order_count": 5,
      "customization": {
        "size": "L",
        "temperature": "iced",
        "milk": "oat",
        "sugar": "50",
        "upsells": ["whipped_cream"]
      },
      "last_ordered_at": "2024-12-06T10:30:00"
    }
  ]
}
```

### 4. **Frontend Behavior**
When user clicks on a frequent item:
- Opens the customization modal (not just scrolling to product)
- **Pre-fills all options** with their previous choices:
  - Size is pre-selected
  - Temperature is pre-selected
  - Milk option is pre-checked
  - Sugar level is pre-selected
  - Upsells are pre-checked
- Shows a hint: "⭐ Your usual customization is pre-selected. Feel free to adjust!"
- User can modify any option before adding to cart

### 5. **User Experience**
**Before:**
- Click frequent item → Scroll to product card → Click card → Select all options manually

**After:**
- Click frequent item → Modal opens with YOUR usual choices already selected → Adjust if needed → Add to cart
- Much faster for repeat orders!
- Remembers different variations (e.g., "Iced Latte with Oat Milk" vs "Hot Latte with Regular Milk")

## Key Features

### Smart Tracking
- Tracks each unique customization separately
- If you order "Large Iced Latte with Oat Milk" 3 times and "Medium Hot Latte" 2 times, both appear in frequent items
- Shows order count for each variation

### Visual Hints
- Displays a brief summary under each frequent item (e.g., "L, iced, milk, 50% sugar")
- Shows total order count for that specific combination

### One-Click Reorder
- Minimal clicks to reorder your favorite drink/food with exact same options
- Can still adjust before adding to cart

## Migration
For existing databases, run:
```bash
docker exec -i cafe-postgres psql -U cafe_user -d cafe_orders < migrate_add_frequent_items.sql
```

## Files Modified

### Backend
- `schema.sql` - Added frequent_items table
- `routers/orders.py` - Modified `mark_order_received()` to save to frequent_items
- `routers/orders.py` - Added new endpoint `GET /api/frequent-items`
- `routers/profile.py` - Added frequent_items to delete operations

### Frontend
- `frontend/js/components/menu.js` - Updated `loadFrequentItems()` to use new API
- `frontend/js/components/cart.js` - Added `openFrequentItemModal()` and `showCustomizationModalWithPresets()`

## Technical Details

### Customization JSON Structure
```json
{
  "size": "L",           // Only for beverages
  "temperature": "iced", // Only for coffee: "iced" or "hot"
  "milk": "oat",         // Milk option key
  "sugar": "50",         // Sugar percentage: "0", "25", "50", "75", "100", "125", "150"
  "upsells": ["whipped_cream", "caramel"] // Array of upsell keys
}
```

### Deduplication Logic
- Uses UNIQUE constraint on (user_id, product_id, customization)
- Same product with different customizations = different entries
- When same combination is ordered again, increments order_count

## Benefits
1. **Faster Reordering** - Pre-filled options save time
2. **Better UX** - Remembers user preferences
3. **Smart Tracking** - Tracks different variations separately
4. **Flexible** - User can still modify before adding to cart

## Future Enhancements
- Allow user to save "favorite combinations" with custom names
- Suggest popular customizations based on order history
- Show trending combinations across all users
