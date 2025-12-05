"""
Reviews routes: Submit, view, delete product reviews
"""
from fastapi import APIRouter, HTTPException
from models.schemas import ReviewSubmit, ReviewResponse, ProductReviewsResponse
from models.responses import StatusResponse
from database import get_db
from utils.timezone import get_vietnam_time
from datetime import datetime

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("/submit", summary="Submit Product Review", response_model=StatusResponse)
def submit_review(request: ReviewSubmit):
    """
    Submit a review for a product.
    
    - **user_id**: User ID (required)
    - **product_id**: Product ID (required)
    - **rating**: Rating 1-5 (required)
    - **review_text**: Review text (optional)
    - **order_id**: Order ID reference (optional)
    
    Returns success or error message.
    """
    if not 1 <= request.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    conn = get_db()
    c = conn.cursor()
    
    try:
        c.execute("""
            INSERT OR REPLACE INTO reviews
            (user_id, product_id, rating, review_text, order_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            request.user_id,
            request.product_id,
            request.rating,
            request.review_text,
            request.order_id,
            get_vietnam_time().isoformat(),
            get_vietnam_time().isoformat()
        ))
        
        conn.commit()
        return {"status": "success", "message": "Review submitted successfully"}
        
    except Exception as e:
        conn.rollback()
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
    c = conn.cursor()
    
    # Get aggregate stats
    c.execute("""
        SELECT
            COUNT(*) as total,
            AVG(rating) as avg_rating
        FROM reviews
        WHERE product_id = ?
    """, (product_id,))
    
    stats = c.fetchone()
    total_reviews = stats[0] if stats[0] else 0
    avg_rating = round(stats[1], 1) if stats[1] else 0
    
    # Get individual reviews
    c.execute("""
        SELECT id, user_id, product_id, rating, review_text, created_at
        FROM reviews
        WHERE product_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, (product_id, limit, offset))
    
    reviews_data = c.fetchall()
    conn.close()
    
    reviews = [
        {
            "id": r[0],
            "user_id": r[1],
            "product_id": r[2],
            "rating": r[3],
            "review_text": r[4],
            "created_at": r[5]
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
    c = conn.cursor()
    
    c.execute("""
        SELECT id, user_id, product_id, rating, review_text, created_at
        FROM reviews
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (user_id, limit))
    
    reviews_data = c.fetchall()
    conn.close()
    
    return [
        {
            "id": r[0],
            "user_id": r[1],
            "product_id": r[2],
            "rating": r[3],
            "review_text": r[4],
            "created_at": r[5]
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
    c = conn.cursor()
    
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
            WHERE product_id = ?
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
        "total_reviews": result[0] or 0,
        "average_rating": round(result[1], 1) if result[1] else 0,
        "min_rating": result[2] or 0,
        "max_rating": result[3] or 0,
        "distribution": {
            "5_stars": result[4] or 0,
            "4_stars": result[5] or 0,
            "3_stars": result[6] or 0,
            "2_stars": result[7] or 0,
            "1_star": result[8] or 0
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
    c = conn.cursor()
    
    # Verify ownership
    c.execute("SELECT user_id FROM reviews WHERE id = ?", (review_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="Review not found")
    
    if result[0] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized - not review author")
    
    # Delete review
    try:
        c.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Review deleted successfully"}
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
