"""
Menu routes: Get products, search, filter by category, get customization options
"""
from fastapi import APIRouter, HTTPException
from models.responses import MenuResponse, SearchResponse
from utils.menu_data import (
    get_all_products, get_products_by_category, search_products,
    get_product_by_id, get_available_upsells, get_available_toppings,
    get_milk_options, has_sugar_option, has_size_option,
    SIZE_OPTIONS, COFFEE_UPSELLS, TEA_UPSELLS, FOOD_TOPPINGS, MILK_OPTIONS
)

router = APIRouter(prefix="/api/menu", tags=["2️⃣ Menu"])


@router.get("", summary="Get All Menu Items", response_model=MenuResponse)
def get_menu():
    """
    Get all available menu items.
    
    Returns complete list of all products with their details (id, name, category, price, icon).
    """
    return {"items": get_all_products()}


@router.get("/search", summary="Search Menu Items", response_model=SearchResponse)
def search_menu(q: str):
    """
    Search menu items by name.
    
    - **q**: Search query string (query parameter, required)
    
    Returns matching items and total count.
    """
    results = search_products(q)
    return {"items": results, "count": len(results)}


@router.get("/{category}", summary="Get Menu Items by Category", response_model=MenuResponse)
def get_menu_by_category(category: str):
    """
    Get menu items filtered by category.
    
    - **category**: Category name (path parameter, required)
      - Options: `coffee`, `tea`, `juice`, `food`
    
    Returns items in the specified category.
    """
    products = get_products_by_category(category)
    if not products:
        return {"items": [], "message": f"No products found in category: {category}"}
    return {"items": products}


@router.get("/product/{product_id}", summary="Get Product Details with Customization Options")
def get_product_details(product_id: str):
    """
    Get detailed product information including available customization options.
    
    - **product_id**: Product ID (path parameter, required)
    
    Returns product info plus available upsells, toppings, milk options, and customization flags.
    """
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "product": product,
        "customization": {
            "hasSugar": has_sugar_option(product_id),
            "hasSize": has_size_option(product_id),
            "sizes": SIZE_OPTIONS if has_size_option(product_id) else {},
            "upsells": get_available_upsells(product_id),
            "toppings": get_available_toppings(product_id),
            "milkOptions": get_milk_options(product_id),
        }
    }


@router.get("/options/all", summary="Get All Customization Options")
def get_all_customization_options():
    """
    Get all available customization options (upsells, toppings, milk options, sizes).
    
    Useful for frontend to cache all options at once.
    """
    return {
        "sizes": SIZE_OPTIONS,
        "coffeeUpsells": COFFEE_UPSELLS,
        "teaUpsells": TEA_UPSELLS,
        "foodToppings": FOOD_TOPPINGS,
        "milkOptions": MILK_OPTIONS,
    }
