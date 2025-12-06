"""
Vietnam locations API: Districts and Wards
Uses provinces.open-api.vn for up-to-date Vietnam administrative data
"""
from fastapi import APIRouter, HTTPException
import httpx
from typing import Optional

router = APIRouter(prefix="/api/locations", tags=["📍 Locations"])

# Cache for API responses
_cache = {
    'provinces': None,
    'districts': {},
    'wards': {}
}

# Using esgoo.net API - reliable and up-to-date Vietnam locations
# HCM City ID: 79
BASE_API_URL = "https://esgoo.net/api-tinhthanh"

# Vietnam Districts (Quận/Huyện) for major cities
DISTRICTS = {
    "HCM": [
        "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8",
        "Quận 9", "Quận 10", "Quận 11", "Quận 12", "Quận Bình Tân", "Quận Bình Thạnh",
        "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú", "Quận Thủ Đức",
        "Huyện Bình Chánh", "Huyện Cần Giờ", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè"
    ],
    "HN": [
        "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy",
        "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Quận Hà Đông",
        "Quận Nam Từ Liêm", "Quận Bắc Từ Liêm"
    ]
}

# Wards (Phường) by District
WARDS = {
    "Quận 1": [
        "Phường Bến Nghé", "Phường Bến Thành", "Phường Cô Giang", "Phường Cầu Kho",
        "Phường Cầu Ông Lãnh", "Phường Đa Kao", "Phường Nguyễn Cư Trinh", "Phường Nguyễn Thái Bình",
        "Phường Phạm Ngũ Lão", "Phường Tân Định"
    ],
    "Quận 2": [
        "Phường An Khánh", "Phường An Lợi Đông", "Phường An Phú", "Phường Bình An",
        "Phường Bình Khánh", "Phường Bình Trưng Đông", "Phường Bình Trưng Tây", "Phường Cát Lái",
        "Phường Thạnh Mỹ Lợi", "Phường Thảo Điền", "Phường Thủ Thiêm"
    ],
    "Quận 3": [
        "Phường 01", "Phường 02", "Phường 03", "Phường 04", "Phường 05",
        "Phường 06", "Phường 07", "Phường 08", "Phường 09", "Phường 10",
        "Phường 11", "Phường 12", "Phường 13", "Phường 14"
    ],
    "Quận 4": [
        "Phường 01", "Phường 02", "Phường 03", "Phường 04", "Phường 06",
        "Phường 08", "Phường 09", "Phường 10", "Phường 13", "Phường 14",
        "Phường 15", "Phường 16", "Phường 18"
    ],
    "Quận 5": [
        "Phường 01", "Phường 02", "Phường 03", "Phường 04", "Phường 05",
        "Phường 06", "Phường 07", "Phường 08", "Phường 09", "Phường 10",
        "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"
    ],
    "Quận 7": [
        "Phường Bình Thuận", "Phường Phú Mỹ", "Phường Phú Thuận", "Phường Tân Hưng",
        "Phường Tân Kiểng", "Phường Tân Phong", "Phường Tân Phú", "Phường Tân Quy",
        "Phường Tân Thuận Đông", "Phường Tân Thuận Tây"
    ],
    "Quận Tân Bình": [
        "Phường 01", "Phường 02", "Phường 03", "Phường 04", "Phường 05",
        "Phường 06", "Phường 07", "Phường 08", "Phường 09", "Phường 10",
        "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"
    ],
    "Quận Bình Thạnh": [
        "Phường 01", "Phường 02", "Phường 03", "Phường 05", "Phường 06",
        "Phường 07", "Phường 11", "Phường 12", "Phường 13", "Phường 14",
        "Phường 15", "Phường 17", "Phường 19", "Phường 21", "Phường 22",
        "Phường 24", "Phường 25", "Phường 26", "Phường 27", "Phường 28"
    ]
}


@router.get("/districts", summary="Get List of Districts")
async def get_districts(city: str = "HCM"):
    """
    Get list of districts for a city (Ho Chi Minh City).
    Uses esgoo.net API for up-to-date data (2024-2025).
    
    - **city**: City code (HCM). Default is HCM (Ho Chi Minh City)
    
    Returns array of district names with codes.
    """
    try:
        # Check cache first
        cache_key = f"districts_{city}"
        if cache_key in _cache['districts']:
            return _cache['districts'][cache_key]
        
        # Ho Chi Minh City code is 79
        province_id = "79" if city.upper() == "HCM" else "01"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BASE_API_URL}/2/{province_id}.htm")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("error") == 0 and data.get("data"):
                    # Extract districts from the response
                    districts = [{"code": str(d["id"]), "name": d["full_name"]} for d in data["data"]]
                    
                    # Cache the result
                    result = {"districts": districts}
                    _cache['districts'][cache_key] = result
                    return result
            
            raise Exception("API returned error or no data")
                
    except Exception as e:
        print(f"Error fetching districts from API: {str(e)}, using fallback data")
        # Fallback to curated static data for HCM with proper 2024 names
        return {"districts": [
            {"code": "760", "name": "Quận 1"},
            {"code": "769", "name": "Quận 2"},
            {"code": "770", "name": "Quận 3"},
            {"code": "773", "name": "Quận 4"},
            {"code": "774", "name": "Quận 5"},
            {"code": "775", "name": "Quận 6"},
            {"code": "778", "name": "Quận 7"},
            {"code": "776", "name": "Quận 8"},
            {"code": "763", "name": "Quận 9"},
            {"code": "771", "name": "Quận 10"},
            {"code": "772", "name": "Quận 11"},
            {"code": "761", "name": "Quận 12"},
            {"code": "762", "name": "Thành phố Thủ Đức"},
            {"code": "764", "name": "Quận Gò Vấp"},
            {"code": "765", "name": "Quận Bình Thạnh"},
            {"code": "766", "name": "Quận Tân Bình"},
            {"code": "767", "name": "Quận Tân Phú"},
            {"code": "768", "name": "Quận Phú Nhuận"},
            {"code": "777", "name": "Quận Bình Tân"},
            {"code": "783", "name": "Huyện Củ Chi"},
            {"code": "784", "name": "Huyện Hóc Môn"},
            {"code": "785", "name": "Huyện Bình Chánh"},
            {"code": "786", "name": "Huyện Nhà Bè"},
            {"code": "787", "name": "Huyện Cần Giờ"}
        ]}


@router.get("/wards", summary="Get List of Wards for a District")
async def get_wards(district_code: str):
    """
    Get list of wards (phường/xã/thị trấn) for a specific district.
    Uses esgoo.net API for up-to-date data (2024-2025).
    
    - **district_code**: District code from /districts endpoint (required)
    
    Returns array of ward names.
    """
    try:
        # Check cache first
        if district_code in _cache['wards']:
            return _cache['wards'][district_code]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BASE_API_URL}/3/{district_code}.htm")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("error") == 0 and data.get("data"):
                    # Extract wards from the response
                    wards = [w["full_name"] for w in data["data"]]
                    
                    # Cache the result
                    result = {"wards": wards}
                    _cache['wards'][district_code] = result
                    return result
            
            raise Exception("API returned error or no data")
                
    except Exception as e:
        print(f"Error fetching wards from API: {str(e)}, using fallback data")
        # Fallback to generic wards
        return {"wards": [f"Phường {i:02d}" for i in range(1, 16)]}
