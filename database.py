"""
Database connection and initialization
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import pool
import os
import json

# Database connection parameters from environment
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "cafe_orders"),
    "user": os.getenv("DB_USER", "cafe_user"),
    "password": os.getenv("DB_PASSWORD", "cafe_password")
}

# Connection pool
connection_pool = None


def init_connection_pool():
    """Initialize PostgreSQL connection pool"""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # minconn
            10,  # maxconn
            **DB_CONFIG
        )
        print("✅ PostgreSQL connection pool created")
    except Exception as e:
        print(f"❌ Error creating connection pool: {e}")
        raise


class PooledConnection:
    """Wrapper for pooled connection that returns to pool on close()"""
    def __init__(self, conn, pool):
        self._conn = conn
        self._pool = pool
        self._closed = False
    
    def cursor(self, *args, **kwargs):
        return self._conn.cursor(*args, **kwargs)
    
    def commit(self):
        if not self._closed:
            self._conn.commit()
    
    def rollback(self):
        if not self._closed:
            self._conn.rollback()
    
    def close(self):
        """Return connection to pool instead of closing"""
        if not self._closed:
            try:
                self._conn.commit()
            except:
                self._conn.rollback()
            finally:
                self._pool.putconn(self._conn)
                self._closed = True
    
    def __getattr__(self, name):
        """Delegate other attributes to real connection"""
        return getattr(self._conn, name)


def get_db():
    """Get database connection from pool"""
    if connection_pool is None:
        init_connection_pool()
    
    conn = connection_pool.getconn()
    return PooledConnection(conn, connection_pool)


def init_db():
    """Initialize PostgreSQL database - tables are created by init_postgres.sql"""
    try:
        init_connection_pool()
        print("✅ PostgreSQL database initialized")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise


def migrate_add_delivered_at():
    """Migration no longer needed - delivered_at is in init_postgres.sql"""
    print("ℹ️  Migration skipped - using PostgreSQL schema")


def dict_factory(cursor, row):
    """Convert database row to dictionary"""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d
