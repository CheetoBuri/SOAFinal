"""
Wishlist routes: Save items for later, view wishlist, remove items
"""
from fastapi import APIRouter, HTTPException
from models.schemas import WishlistItemRequest, WishlistItemResponse
from models.responses import StatusResponse
from database import get_db
from utils.timezone import get_vietnam_time

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


@router.post("/add", summary="Add Item to Wishlist", response_model=StatusResponse)
def add_to_wishlist(request: WishlistItemRequest):
    """
    Add product to user's wishlist.
    
    - **user_id**: User ID (required)
    - **product_id**: Product ID (required)
    - **notes**: Optional notes about the item (optional)
    
    Returns success status.
    """
    conn = get_db()
    c = conn.cursor()
    
    try:
        c.execute("""
            INSERT OR REPLACE INTO wishlist
            (user_id, product_id, notes, added_at)
            VALUES (?, ?, ?, ?)
        """, (
            request.user_id,
            request.product_id,
            request.notes,
            get_vietnam_time().isoformat()
        ))
        
        conn.commit()
        return {"status": "success", "message": "Item added to wishlist"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/{user_id}", summary="Get User's Wishlist", response_model=list[WishlistItemResponse])
def get_wishlist(user_id: str):
    """
    Get all items in user's wishlist.
    
    - **user_id**: User ID (path parameter, required)
    
    Returns list of wishlist items.
    """
    conn = get_db()
    c = conn.cursor()
    
    c.execute("""
        SELECT id, user_id, product_id, notes, added_at
        FROM wishlist
        WHERE user_id = ?
        ORDER BY added_at DESC
    """, (user_id,))
    
    items = c.fetchall()
    conn.close()
    
    return [
        {
            "id": item[0],
            "user_id": item[1],
            "product_id": item[2],
            "notes": item[3],
            "added_at": item[4]
        }
        for item in items
    ]


@router.delete("/{product_id}", summary="Remove Item from Wishlist", response_model=StatusResponse)
def remove_from_wishlist(product_id: str, user_id: str):
    """
    Remove product from user's wishlist.
    
    - **product_id**: Product ID (path parameter, required)
    - **user_id**: User ID (query parameter, required)
    
    Returns success status.
    """
    conn = get_db()
    c = conn.cursor()
    
    # Verify ownership
    c.execute("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?", (user_id, product_id))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    
    try:
        c.execute("""
            DELETE FROM wishlist
            WHERE user_id = ? AND product_id = ?
        """, (user_id, product_id))
        
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Item removed from wishlist"}
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear", summary="Clear Entire Wishlist", response_model=StatusResponse)
def clear_wishlist(user_id: str):
    """
    Clear all items from user's wishlist.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns success status.
    """
    conn = get_db()
    c = conn.cursor()
    
    try:
        c.execute("DELETE FROM wishlist WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Wishlist cleared"}
        
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
