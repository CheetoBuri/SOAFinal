#!/usr/bin/env python3
"""
Fix context manager usage in router files
"""
import os
import re

def fix_file(filepath):
    """Fix get_db() usage to use with statement"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: conn = get_db() followed by c = conn.cursor(...)
    # Replace with: with get_db() as conn:
    
    # Find all instances of "conn = get_db()" and replace them
    # This needs to be smart about indentation
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check if line contains "conn = get_db()"
        if re.search(r'^\s*conn = get_db\(\)', line):
            indent = len(line) - len(line.lstrip())
            indent_str = ' ' * indent
            
            # Replace with "with get_db() as conn:"
            new_lines.append(indent_str + 'with get_db() as conn:')
            
            # Indent all following lines until we hit conn.close() or dedent
            i += 1
            inner_indent = indent + 4
            
            while i < len(lines):
                current_line = lines[i]
                
                # Skip conn.close() lines
                if re.search(r'^\s*conn\.close\(\)', current_line):
                    i += 1
                    continue
                
                # Check if we've dedented (end of function or block)
                if current_line.strip() and not current_line.startswith(' ' * (indent + 1)):
                    break
                
                # Add extra indentation
                if current_line.strip():  # Non-empty line
                    new_lines.append(' ' * 4 + current_line)
                else:  # Empty line
                    new_lines.append(current_line)
                
                i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    content = '\n'.join(new_lines)
    
    # Remove conn.commit() and conn.close() as they're handled by context manager
    # Actually, keep commit() but remove close()
    content = re.sub(r'\n\s*conn\.close\(\)\s*\n', '\n', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed: {filepath}")
        return True
    else:
        print(f"⏭️  No changes: {filepath}")
        return False

def main():
    """Fix all router files"""
    router_dir = 'routers'
    count = 0
    
    for filename in os.listdir(router_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            filepath = os.path.join(router_dir, filename)
            if fix_file(filepath):
                count += 1
    
    print(f"\n✅ Fixed {count} files")

if __name__ == '__main__':
    main()
