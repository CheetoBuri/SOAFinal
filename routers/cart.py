"""
Cart routes: Add items, view cart, clear cart, remove items
"""
from fastapi import APIRouter, HTTPException
from models.schemas import AddToCartRequest
from models.responses import StatusResponse, CartResponse
from database import get_db
import json
import psycopg2.extras

router = APIRouter(prefix="/api/cart", tags=["8️⃣ Cart (Optional)"])


@router.post("/add", summary="Add Item to Cart", response_model=StatusResponse)
def add_to_cart(request: AddToCartRequest):
    """
    Add a product to user's shopping cart.
    
    - **user_id**: User ID (required)
    - **item**: Cart item object with product details (required)
    
    Returns success status message.
    """
    user_id = request.user_id
    item = request.item
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    # Convert item to dict
    cart_item = item.dict() if hasattr(item, 'dict') else item
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if user has existing cart
    c.execute("SELECT items FROM cart WHERE user_id = %s", (user_id,))
    result = c.fetchone()
    
    if result:
        # Update existing cart
        items = json.loads(result['items'])
        items.append(cart_item)
        c.execute("UPDATE cart SET items = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s", 
                 (json.dumps(items), user_id))
    else:
        # Create new cart
        c.execute("INSERT INTO cart (user_id, items) VALUES (%s, %s)", 
                 (user_id, json.dumps([cart_item])))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Added to cart"
    }


@router.get("", summary="Get User's Cart", response_model=CartResponse)
def get_cart(user_id: str):
    """
    Get all items in user's shopping cart.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns array of cart items with details.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("SELECT items FROM cart WHERE user_id = %s", (user_id,))
    result = c.fetchone()
    
    conn.close()
    
    if not result:
        return {"items": []}
    
    items = json.loads(result['items'])
    # Ensure product_id is set for backward compatibility with remove endpoint
    for item in items:
        if "id" in item and not item.get("product_id"):
            item["product_id"] = item["id"]
    
    return {"items": items}


@router.delete("/clear", summary="Clear Cart", response_model=StatusResponse)
def clear_cart(user_id: str):
    """
    Remove all items from user's cart.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns success status message.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Cart cleared"
    }


@router.delete("/{product_id}", summary="Remove Item from Cart", response_model=StatusResponse)
def remove_from_cart(product_id: str, user_id: str):
    """
    Remove specific item from user's cart.
    
    - **product_id**: Product ID to remove (path parameter, required)
    - **user_id**: User ID (query parameter, required)
    
    Returns success status message.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("SELECT items FROM cart WHERE user_id = %s", (user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = json.loads(result['items'])
    
    # Remove first occurrence of product with matching id
    found = False
    for i, item in enumerate(items):
        if item.get("id") == product_id or item.get("product_id") == product_id:
            items.pop(i)
            found = True
            break
    
    if not found:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    if items:
        c.execute("UPDATE cart SET items = %s WHERE user_id = %s", (json.dumps(items), user_id))
    else:
        c.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Item removed from cart"
    }
