"""
Favorites routes: Add, remove, and list favorite products
"""
from fastapi import APIRouter, HTTPException
from models.schemas import FavoriteRequest
from models.responses import StatusResponse, FavoritesResponse
from database import get_db
import psycopg2.extras

router = APIRouter(prefix="/api/favorites", tags=["7️⃣ Favorites"])


@router.post("/add", summary="Add Product to Favorites", response_model=StatusResponse)
def add_favorite(request: FavoriteRequest):
    """
    Add a product to user's favorites list.
    
    - **user_id**: User ID (required)
    - **product_id**: Product ID to add (required)
    
    Returns success status message.
    """
    user_id = request.user_id
    product_id = request.product_id
    
    if not user_id or not product_id:
        raise HTTPException(status_code=400, detail="user_id and product_id required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if already exists
    c.execute("SELECT id FROM favorites WHERE user_id = %s AND product_id = %s", (user_id, product_id))
    existing = c.fetchone()
    
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Product already in favorites")
    
    # Add to favorites
    c.execute("INSERT INTO favorites (user_id, product_id) VALUES (%s, %s)", (user_id, product_id))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Added to favorites"
    }


@router.post("/remove", summary="Remove Product from Favorites (POST)", response_model=StatusResponse)
def remove_favorite_post(request: FavoriteRequest):
    """
    Remove a product from user's favorites via POST request.
    
    - **user_id**: User ID (required)
    - **product_id**: Product ID to remove (required)
    
    Returns success status message.
    """
    user_id = request.user_id
    product_id = request.product_id
    
    if not user_id or not product_id:
        raise HTTPException(status_code=400, detail="user_id and product_id required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("DELETE FROM favorites WHERE user_id = %s AND product_id = %s", (user_id, product_id))
    
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Removed from favorites"
    }


@router.delete("/{product_id}", summary="Remove Product from Favorites", response_model=StatusResponse)
def remove_favorite(product_id: str, user_id: str):
    """
    Remove a product from user's favorites.
    
    - **product_id**: Product ID to remove (path parameter, required)
    - **user_id**: User ID (query parameter, required)
    
    Returns success status message.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("DELETE FROM favorites WHERE user_id = %s AND product_id = %s", (user_id, product_id))
    
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Removed from favorites"
    }


@router.get("/{user_id}", summary="Get User's Favorite Products")
def get_favorites(user_id: str):
    """
    Get all favorite products for a user with full product details.
    
    - **user_id**: User ID (path parameter, required)
    
    Returns array of favorite product IDs.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("SELECT product_id FROM favorites WHERE user_id = %s", (user_id,))
    
    favorites = [{"product_id": row['product_id']} for row in c.fetchall()]
    
    conn.close()
    
    return favorites
