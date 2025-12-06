#!/usr/bin/env python3
"""
Script to convert SQLite syntax to PostgreSQL in router files
"""
import os
import re

def convert_file(filepath):
    """Convert a single Python file from SQLite to PostgreSQL syntax"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Replace get_db() usage pattern
    # From: conn = get_db()
    # To: with get_db() as conn:
    
    # 2. Replace ? with %s in SQL queries
    content = re.sub(r'\.execute\s*\(\s*"""([^"]*?)"""', 
                     lambda m: '.execute("""' + m.group(1).replace('?', '%s') + '"""',
                     content, flags=re.DOTALL)
    
    content = re.sub(r'\.execute\s*\(\s*"([^"]*?)"', 
                     lambda m: '.execute("' + m.group(1).replace('?', '%s') + '"',
                     content)
    
    # 3. Replace cursor usage with RealDictCursor
    content = re.sub(r'c = conn\.cursor\(\)', 
                     'c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)',
                     content)
    
    # 4. Add psycopg2 import if not present
    if 'psycopg2' not in content and 'cursor' in content:
        content = re.sub(r'(from database import.*)',
                        r'\1\nimport psycopg2.extras',
                        content)
    
    # 5. Replace json.dumps() for items column
    # SQLite stores as TEXT, PostgreSQL needs JSONB
    content = re.sub(r'json\.dumps\(([^)]+)\)', 
                     r'\1',  # Remove json.dumps, let PostgreSQL handle it
                     content)
    
    # 6. Replace json.loads() for items column retrieval
    # PostgreSQL returns JSONB as dict automatically
    content = re.sub(r'json\.loads\(row\[(\d+)\]\)', 
                     r'row[\1]',
                     content)
    
    # 7. Replace conn.close() patterns (not needed with context manager)
    # We'll keep them for now but they'll be harmless
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Converted: {filepath}")
        return True
    else:
        print(f"⏭️  Skipped (no changes): {filepath}")
        return False

def main():
    """Convert all router files"""
    router_dir = 'routers'
    count = 0
    
    for filename in os.listdir(router_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            filepath = os.path.join(router_dir, filename)
            if convert_file(filepath):
                count += 1
    
    print(f"\n✅ Converted {count} files")

if __name__ == '__main__':
    main()
