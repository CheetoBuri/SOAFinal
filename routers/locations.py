"""
Vietnam locations API: Districts and Wards
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/locations", tags=["📍 Locations"])

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
def get_districts(city: str = "HCM"):
    """
    Get list of districts for a city.
    
    - **city**: City code (HCM or HN). Default is HCM (Ho Chi Minh City)
    
    Returns array of district names.
    """
    districts = DISTRICTS.get(city.upper(), DISTRICTS["HCM"])
    return {"districts": districts}


@router.get("/wards", summary="Get List of Wards for a District")
def get_wards(district: str):
    """
    Get list of wards (phường) for a specific district.
    
    - **district**: District name (required)
    
    Returns array of ward names.
    """
    wards = WARDS.get(district, [])
    if not wards:
        # Return default wards if district not found
        return {"wards": [f"Phường {i:02d}" for i in range(1, 16)]}
    return {"wards": wards}
