"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional


class OTPRequest(BaseModel):
    email: str
    username: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe"
            }
        }


class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    full_name: str
    phone: Optional[str] = None  # Optional
    username: Optional[str] = None  # Optional for backward compatibility
    password: str = None  # Optional - for registration
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp_code": "123456",
                "full_name": "John Doe",
                "phone": "0123456789",
                "username": "johndoe",
                "password": "password123"
            }
        }


class LoginRequest(BaseModel):
    identifier: Optional[str] = None  # Email or username (new)
    email: Optional[str] = None  # Backward compatibility (old)
    password: str
    
    @model_validator(mode='after')
    def check_identifier_or_email(self):
        # If identifier is not provided, use email for backward compatibility
        if not self.identifier and self.email:
            self.identifier = self.email
        if not self.identifier:
            raise ValueError('Either identifier or email must be provided')
        return self
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "johndoe",  # or "user@example.com"
                "password": "password123"
            }
        }


class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp_code": "123456",
                "new_password": "newpassword123"
            }
        }


class CheckoutRequest(BaseModel):
    user_id: str
    items: List[dict]
    customer_name: str
    customer_phone: str
    customer_email: str
    payment_method: str
    delivery_district: Optional[str] = ""
    delivery_ward: Optional[str] = ""
    delivery_street: Optional[str] = ""
    special_notes: Optional[str] = ""
    promo_code: Optional[str] = ""
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "items": [
                    {
                        "id": "cf_1",
                        "name": "Espresso",
                        "price": 25000,
                        "quantity": 2,
                        "size": "L",
                        "milks": ["nut", "condensed"],
                        "sugar": "75"
                    }
                ],
                "customer_name": "John Doe",
                "customer_phone": "0123456789",
                "customer_email": "john@example.com",
                "payment_method": "balance",
                "delivery_district": "Quận 1",
                "delivery_ward": "Phường Bến Nghé",
                "delivery_street": "123 Nguyễn Huệ",
                "special_notes": "Less sugar",
                "promo_code": "COFFEE20"
            }
        }


class PromoCodeRequest(BaseModel):
    code: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "COFFEE20"
            }
        }


class FavoriteRequest(BaseModel):
    user_id: str
    product_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "product_id": "cf_1"
            }
        }


class PaymentOTPRequest(BaseModel):
    user_id: str
    order_id: str
    amount: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "order_id": "ORD12345",
                "amount": 50000
            }
        }


class VerifyPaymentOTPRequest(BaseModel):
    user_id: str
    order_id: str
    otp_code: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "order_id": "ORD12345",
                "otp_code": "123456"
            }
        }


class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    size: str = "M"
    milks: Optional[List[str]] = []
    sugar: Optional[str] = "100"
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "cf_1",
                "name": "Espresso",
                "price": 25000,
                "quantity": 2,
                "size": "L",
                "milks": ["nut"],
                "sugar": "75"
            }
        }


class AddToCartRequest(BaseModel):
    user_id: str
    item: CartItem


class ChangeEmailRequest(BaseModel):
    user_id: str
    new_email: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "new_email": "newemail@example.com",
                "password": "password123"
            }
        }


class ChangePhoneRequest(BaseModel):
    user_id: str
    new_phone: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "new_phone": "0987654321",
                "password": "password123"
            }
        }


class ChangeUsernameRequest(BaseModel):
    user_id: str
    new_username: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "new_username": "newusername",
                "password": "password123"
            }
        }


class ChangePasswordRequest(BaseModel):
    user_id: str
    current_password: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "current_password": "oldpassword123",
                "new_password": "newpassword123"
            }
        }


class OrderActionRequest(BaseModel):
    user_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1"
            }
        }
