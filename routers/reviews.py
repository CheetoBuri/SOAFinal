"""
Reviews routes: Submit, view, delete product reviews
"""
from fastapi import APIRouter, HTTPException
from models.schemas import ReviewSubmit, ReviewResponse, ProductReviewsResponse
from models.responses import StatusResponse
from database import get_db
from utils.timezone import get_vietnam_time
from datetime import datetime
import psycopg2.extras

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("/submit", summary="Submit Product + Service Review", response_model=StatusResponse)
def submit_review(request: ReviewSubmit):
    """
    Submit a review for a product and optionally for shipping/service.
    
    - **user_id**: User ID (required)
    - **product_id**: Product ID (required)
    - **rating**: Product rating 1-5 (required)
    - **review_text**: Product review text (optional)
    - **service_rating**: Shipping/service rating 1-5 (optional)
    - **service_review_text**: Service review text (optional)
    - **order_id**: Order ID reference (optional)
    
    Returns success or error message.
    """
    if not 1 <= request.rating <= 5:
        raise HTTPException(status_code=400, detail="Product rating must be between 1 and 5")
    
    if request.service_rating is not None and not 1 <= request.service_rating <= 5:
        raise HTTPException(status_code=400, detail="Service rating must be between 1 and 5")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        c.execute("""
            INSERT INTO reviews
            (user_id, product_id, rating, review_text, service_rating, service_review_text, order_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, product_id, order_id) 
            DO UPDATE SET 
                rating = EXCLUDED.rating,
                review_text = EXCLUDED.review_text,
                service_rating = EXCLUDED.service_rating,
                service_review_text = EXCLUDED.service_review_text,
                updated_at = EXCLUDED.updated_at
        """, (
            request.user_id,
            request.product_id,
            request.rating,
            request.review_text,
            request.service_rating,
            request.service_review_text,
            request.order_id,
            get_vietnam_time().isoformat(),
            get_vietnam_time().isoformat()
        ))
        
        conn.commit()
        return {"status": "success", "message": "Review submitted successfully"}
        
    except Exception as e:
        conn.rollback()
        # Handle foreign key constraint errors gracefully
        error_msg = str(e)
        if "foreign key constraint" in error_msg.lower():
            if "user_id" in error_msg:
                raise HTTPException(status_code=404, detail="User not found")
            elif "product_id" in error_msg:
                raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get(
    "/product/{product_id}",
    summary="Get Product Reviews",
    response_model=ProductReviewsResponse
)
def get_product_reviews(product_id: str, limit: int = 20, offset: int = 0):
    """
    Get reviews for a specific product.
    
    - **product_id**: Product ID (path parameter, required)
    - **limit**: Maximum reviews to return (query, default 20)
    - **offset**: Pagination offset (query, default 0)
    
    Returns average rating, review count, and list of reviews.
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get aggregate stats
    c.execute("""
        SELECT
            COUNT(*) as total,
            AVG(rating) as avg_rating
        FROM reviews
        WHERE product_id = %s
    """, (product_id,))
    
    stats = c.fetchone()
    total_reviews = stats['total'] if stats['total'] else 0
    avg_rating = round(stats['avg_rating'], 1) if stats['avg_rating'] else 0
    
    # Get individual reviews
    c.execute("""
        SELECT id, user_id, product_id, rating, review_text, created_at
        FROM reviews
        WHERE product_id = %s
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """, (product_id, limit, offset))
    
    reviews_data = c.fetchall()
    conn.close()
    
    reviews = [
        {
            "id": r['id'],
            "user_id": r['user_id'],
            "product_id": r['product_id'],
            "rating": r['rating'],
            "review_text": r['review_text'],
            "created_at": r['created_at']
        }
        for r in reviews_data
    ]
    
    return {
        "product_id": product_id,
        "average_rating": avg_rating,
        "total_reviews": total_reviews,
        "reviews": reviews
    }


@router.get(
    "/user/{user_id}",
    summary="Get User's Reviews",
    response_model=list[ReviewResponse]
)
def get_user_reviews(user_id: str, limit: int = 50):
    """
    Get all reviews submitted by a user.
    
    - **user_id**: User ID (path parameter, required)
    - **limit**: Maximum reviews to return (query, default 50)
    
    Returns list of reviews by the user.
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("""
        SELECT id, user_id, product_id, rating, review_text, created_at
        FROM reviews
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT %s
    """, (user_id, limit))
    
    reviews_data = c.fetchall()
    conn.close()
    
    return [
        {
            "id": r['id'],
            "user_id": r['user_id'],
            "product_id": r['product_id'],
            "rating": r['rating'],
            "review_text": r['review_text'],
            "created_at": r['created_at']
        }
        for r in reviews_data
    ]


@router.get(
    "/stats",
    summary="Get Product Rating Stats"
)
def get_rating_stats(product_id: str = None):
    """
    Get rating statistics.
    If product_id provided, get stats for that product.
    Otherwise, get overall stats.
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    if product_id:
        c.execute("""
            SELECT
                COUNT(*) as total,
                AVG(rating) as avg,
                MIN(rating) as min,
                MAX(rating) as max,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE product_id = %s
        """, (product_id,))
    else:
        c.execute("""
            SELECT
                COUNT(*) as total,
                AVG(rating) as avg,
                MIN(rating) as min,
                MAX(rating) as max,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
        """)
    
    result = c.fetchone()
    conn.close()
    
    return {
        "total_reviews": result['total'] or 0,
        "average_rating": round(result['avg'], 1) if result['avg'] else 0,
        "min_rating": result['min'] or 0,
        "max_rating": result['max'] or 0,
        "distribution": {
            "5_stars": result['five_stars'] or 0,
            "4_stars": result['four_stars'] or 0,
            "3_stars": result['three_stars'] or 0,
            "2_stars": result['two_stars'] or 0,
            "1_star": result['one_star'] or 0
        }
    }


@router.delete(
    "/{review_id}",
    summary="Delete Review",
    response_model=StatusResponse
)
def delete_review(review_id: int, user_id: str):
    """
    Delete a review (only by the author).
    
    - **review_id**: Review ID (path parameter, required)
    - **user_id**: User ID for verification (query, required)
    
    Returns success or error message.
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Verify ownership
    c.execute("SELECT user_id FROM reviews WHERE id = %s", (review_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="Review not found")
    
    if result['user_id'] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized - not review author")
    
    # Delete review
    try:
        c.execute("DELETE FROM reviews WHERE id = %s", (review_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Review deleted successfully"}
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/{order_id}", summary="Get Reviews for an Order")
def get_order_reviews(order_id: str, user_id: str):
    """
    Get all reviews submitted for a specific order.
    
    - **order_id**: Order ID (path parameter, required)
    - **user_id**: User ID (query parameter, required for verification)
    
    Returns list of reviews with product info and ratings.
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # First get the order to access items JSON
        c.execute("""
            SELECT items
            FROM orders
            WHERE id = %s AND user_id = %s
        """, (order_id, user_id))
        
        order_result = c.fetchone()
        if not order_result:
            conn.close()
            return {
                "order_id": order_id,
                "has_reviews": False,
                "reviews": []
            }
        
        # Parse items JSON to create product_id -> name mapping
        import json
        items = json.loads(order_result['items']) if isinstance(order_result['items'], str) else order_result['items']
        product_names = {}
        for item in items:
            product_id = item.get('product_id') or item.get('id')
            product_name = item.get('product_name') or item.get('name', 'Product')
            size = item.get('size', '')
            if size and size != 'M':
                product_name += f" ({size})"
            product_names[product_id] = product_name
        
        # Get reviews
        c.execute("""
            SELECT 
                r.id,
                r.product_id,
                r.rating,
                r.review_text,
                r.service_rating,
                r.service_review_text,
                r.created_at,
                r.updated_at
            FROM reviews r
            WHERE r.order_id = %s AND r.user_id = %s
            ORDER BY r.created_at DESC
        """, (order_id, user_id))
        
        reviews = c.fetchall()
        
        # Add product names to reviews
        for review in reviews:
            review['product_name'] = product_names.get(review['product_id'], 'Unknown Product')
        
        conn.close()
        
        return {
            "order_id": order_id,
            "has_reviews": len(reviews) > 0,
            "reviews": reviews
        }
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
