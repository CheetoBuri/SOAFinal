"""
Helper to convert SQLite queries to PostgreSQL queries
"""
import json


def convert_params(query: str, params: tuple = None):
    """
    Convert SQLite ? placeholders to PostgreSQL %s placeholders
    Args:
        query: SQL query string with ? placeholders
        params: Query parameters
    Returns:
        tuple: (converted_query, params)
    """
    # Replace ? with %s for PostgreSQL
    count = query.count('?')
    converted = query
    for i in range(count):
        converted = converted.replace('?', '%s', 1)
    
    return (converted, params)


def serialize_json(data):
    """
    Serialize Python dict/list to JSON string for PostgreSQL JSONB
    """
    if isinstance(data, (dict, list)):
        return json.dumps(data)
    return data


def deserialize_json(data):
    """
    Deserialize JSON string from PostgreSQL JSONB to Python dict/list
    """
    if isinstance(data, str):
        try:
            return json.loads(data)
        except:
            return data
    return data
