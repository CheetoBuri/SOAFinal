#!/usr/bin/env python3
"""
Add psycopg2.extras import to all router files that use RealDictCursor
"""
import os
import re

def add_import(filepath):
    """Add psycopg2.extras import if needed"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file uses RealDictCursor
    if 'psycopg2.extras.RealDictCursor' not in content:
        return False
    
    # Check if already has import
    if 'import psycopg2' in content:
        print(f"✅ {filepath}: Already has psycopg2 import")
        return False
    
    # Find where to add import (after other imports)
    lines = content.split('\n')
    insert_index = 0
    
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith('from '):
            insert_index = i + 1
    
    # Insert import
    lines.insert(insert_index, 'import psycopg2.extras')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"✅ {filepath}: Added psycopg2.extras import")
    return True

def main():
    """Add imports to all router files"""
    router_dir = 'routers'
    count = 0
    
    for filename in os.listdir(router_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            filepath = os.path.join(router_dir, filename)
            if add_import(filepath):
                count += 1
    
    print(f"\n✅ Added import to {count} files")

if __name__ == '__main__':
    main()
