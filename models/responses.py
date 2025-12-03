"""
Response models for API documentation
"""
from pydantic import BaseModel
from typing import List, Optional, Any


class StatusResponse(BaseModel):
    """Generic success response"""
    status: str
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Operation completed successfully"
            }
        }


class OTPSentResponse(BaseModel):
    """Response when OTP is sent"""
    status: str
    message: str
    email: str
    note: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "OTP sent to email",
                "email": "user@example.com",
                "note": "For demo: OTP is shown in console logs"
            }
        }


class UserResponse(BaseModel):
    """User information response"""
    user_id: str
    email: str
    name: str
    username: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "email": "user@example.com",
                "name": "John Doe",
                "username": "johndoe",
                "phone": "0123456789"
            }
        }


class UserDetailResponse(BaseModel):
    """Detailed user information with balance"""
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    balance: float
    username: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "email": "user@example.com",
                "name": "John Doe",
                "phone": "0123456789",
                "balance": 500000.0,
                "username": "johndoe"
            }
        }


class BalanceResponse(BaseModel):
    """User balance response"""
    balance: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "balance": 500000.0
            }
        }


class PromoValidationResponse(BaseModel):
    """Promo code validation result"""
    valid: bool
    discount_percent: Optional[float] = None
    message: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "discount_percent": 20.0,
                "message": "Promo code applied successfully"
            }
        }


class CheckoutResponse(BaseModel):
    """Order creation response"""
    status: str
    order_id: str
    total_amount: float
    final_amount: float
    payment_method: str
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "order_id": "ORD20231203001",
                "total_amount": 75000.0,
                "final_amount": 60000.0,
                "payment_method": "balance",
                "message": "Order placed successfully"
            }
        }


class OrderItem(BaseModel):
    """Order item details"""
    id: str
    name: str
    price: float
    quantity: int
    size: str
    milks: List[str]
    sugar: str


class Order(BaseModel):
    """Order details"""
    id: str
    order_id: str
    user_id: str
    items: List[OrderItem]
    total_amount: float
    final_amount: float
    payment_method: str
    status: str
    created_at: str
    customer_name: str
    customer_phone: str
    customer_email: str
    delivery_address: Optional[str] = None
    special_notes: Optional[str] = None
    promo_code: Optional[str] = None


class OrderHistoryResponse(BaseModel):
    """User's order history"""
    orders: List[Order]
    
    class Config:
        json_schema_extra = {
            "example": {
                "orders": [
                    {
                        "id": "1",
                        "order_id": "ORD20231203001",
                        "user_id": "1",
                        "items": [
                            {
                                "id": "cf_1",
                                "name": "Espresso",
                                "price": 25000,
                                "quantity": 2,
                                "size": "L",
                                "milks": ["nut"],
                                "sugar": "75"
                            }
                        ],
                        "total_amount": 75000.0,
                        "final_amount": 60000.0,
                        "payment_method": "balance",
                        "status": "pending",
                        "created_at": "2023-12-03T10:30:00",
                        "customer_name": "John Doe",
                        "customer_phone": "0123456789",
                        "customer_email": "john@example.com",
                        "delivery_address": "Quận 1, Phường Bến Nghé, 123 Nguyễn Huệ",
                        "special_notes": "Less sugar",
                        "promo_code": "COFFEE20"
                    }
                ]
            }
        }


class PaymentOTPResponse(BaseModel):
    """Payment OTP sent response"""
    status: str
    message: str
    note: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Payment OTP sent to email",
                "note": "For demo: OTP is shown in console logs"
            }
        }


class PaymentVerificationResponse(BaseModel):
    """Payment verification result"""
    status: str
    message: str
    order_id: str
    new_balance: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Payment successful",
                "order_id": "ORD20231203001",
                "new_balance": 440000.0
            }
        }


class Product(BaseModel):
    """Product details"""
    id: str
    name: str
    category: str
    price: float
    icon: str


class MenuResponse(BaseModel):
    """Menu items list"""
    items: List[Product]
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "id": "cf_1",
                        "name": "Espresso",
                        "category": "coffee",
                        "price": 25000,
                        "icon": "☕"
                    }
                ]
            }
        }


class SearchResponse(BaseModel):
    """Search results"""
    items: List[Product]
    count: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "id": "cf_1",
                        "name": "Espresso",
                        "category": "coffee",
                        "price": 25000,
                        "icon": "☕"
                    }
                ],
                "count": 1
            }
        }


class FavoriteProduct(BaseModel):
    """Favorite product with details"""
    id: str
    name: str
    category: str
    price: float
    icon: str


class FavoritesResponse(BaseModel):
    """User's favorite products"""
    favorites: List[FavoriteProduct]
    
    class Config:
        json_schema_extra = {
            "example": {
                "favorites": [
                    {
                        "id": "cf_1",
                        "name": "Espresso",
                        "category": "coffee",
                        "price": 25000,
                        "icon": "☕"
                    }
                ]
            }
        }


class CartItemResponse(BaseModel):
    """Cart item details"""
    product_id: str
    quantity: int
    size: str
    sugar: int
    ice: int
    milks: List[str]


class CartResponse(BaseModel):
    """User's shopping cart"""
    items: List[CartItemResponse]
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "product_id": "cf_1",
                        "quantity": 2,
                        "size": "L",
                        "sugar": 75,
                        "ice": 100,
                        "milks": ["nut"]
                    }
                ]
            }
        }
