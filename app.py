#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hệ thống Quản lý Quán Cafe - FastAPI Backend
Port: 3000
API Swagger: http://localhost:3000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
import json
from pathlib import Path

# =====================================================
# MODELS - Pydantic
# =====================================================

class OrderItem(BaseModel):
    """Model cho một món trong đơn hàng"""
    menu_id: str
    quantity: int


class PaymentRequest(BaseModel):
    """Model cho yêu cầu thanh toán"""
    method: str  # 'cash' hoặc 'bank'


class InventoryItem(BaseModel):
    """Model cho nguyên liệu"""
    name: str
    unit: str
    quantity: float
    status: str
    conversion_rate: int
    purchase_unit: str


class MenuItem(BaseModel):
    """Model cho một món trong menu"""
    id: str
    name: str
    price: int
    recipe: Dict[str, float]
    available: bool


class OrderResponse(BaseModel):
    """Model cho phản hồi đơn hàng"""
    order: List[OrderItem]
    total: int
    available_menu: List[MenuItem]
    inventory_after: Dict[str, float]


# =====================================================
# DATA: Cấu hình Kho Hàng & Menu
# =====================================================

class Ingredient:
    """Lớp đại diện cho một nguyên liệu"""
    def __init__(self, name: str, unit: str, conversion_rate: int, 
                 purchase_unit: str, quantity: float):
        self.name = name
        self.unit = unit
        self.conversion_rate = conversion_rate
        self.purchase_unit = purchase_unit
        self.quantity = quantity
    
    def get_status(self) -> str:
        """Trả về trạng thái tồn kho"""
        if self.quantity <= 0:
            return "red"  # HẾT
        elif self.quantity <= 2:
            return "yellow"  # CẢNH BÁO
        else:
            return "green"  # OK
    
    def to_dict(self):
        return {
            "name": self.name,
            "unit": self.unit,
            "quantity": round(self.quantity, 1),
            "status": self.get_status(),
            "conversion_rate": self.conversion_rate,
            "purchase_unit": self.purchase_unit
        }


class CafePOSBackend:
    """Lớp chính quản lý hệ thống POS"""
    
    def __init__(self):
        # Khởi tạo kho hàng
        self.ingredients: Dict[str, Ingredient] = {
            'boiCafe': Ingredient(
                name='Bột Cafe',
                unit='Shot',
                conversion_rate=50,
                purchase_unit='Gói (1kg)',
                quantity=100.0
            ),
            'suaDac': Ingredient(
                name='Sữa Đặc',
                unit='Phần',
                conversion_rate=12,
                purchase_unit='Lon (380g)',
                quantity=48.0
            ),
            'suaTuoi': Ingredient(
                name='Sữa Tươi',
                unit='Phần',
                conversion_rate=5,
                purchase_unit='Hộp (1L)',
                quantity=20.0
            ),
        }
        
        # Khởi tạo menu
        self.menu: Dict[str, Dict] = {
            'coffee_black': {
                'name': 'Cà phê Đen',
                'price': 25000,
                'recipe': {'boiCafe': 2},
                'description': 'Cafe - 2 shot'
            },
            'coffee_milk': {
                'name': 'Cà phê Sữa',
                'price': 30000,
                'recipe': {'boiCafe': 1, 'suaDac': 1},
                'description': 'Cafe - 1 shot, Sữa Đặc - 1 phần'
            },
            'bac_xiu': {
                'name': 'Bạc Xỉu',
                'price': 28000,
                'recipe': {'boiCafe': 0.5, 'suaDac': 1.5},
                'description': 'Cafe - 0.5 shot, Sữa Đặc - 1.5 phần'
            },
            'latte': {
                'name': 'Latte',
                'price': 35000,
                'recipe': {'boiCafe': 1, 'suaTuoi': 1},
                'description': 'Cafe - 1 shot, Sữa Tươi - 1 phần'
            },
        }
        
        # Đơn hàng hiện tại
        self.current_order: List[Tuple[str, int]] = []
        
        # Thống kê
        self.statistics = {
            'orders_today': 0,
            'revenue_today': 0
        }
    
    # =====================================================
    # LOGIC: Kiểm tra kho
    # =====================================================
    
    def can_make_item(self, menu_id: str, quantity: int = 1, 
                      simulated_inventory: Dict[str, float] = None) -> Tuple[bool, List[str]]:
        """Kiểm tra xem có thể làm được món này không"""
        if menu_id not in self.menu:
            return False, [f"Không tìm thấy món: {menu_id}"]
        
        menu_item = self.menu[menu_id]
        errors = []
        
        inventory = simulated_inventory if simulated_inventory else {
            ing_id: ing.quantity for ing_id, ing in self.ingredients.items()
        }
        
        for ingredient_id, required_amount in menu_item['recipe'].items():
            total_needed = required_amount * quantity
            available = inventory.get(ingredient_id, 0)
            
            if available < total_needed:
                ingredient = self.ingredients[ingredient_id]
                errors.append(
                    f"{ingredient.name}: cần {total_needed} {ingredient.unit}, "
                    f"còn {available} {ingredient.unit}"
                )
        
        return len(errors) == 0, errors
    
    def get_available_menu(self, simulated: bool = False) -> Dict[str, Dict]:
        """Lấy danh sách menu chỉ những món đủ nguyên liệu"""
        available = {}
        
        if simulated:
            inventory = self.simulate_inventory()
        else:
            inventory = {ing_id: ing.quantity for ing_id, ing in self.ingredients.items()}
        
        for menu_id, menu_item in self.menu.items():
            can_make, _ = self.can_make_item(menu_id, 1, inventory)
            if can_make:
                available[menu_id] = menu_item.copy()
                available[menu_id]['available'] = True
            else:
                available[menu_id] = menu_item.copy()
                available[menu_id]['available'] = False
        
        return available
    
    # =====================================================
    # LOGIC: Ước tính nguyên liệu
    # =====================================================
    
    def simulate_inventory(self) -> Dict[str, float]:
        """Ước tính kho hàng sau khi hoàn tất đơn hàng hiện tại"""
        simulated = {ing_id: ing.quantity for ing_id, ing in self.ingredients.items()}
        
        for menu_id, quantity in self.current_order:
            menu_item = self.menu[menu_id]
            for ingredient_id, amount_per_item in menu_item['recipe'].items():
                simulated[ingredient_id] -= amount_per_item * quantity
        
        return simulated
    
    # =====================================================
    # LOGIC: Quản lý đơn hàng
    # =====================================================
    
    def add_to_order(self, menu_id: str) -> Tuple[bool, str]:
        """Thêm 1 món vào đơn"""
        if menu_id not in self.menu:
            return False, f"Không tìm thấy món: {menu_id}"
        
        simulated = self.simulate_inventory()
        can_make, errors = self.can_make_item(menu_id, 1, simulated)
        
        if not can_make:
            return False, f"Không đủ nguyên liệu: {', '.join(errors)}"
        
        for i, (item_id, qty) in enumerate(self.current_order):
            if item_id == menu_id:
                self.current_order[i] = (menu_id, qty + 1)
                return True, f"Đã cập nhật {self.menu[menu_id]['name']}: {qty + 1} ly"
        
        self.current_order.append((menu_id, 1))
        return True, f"Đã thêm {self.menu[menu_id]['name']}: 1 ly"
    
    def remove_from_order(self, menu_id: str) -> Tuple[bool, str]:
        """Xóa một mục khỏi đơn hàng"""
        for i, (item_id, qty) in enumerate(self.current_order):
            if item_id == menu_id:
                del self.current_order[i]
                return True, f"Đã xóa {self.menu[menu_id]['name']}"
        
        return False, "Không tìm thấy món trong đơn"
    
    def get_order_total(self) -> int:
        """Tính tổng tiền đơn hàng"""
        total = 0
        for menu_id, quantity in self.current_order:
            total += self.menu[menu_id]['price'] * quantity
        return total
    
    def clear_order(self):
        """Xóa toàn bộ đơn hàng"""
        self.current_order = []
    
    # =====================================================
    # LOGIC: Thanh toán
    # =====================================================
    
    def deduct_inventory(self):
        """Trừ kho sau khi thanh toán"""
        for menu_id, quantity in self.current_order:
            menu_item = self.menu[menu_id]
            for ingredient_id, amount_per_item in menu_item['recipe'].items():
                self.ingredients[ingredient_id].quantity -= amount_per_item * quantity
    
    def process_payment(self, method: str) -> Tuple[bool, str]:
        """Xử lý thanh toán"""
        if not self.current_order:
            return False, "Đơn hàng trống"
        
        if method not in ['cash', 'bank']:
            return False, "Phương thức thanh toán không hợp lệ"
        
        total = self.get_order_total()
        
        # Trừ kho
        self.deduct_inventory()
        
        # Cập nhật thống kê
        self.statistics['orders_today'] += 1
        self.statistics['revenue_today'] += total
        
        # Xóa đơn
        self.current_order = []
        
        method_text = "Tiền mặt" if method == 'cash' else "Chuyển khoản"
        return True, f"Thanh toán {method_text} thành công. Tổng: {total:,} VNĐ"
    
    # =====================================================
    # API RESPONSE METHODS
    # =====================================================
    
    def get_menu_response(self, simulated: bool = False) -> List[MenuItem]:
        """Tạo response cho menu"""
        menu = self.get_available_menu(simulated)
        result = []
        
        for menu_id, item in menu.items():
            result.append(MenuItem(
                id=menu_id,
                name=item['name'],
                price=item['price'],
                recipe=item['recipe'],
                available=item['available']
            ))
        
        return result
    
    def get_inventory_response(self) -> Dict[str, InventoryItem]:
        """Tạo response cho kho hàng"""
        result = {}
        for ing_id, ingredient in self.ingredients.items():
            result[ing_id] = InventoryItem(**ingredient.to_dict())
        return result
    
    def get_order_response(self) -> OrderResponse:
        """Tạo response cho đơn hàng"""
        simulated_inventory = self.simulate_inventory()
        
        return OrderResponse(
            order=[OrderItem(menu_id=m_id, quantity=qty) 
                   for m_id, qty in self.current_order],
            total=self.get_order_total(),
            available_menu=self.get_menu_response(simulated=True),
            inventory_after=simulated_inventory
        )


# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="Cafe POS System API",
    description="Hệ thống Quản lý Quán Cafe - Backend API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend instance
backend = CafePOSBackend()


# =====================================================
# SERVE FRONTEND
# =====================================================

@app.get("/", include_in_schema=False)
async def serve_root():
    """Serve frontend HTML"""
    from fastapi.responses import FileResponse
    try:
        return FileResponse("frontend.html", media_type="text/html")
    except:
        return {"error": "frontend.html not found"}


# =====================================================
# API ENDPOINTS
# =====================================================

@app.get("/api/health", tags=["Health"])
def health_check():
    """Kiểm tra trạng thái server"""
    return {"status": "ok", "message": "Server is running"}


@app.get("/api/menu", response_model=List[MenuItem], tags=["Menu"])
def get_menu(simulated: bool = False):
    """
    Lấy danh sách menu
    
    - **simulated**: Nếu True, trả về menu dựa trên ước tính kho sau đơn hiện tại
    """
    return backend.get_menu_response(simulated=simulated)


@app.get("/api/inventory", tags=["Inventory"])
def get_inventory():
    """Lấy tồn kho hiện tại"""
    return backend.get_inventory_response()


@app.get("/api/order", response_model=OrderResponse, tags=["Order"])
def get_current_order():
    """Lấy thông tin đơn hàng hiện tại"""
    return backend.get_order_response()


@app.post("/api/order/add", tags=["Order"])
def add_to_order(menu_id: str):
    """
    Thêm một món vào đơn hàng
    
    - **menu_id**: ID của món (ví dụ: coffee_black)
    """
    success, message = backend.add_to_order(menu_id)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "success": True,
        "message": message,
        "order": backend.get_order_response()
    }


@app.post("/api/order/remove", tags=["Order"])
def remove_from_order(menu_id: str):
    """
    Xóa một món khỏi đơn hàng
    
    - **menu_id**: ID của món (ví dụ: coffee_black)
    """
    success, message = backend.remove_from_order(menu_id)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "success": True,
        "message": message,
        "order": backend.get_order_response()
    }


@app.post("/api/order/clear", tags=["Order"])
def clear_order():
    """Hủy toàn bộ đơn hàng"""
    backend.clear_order()
    
    return {
        "success": True,
        "message": "Đã hủy đơn hàng",
        "order": backend.get_order_response()
    }


@app.post("/api/payment", tags=["Payment"])
def process_payment(request: PaymentRequest):
    """
    Xử lý thanh toán
    
    - **method**: 'cash' (Tiền mặt) hoặc 'bank' (Chuyển khoản)
    """
    success, message = backend.process_payment(request.method)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "success": True,
        "message": message,
        "inventory": backend.get_inventory_response(),
        "statistics": backend.statistics
    }


@app.get("/api/statistics", tags=["Statistics"])
def get_statistics():
    """Lấy thống kê hôm nay"""
    return backend.statistics


@app.post("/api/restock", tags=["Restock"])
def restock_ingredient(ingredient_id: str, quantity: int):
    """
    Nhập hàng
    
    - **ingredient_id**: ID nguyên liệu (boiCafe, suaDac, suaTuoi)
    - **quantity**: Số lượng cần nhập (theo đơn vị nhập)
    """
    if ingredient_id not in backend.ingredients:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguyên liệu")
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Số lượng phải > 0")
    
    ingredient = backend.ingredients[ingredient_id]
    added_quantity = quantity * ingredient.conversion_rate
    ingredient.quantity += added_quantity
    
    return {
        "success": True,
        "message": f"Đã nhập {quantity} {ingredient.purchase_unit} = {added_quantity} {ingredient.unit}",
        "inventory": backend.get_inventory_response()
    }


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=3000)
