"""
Transaction history routes: View wallet balance transaction history
"""
from fastapi import APIRouter, HTTPException
from models.responses import TransactionHistoryResponse
from database import get_db
import json
import psycopg2.extras

router = APIRouter(prefix="/api/transactions", tags=["💳 Transaction History"])


@router.get("", summary="Get Transaction History", response_model=TransactionHistoryResponse)
def get_transactions(user_id: str):
    """
    Get wallet balance transaction history for a user.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns array of transactions sorted by date (newest first).
    Only includes balance-related transactions (payments, refunds).
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Verify user exists
    c.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get transactions
    c.execute("""
        SELECT id, type, amount, balance_before, balance_after, 
               order_id, description, created_at
        FROM transactions
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    transactions = []
    for row in c.fetchall():
        created_at = row['created_at']
        if hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        
        transactions.append({
            "id": row['id'],
            "type": row['type'],
            "amount": row['amount'],
            "balance_before": row['balance_before'],
            "balance_after": row['balance_after'],
            "order_id": row['order_id'],
            "description": row['description'],
            "created_at": created_at
        })
    
    conn.close()
    
    return {"transactions": transactions}
