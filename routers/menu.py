"""
Menu routes: Get products, search, filter by category
"""
from fastapi import APIRouter
from models.responses import MenuResponse, SearchResponse
from utils.menu_data import get_all_products, get_products_by_category, search_products

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
