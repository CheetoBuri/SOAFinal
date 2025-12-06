#!/usr/bin/env python3
"""
Fix row[index] to row['column'] for RealDictCursor
"""
import os
import re

def fix_file(filepath):
    """Fix row[index] to use dict keys"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern: row[0], row[1], etc.
    # This is tricky - we need to see the SELECT statement to know column names
    # For now, just warn about them
    
    matches = re.findall(r'row\[\d+\]', content)
    if matches:
        print(f"⚠️  {filepath}: Found {len(set(matches))} row[index] patterns")
        print(f"   Patterns: {set(matches)}")
        return False
    else:
        print(f"✅ {filepath}: No row[index] patterns found")
        return True

def main():
    """Check all router files"""
    router_dir = 'routers'
    
    for filename in os.listdir(router_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            filepath = os.path.join(router_dir, filename)
            fix_file(filepath)

if __name__ == '__main__':
    main()
