"""
Menu data and utilities - Complete Cafe Menu System
"""

MENU_PRODUCTS = {
    "coffee": [
        # Italian Coffee
        {"id": "cf_1", "name": "Espresso", "category": "coffee", "price": 25000, "icon": "☕", "defaultSugar": "0", "type": "italian", "noDefaultMilk": True},
        {"id": "cf_2", "name": "Americano", "category": "coffee", "price": 30000, "icon": "☕", "defaultSugar": "0", "type": "italian", "noDefaultMilk": True},
        {"id": "cf_3", "name": "Cappuccino", "category": "coffee", "price": 40000, "icon": "☕", "defaultSugar": "0", "type": "italian", "noDefaultMilk": True},
        {"id": "cf_4", "name": "Latte", "category": "coffee", "price": 40000, "icon": "☕", "defaultSugar": "0", "type": "italian", "noDefaultMilk": True},
        {"id": "cf_5", "name": "Cold Brew", "category": "coffee", "price": 35000, "icon": "☕", "defaultSugar": "0", "type": "italian", "noDefaultMilk": True},
        {"id": "cf_10", "name": "Mocha", "category": "coffee", "price": 45000, "icon": "☕", "defaultSugar": "0", "type": "italian", "upsells": ["whipped_cream"], "noDefaultMilk": True},
        {"id": "cf_11", "name": "Caramel Macchiato", "category": "coffee", "price": 45000, "icon": "☕", "defaultSugar": "0", "type": "italian", "upsells": ["vanilla_syrup"], "noDefaultMilk": True},
        # Vietnamese Coffee
        {"id": "cf_6", "name": "Cà phê sữa đá", "category": "coffee", "price": 25000, "icon": "☕", "defaultSugar": "none", "type": "vietnamese", "noDefaultMilk": True},
        {"id": "cf_7", "name": "Cà phê đen đá", "category": "coffee", "price": 20000, "icon": "☕", "defaultSugar": "0", "type": "vietnamese", "noDefaultMilk": True},
        {"id": "cf_8", "name": "Bạc xỉu", "category": "coffee", "price": 28000, "icon": "☕", "defaultSugar": "none", "type": "vietnamese", "onlyMilkOption": True},
    ],
    "tea": [
        {"id": "t_1", "name": "Green Tea", "category": "tea", "price": 25000, "icon": "🍵", "defaultSugar": "100"},
        {"id": "t_2", "name": "Black Tea", "category": "tea", "price": 25000, "icon": "🍵", "defaultSugar": "100"},
        {"id": "t_3", "name": "Oolong Tea", "category": "tea", "price": 30000, "icon": "🍵", "defaultSugar": "100"},
        {"id": "t_4", "name": "Peach Tea", "category": "tea", "price": 35000, "icon": "🍵", "defaultSugar": "100"},
        {"id": "t_5", "name": "Lemon Tea", "category": "tea", "price": 30000, "icon": "🍵", "defaultSugar": "100"},
        {"id": "t_6", "name": "Milk Tea", "category": "tea", "price": 35000, "icon": "🍵", "defaultSugar": "100", "upsells": ["pearls"]},
    ],
    "juice": [
        {"id": "j_1", "name": "Orange Juice", "category": "juice", "price": 30000, "icon": "🧃", "defaultSugar": "50"},
        {"id": "j_2", "name": "Apple Juice", "category": "juice", "price": 30000, "icon": "🧃", "defaultSugar": "50"},
        {"id": "j_3", "name": "Mango Juice", "category": "juice", "price": 35000, "icon": "🧃", "defaultSugar": "50"},
        {"id": "j_4", "name": "Lemonade", "category": "juice", "price": 25000, "icon": "🧃", "defaultSugar": "50", "upsells": ["honey"]},
        {"id": "j_5", "name": "Strawberry Smoothie", "category": "juice", "price": 40000, "icon": "🧃", "defaultSugar": "50"},
        {"id": "j_6", "name": "Mango Smoothie", "category": "juice", "price": 40000, "icon": "🧃", "defaultSugar": "50"},
    ],
    "food": [
        # Savory
        {"id": "f_1", "name": "Croissant", "category": "food", "price": 35000, "icon": "🥐", "type": "savory", "defaultSugar": "none",
         "toppings": ["jam", "salted_butter", "almond_slices", "cream_cheese"]},
        {"id": "f_2", "name": "Sandwich (Cheese & Ham)", "category": "food", "price": 45000, "icon": "🥪", "type": "savory", "defaultSugar": "none",
         "toppings": ["extra_egg", "extra_cheese", "bacon"]},
        {"id": "f_7", "name": "Banana Bread", "category": "food", "price": 30000, "icon": "🍌", "type": "savory", "defaultSugar": "none",
         "toppings": ["cream_cheese"]},
        # Sweet
        {"id": "f_3", "name": "Brownie", "category": "food", "price": 35000, "icon": "🍫", "type": "sweet", "defaultSugar": "none",
         "toppings": ["chocolate_drizzle", "whipped_cream"]},
        {"id": "f_4", "name": "Cookies (2 pcs)", "category": "food", "price": 20000, "icon": "🍪", "type": "sweet", "defaultSugar": "none",
         "variants": ["chocolate_chip", "butter"], "toppings": ["extra_cookie"]},
        {"id": "f_5", "name": "Muffin", "category": "food", "price": 30000, "icon": "🧁", "type": "sweet", "defaultSugar": "none",
         "variants": ["chocolate", "blueberry"]},
        # Cakes
        {"id": "f_8", "name": "Tiramisu", "category": "food", "price": 45000, "icon": "🍰", "type": "cake", "defaultSugar": "none",
         "toppings": ["cocoa_powder", "chocolate_sauce"]},
        {"id": "f_9", "name": "Red Velvet", "category": "food", "price": 45000, "icon": "🍰", "type": "cake", "defaultSugar": "none",
         "toppings": ["extra_cream_cheese"]},
        {"id": "f_10", "name": "Passion Fruit Mousse", "category": "food", "price": 40000, "icon": "🍰", "type": "cake", "defaultSugar": "none",
         "toppings": ["passionfruit_topping"]},
    ]
}

# Coffee Upsells & Add-ons
COFFEE_UPSELLS = {
    "espresso_shot": {"name": "Extra Shot Espresso", "price": 10000},
    "vanilla_syrup": {"name": "Vanilla Syrup", "price": 10000},
    "caramel_syrup": {"name": "Caramel Syrup", "price": 10000},
    "hazelnut_syrup": {"name": "Hazelnut Syrup", "price": 10000},
    "chocolate_syrup": {"name": "Chocolate Syrup", "price": 10000},
    "sweet_cream_foam": {"name": "Sweet Cream Foam", "price": 10000},
    "whipped_cream": {"name": "Whipped Cream", "price": 5000},
    "caramel_drizzle": {"name": "Caramel Drizzle", "price": 5000},
    "chocolate_drizzle": {"name": "Chocolate Drizzle", "price": 5000},
}

# Tea Upsells
TEA_UPSELLS = {
    "pearls": {"name": "Pearls (Boba)", "price": 10000},
    "peach_chunks": {"name": "Peach Chunks", "price": 10000},
    "honey": {"name": "Honey", "price": 5000},
}

# Food Toppings
FOOD_TOPPINGS = {
    # Savory toppings
    "jam": {"name": "Strawberry/Orange Jam", "price": 5000},
    "salted_butter": {"name": "Salted Butter", "price": 5000},
    "cream_cheese": {"name": "Cream Cheese", "price": 10000},
    "almond_slices": {"name": "Almond Slices", "price": 5000},
    "extra_egg": {"name": "Extra Egg", "price": 10000},
    "extra_cheese": {"name": "Extra Cheese", "price": 10000},
    "bacon": {"name": "Extra Bacon", "price": 15000},
    # Sweet toppings
    "whipped_cream": {"name": "Whipped Cream", "price": 5000},
    "chocolate_sauce": {"name": "Chocolate Sauce", "price": 5000},
    "caramel_sauce": {"name": "Caramel Sauce", "price": 5000},
    "cocoa_powder": {"name": "Cocoa Powder", "price": 5000},
    "extra_cream_cheese": {"name": "Extra Cream Cheese", "price": 10000},
    "passionfruit_topping": {"name": "Passionfruit Topping", "price": 7000},
    "extra_cookie": {"name": "Extra Cookie", "price": 10000},
}

# Milk Options
MILK_OPTIONS = {
    "fresh_milk": {"name": "Fresh Milk (No Sugar)", "price": 0},
    "low_fat_milk": {"name": "Low Fat Milk", "price": 0},
    "oat_milk": {"name": "Oat Milk", "price": 10000},
    "almond_milk": {"name": "Almond Milk", "price": 10000},
    "lactose_free": {"name": "Lactose-free Milk", "price": 10000},
    "condensed_milk": {"name": "Add Condensed Milk", "price": 5000},
}

# Milk Options for Italian Coffee (with default Fresh Milk)
MILK_OPTIONS_ITALIAN = {
    "fresh_milk": {"name": "Fresh Milk (No Sugar)", "price": 0, "default": True},
    "low_fat_milk": {"name": "Low Fat Milk", "price": 0},
    "oat_milk": {"name": "Oat Milk", "price": 10000},
    "almond_milk": {"name": "Almond Milk", "price": 10000},
    "lactose_free": {"name": "Lactose-free Milk", "price": 10000},
    "condensed_milk": {"name": "Add Condensed Milk", "price": 5000},
}

# Milk Options for Bac Xiu (already has fresh milk, can change or add condensed milk)
MILK_OPTIONS_BAC_XIU = {
    "low_fat_milk": {"name": "Low Fat Milk", "price": 0},
    "oat_milk": {"name": "Oat Milk", "price": 10000},
    "almond_milk": {"name": "Almond Milk", "price": 10000},
    "lactose_free": {"name": "Lactose-free Milk", "price": 10000},
    "condensed_milk": {"name": "Add Condensed Milk", "price": 5000},
}

# Size options (for beverages)
SIZE_OPTIONS = {
    "M": {"name": "Medium", "priceModifier": 0},
    "L": {"name": "Large", "priceModifier": 10000},
}


def get_all_products():
    """Get all menu products"""
    all_items = []
    for category in MENU_PRODUCTS.values():
        all_items.extend(category)
    return all_items


def get_products_by_category(category: str):
    """Get products by category"""
    return MENU_PRODUCTS.get(category, [])


def search_products(query: str):
    """Search products by name"""
    query = query.lower()
    all_items = get_all_products()
    return [item for item in all_items if query in item["name"].lower()]


def get_product_by_id(product_id: str):
    """Get a single product by ID"""
    all_items = get_all_products()
    for item in all_items:
        if item["id"] == product_id:
            return item
    return None


def get_available_upsells(product_id: str):
    """Get available upsells for a product"""
    product = get_product_by_id(product_id)
    if not product:
        return []
    
    category = product.get("category")
    
    if category == "coffee":
        return COFFEE_UPSELLS
    elif category == "tea":
        return TEA_UPSELLS
    
    return {}


def get_available_toppings(product_id: str):
    """Get available toppings for a food product"""
    product = get_product_by_id(product_id)
    if not product or product.get("category") != "food":
        return []
    
    topping_keys = product.get("toppings", [])
    return {key: FOOD_TOPPINGS[key] for key in topping_keys if key in FOOD_TOPPINGS}


def get_milk_options(product_id: str):
    """Get available milk options for a product"""
    product = get_product_by_id(product_id)
    if not product or product.get("category") != "coffee":
        return {}
    
    # Bac Xiu (cf_8) - already has fresh milk, exclude it from options
    if product_id == "cf_8":
        return MILK_OPTIONS_BAC_XIU
    
    # Vietnamese coffee with no default milk (cf_6, cf_7)
    if product.get("noDefaultMilk"):
        return MILK_OPTIONS
    
    # Italian coffee - Fresh Milk is default
    return MILK_OPTIONS_ITALIAN


def has_sugar_option(product_id: str):
    """Check if product has sugar customization"""
    product = get_product_by_id(product_id)
    if not product:
        return False
    
    # "none" means no sugar option at all
    default_sugar = product.get("defaultSugar", "0")
    return default_sugar != "none"


def has_size_option(product_id: str):
    """Check if product has size options"""
    product = get_product_by_id(product_id)
    if not product:
        return False
    
    # Only beverages have size options
    category = product.get("category")
    return category in ["coffee", "tea", "juice"]
