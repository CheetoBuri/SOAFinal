"""
Main FastAPI application - Modular structure
Cafe Ordering System with OTP Authentication
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from utils.timezone import get_vietnam_time
import os

# Import database initialization
from database import init_db

# Import all routers
from routers import auth, menu, profile, orders, payment, favorites, cart
# Optional routers: import if present
try:
    from routers import locations  # type: ignore
except Exception:
    locations = None
try:
    from routers import transactions  # type: ignore
except Exception:
    transactions = None

# Initialize FastAPI app
app = FastAPI(
    title="☕ Cafe Ordering API",
    description="Complete cafe ordering system with OTP authentication, menu browsing, orders, and payments",
    version="2.0.0"
)

# Custom middleware to add Vietnam timezone to response headers
class VietnamTimezoneMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Add custom header with Vietnam time
        vn_time = get_vietnam_time().strftime("%a, %d %b %Y %H:%M:%S GMT+0700")
        response.headers["X-Vietnam-Time"] = vn_time
        return response

# Add custom middleware first (before CORS)
app.add_middleware(VietnamTimezoneMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    # Only init once - check if tables exist first
    import sqlite3
    conn = None
    try:
        conn = sqlite3.connect("cafe_orders.db", timeout=5.0)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not c.fetchone():
            print("🔧 First time setup - initializing database...")
            conn.close()
            conn = None
            init_db()
        else:
            print("✅ Database already initialized")
    except Exception as e:
        print(f"⚠️ Error checking database: {e}")
    finally:
        if conn:
            conn.close()
    print("✅ Application ready")

# Include all routers
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(profile.router)
app.include_router(orders.router)
app.include_router(payment.router)
app.include_router(favorites.router)
app.include_router(cart.router)
if locations is not None:
    app.include_router(locations.router)
if transactions is not None:
    app.include_router(transactions.router)

# Serve static files (CSS, JS)
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Root - redirect to new refactored frontend
@app.get("/", tags=["Frontend"])
def root():
    """Serve new refactored frontend at root"""
    return FileResponse("index.html")

# Health check
@app.get("/health", tags=["Health"])
def health_check():
    """API health check"""
    return {"status": "online", "message": "Cafe API is running"}

# Serve old frontend (for backward compatibility)
@app.get("/order_frontend_v2.html", tags=["Frontend"])
def serve_old_frontend():
    """Serve the old ordering frontend"""
    return FileResponse("order_frontend_v2.html")

@app.get("/old", tags=["Frontend"])
def serve_old_frontend_alias():
    """Serve the old ordering frontend (alias)"""
    return FileResponse("order_frontend_v2.html")
