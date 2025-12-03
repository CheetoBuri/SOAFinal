"""
Menu data and utilities
"""

MENU_PRODUCTS = {
    "coffee": [
        {"id": "cf_1", "name": "Espresso", "category": "coffee", "price": 25000, "icon": "☕"},
        {"id": "cf_2", "name": "Americano", "category": "coffee", "price": 30000, "icon": "☕"},
        {"id": "cf_3", "name": "Cappuccino", "category": "coffee", "price": 40000, "icon": "☕"},
        {"id": "cf_4", "name": "Latte", "category": "coffee", "price": 40000, "icon": "☕"},
        {"id": "cf_5", "name": "Cold Brew", "category": "coffee", "price": 35000, "icon": "☕"},
    ],
    "tea": [
        {"id": "t_1", "name": "Green Tea", "category": "tea", "price": 25000, "icon": "🍵"},
        {"id": "t_2", "name": "Black Tea", "category": "tea", "price": 25000, "icon": "🍵"},
        {"id": "t_3", "name": "Oolong Tea", "category": "tea", "price": 30000, "icon": "🍵"},
    ],
    "juice": [
        {"id": "j_1", "name": "Orange Juice", "category": "juice", "price": 30000, "icon": "🧃"},
        {"id": "j_2", "name": "Apple Juice", "category": "juice", "price": 30000, "icon": "🧃"},
        {"id": "j_3", "name": "Mango Juice", "category": "juice", "price": 35000, "icon": "🧃"},
    ],
    "food": [
        {"id": "f_1", "name": "Croissant", "category": "food", "price": 35000, "icon": "🥐"},
        {"id": "f_2", "name": "Sandwich", "category": "food", "price": 45000, "icon": "🥪"},
        {"id": "f_3", "name": "Cake", "category": "food", "price": 40000, "icon": "🍰"},
    ]
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
