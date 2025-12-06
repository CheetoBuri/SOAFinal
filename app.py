"""
Main FastAPI application - Modular structure
Cafe Ordering System with OTP Authentication
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from utils.timezone import get_vietnam_time
import os

# Import database initialization
from database import init_db, migrate_add_delivered_at

# Import all routers
from routers import auth, menu, profile, orders, payment, favorites, cart, reviews
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
    # Initialize PostgreSQL connection pool
    try:
        init_db()
        print("✅ PostgreSQL connection pool initialized")
    except Exception as e:
        print(f"⚠️ Error initializing database: {e}")
        # Don't crash the app, let it try to connect later
    print("✅ Application ready")

# Include all routers
app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(profile.router)
app.include_router(orders.router)
app.include_router(payment.router)
app.include_router(favorites.router)
app.include_router(cart.router)
app.include_router(reviews.router)
if locations is not None:
    app.include_router(locations.router)
if transactions is not None:
    app.include_router(transactions.router)

# Serve legacy static files (CSS, JS) if needed
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Serve React build assets if present (Vite output)
REACT_DIST_DIR = os.path.join("frontend", "react", "dist")
REACT_ASSETS_DIR = os.path.join(REACT_DIST_DIR, "assets")
HAS_REACT_BUILD = os.path.exists(os.path.join(REACT_DIST_DIR, "index.html"))

if HAS_REACT_BUILD and os.path.isdir(REACT_ASSETS_DIR):
    # Mount Vite hashed assets at /assets
    app.mount("/assets", StaticFiles(directory=REACT_ASSETS_DIR), name="assets")

# Health check - MUST be defined before catch-all routes
@app.get("/health", tags=["Health"])
def health_check():
    """API health check"""
    return {"status": "online", "message": "Cafe API is running"}

# Root - serve React index.html if built, else fallback to vanilla index.html
@app.get("/", tags=["Frontend"], include_in_schema=False)
def root():
    """Serve frontend at root: React build if available, else fallback HTML"""
    react_index = os.path.join(REACT_DIST_DIR, "index.html")
    if os.path.exists(react_index):
        return FileResponse(react_index)
    return FileResponse("index.html")

# SPA fallback for client-side routing (exclude API and known prefixes)
@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    # Let API and docs routes pass through
    blocked_prefixes = ("api", "docs", "redoc", "openapi.json", "assets", "frontend")
    if full_path.startswith(blocked_prefixes):
        raise HTTPException(status_code=404, detail="Not Found")
    react_index = os.path.join(REACT_DIST_DIR, "index.html")
    if os.path.exists(react_index):
        return FileResponse(react_index)
    # If no React build, fall back to legacy index only for root; others 404
    raise HTTPException(status_code=404, detail="Not Found")

# Note: Old monolithic frontend endpoints removed to avoid confusion

