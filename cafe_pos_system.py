#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hệ thống Quản lý Quán Cafe - POS System
Phiên bản Python - Test Step-by-Step
"""

import os
from decimal import Decimal
from typing import Dict, List, Tuple

# =====================================================
# DỮNG LIỆU: Cấu hình Kho Hàng
# =====================================================

class Ingredient:
    """Lớp đại diện cho một nguyên liệu"""
    def __init__(self, name: str, unit: str, conversion_rate: int, 
                 purchase_unit: str, quantity: float):
        self.name = name
        self.unit = unit  # Đơn vị quản lý (Shot, Phần, v.v.)
        self.conversion_rate = conversion_rate  # 1 lần nhập = ? đơn vị quản lý
        self.purchase_unit = purchase_unit  # Đơn vị nhập (Gói, Lon, Hộp)
        self.quantity = quantity  # Số lượng hiện tại (đơn vị quản lý)
    
    def __str__(self):
        status = self._get_status()
        return f"{self.name}: {self.quantity:.1f} {self.unit} {status}"
    
    def _get_status(self) -> str:
        """Trả về trạng thái tồn kho"""
        if self.quantity <= 0:
            return "🔴 HẾT"
        elif self.quantity <= 2:
            return "🟡 CẢNH BÁO"
        else:
            return "🟢 OK"


class MenuItem:
    """Lớp đại diện cho một món trong menu"""
    def __init__(self, id: str, name: str, price: int, recipe: Dict[str, float]):
        self.id = id
        self.name = name
        self.price = price  # Giá bán (VNĐ)
        self.recipe = recipe  # {'boiCafe': 2, 'suaDac': 1}
    
    def __str__(self):
        ingredients_str = ", ".join([
            f"{amount} {ing}" 
            for ing, amount in self.recipe.items()
        ])
        return f"{self.name} - {self.price:,} VNĐ ({ingredients_str})"


class CafePOSSystem:
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
        self.menu: Dict[str, MenuItem] = {
            'coffee_black': MenuItem(
                id='coffee_black',
                name='Cà phê Đen',
                price=25000,
                recipe={'boiCafe': 2}
            ),
            'coffee_milk': MenuItem(
                id='coffee_milk',
                name='Cà phê Sữa',
                price=30000,
                recipe={'boiCafe': 1, 'suaDac': 1}
            ),
            'bac_xiu': MenuItem(
                id='bac_xiu',
                name='Bạc Xỉu',
                price=28000,
                recipe={'boiCafe': 0.5, 'suaDac': 1.5}
            ),
            'latte': MenuItem(
                id='latte',
                name='Latte',
                price=35000,
                recipe={'boiCafe': 1, 'suaTuoi': 1}
            ),
        }
        
        # Đơn hàng hiện tại
        self.current_order: List[Tuple[str, int]] = []  # [(menu_id, quantity), ...]
    
    # =====================================================
    # LOGIC: Kiểm tra kho
    # =====================================================
    
    def can_make_item(self, menu_id: str, quantity: int = 1, 
                      simulated_inventory: Dict[str, float] = None) -> Tuple[bool, List[str]]:
        """
        Kiểm tra xem có thể làm được món này không
        
        Args:
            menu_id: ID của món
            quantity: Số lượng cần làm
            simulated_inventory: Kho giả định (để test ước tính)
        
        Returns:
            (có_thể_làm, danh_sách_lỗi)
        """
        if menu_id not in self.menu:
            return False, [f"Không tìm thấy món: {menu_id}"]
        
        menu_item = self.menu[menu_id]
        errors = []
        
        # Sử dụng kho giả định nếu có, không thì dùng kho thực
        inventory = simulated_inventory if simulated_inventory else {
            ing_id: ing.quantity for ing_id, ing in self.ingredients.items()
        }
        
        for ingredient_id, required_amount in menu_item.recipe.items():
            total_needed = required_amount * quantity
            available = inventory.get(ingredient_id, 0)
            
            if available < total_needed:
                ingredient = self.ingredients[ingredient_id]
                errors.append(
                    f"❌ {ingredient.name}: cần {total_needed} {ingredient.unit}, "
                    f"còn {available} {ingredient.unit}"
                )
        
        return len(errors) == 0, errors
    
    def get_available_menu(self) -> Dict[str, MenuItem]:
        """
        Lấy danh sách menu chỉ những món đủ nguyên liệu
        """
        available = {}
        for menu_id, menu_item in self.menu.items():
            can_make, _ = self.can_make_item(menu_id)
            if can_make:
                available[menu_id] = menu_item
        return available
    
    # =====================================================
    # LOGIC: Ước tính nguyên liệu
    # =====================================================
    
    def simulate_inventory(self) -> Dict[str, float]:
        """
        Ước tính kho hàng sau khi hoàn tất đơn hàng hiện tại
        """
        simulated = {ing_id: ing.quantity for ing_id, ing in self.ingredients.items()}
        
        for menu_id, quantity in self.current_order:
            menu_item = self.menu[menu_id]
            for ingredient_id, amount_per_item in menu_item.recipe.items():
                simulated[ingredient_id] -= amount_per_item * quantity
        
        return simulated
    
    def get_available_menu_after_order(self) -> Dict[str, MenuItem]:
        """
        Lấy danh sách menu đủ nguyên liệu sau đơn hàng hiện tại
        """
        simulated = self.simulate_inventory()
        available = {}
        
        for menu_id, menu_item in self.menu.items():
            can_make, _ = self.can_make_item(menu_id, 1, simulated)
            if can_make:
                available[menu_id] = menu_item
        
        return available
    
    # =====================================================
    # LOGIC: Quản lý đơn hàng
    # =====================================================
    
    def add_to_order(self, menu_id: str) -> Tuple[bool, str]:
        """
        Thêm 1 món vào đơn (tăng quantity nếu đã có)
        """
        # Kiểm tra xem menu có tồn tại không
        if menu_id not in self.menu:
            return False, f"❌ Không tìm thấy món: {menu_id}"
        
        # Kiểm tra xem có thể làm được không (với đơn hiện tại)
        simulated = self.simulate_inventory()
        can_make, errors = self.can_make_item(menu_id, 1, simulated)
        
        if not can_make:
            return False, f"❌ Không đủ nguyên liệu:\n" + "\n".join(errors)
        
        # Tìm xem đã có trong đơn chưa
        for i, (item_id, qty) in enumerate(self.current_order):
            if item_id == menu_id:
                self.current_order[i] = (menu_id, qty + 1)
                return True, f"✓ Đã cập nhật {self.menu[menu_id].name}: {qty + 1} ly"
        
        # Nếu chưa có thì thêm mới
        self.current_order.append((menu_id, 1))
        return True, f"✓ Đã thêm {self.menu[menu_id].name}: 1 ly"
    
    def remove_from_order(self, menu_id: str) -> Tuple[bool, str]:
        """
        Xóa một mục khỏi đơn hàng
        """
        for i, (item_id, qty) in enumerate(self.current_order):
            if item_id == menu_id:
                del self.current_order[i]
                return True, f"✓ Đã xóa {self.menu[menu_id].name}"
        
        return False, "❌ Không tìm thấy món trong đơn"
    
    def get_order_total(self) -> int:
        """Tính tổng tiền đơn hàng"""
        total = 0
        for menu_id, quantity in self.current_order:
            total += self.menu[menu_id].price * quantity
        return total
    
    def clear_order(self) -> str:
        """Xóa toàn bộ đơn hàng"""
        self.current_order = []
        return "✓ Đã hủy đơn hàng"
    
    # =====================================================
    # LOGIC: Thanh toán
    # =====================================================
    
    def deduct_inventory(self) -> bool:
        """
        Trừ kho sau khi thanh toán
        """
        for menu_id, quantity in self.current_order:
            menu_item = self.menu[menu_id]
            for ingredient_id, amount_per_item in menu_item.recipe.items():
                self.ingredients[ingredient_id].quantity -= amount_per_item * quantity
        
        return True
    
    def process_payment(self, method: str) -> Tuple[bool, str]:
        """
        Xử lý thanh toán
        
        Args:
            method: 'cash' hoặc 'bank'
        
        Returns:
            (thành_công, thông_báo)
        """
        if not self.current_order:
            return False, "❌ Đơn hàng trống"
        
        if method not in ['cash', 'bank']:
            return False, "❌ Phương thức thanh toán không hợp lệ"
        
        # Trừ kho
        self.deduct_inventory()
        
        # Xóa đơn
        self.current_order = []
        
        method_text = "Tiền mặt" if method == 'cash' else "Chuyển khoản"
        return True, f"✓ Thanh toán {method_text} thành công"
    
    # =====================================================
    # DISPLAY FUNCTIONS
    # =====================================================
    
    def print_separator(self, title: str = ""):
        """In dòng phân cách"""
        if title:
            print(f"\n{'='*60}")
            print(f"  {title.center(56)}")
            print(f"{'='*60}")
        else:
            print(f"{'-'*60}")
    
    def display_inventory(self):
        """Hiển thị tồn kho"""
        self.print_separator("📊 TỒN KHO HIỆN TẠI")
        for ing in self.ingredients.values():
            print(f"  {ing}")
    
    def display_available_menu(self, simulated: bool = False):
        """Hiển thị menu có sẵn"""
        if simulated:
            available = self.get_available_menu_after_order()
            self.print_separator(f"🍽️  MENU CÒN ĐỦ NGUYÊN LIỆU (Dự tính sau {len(self.current_order)} ly đã order)")
        else:
            available = self.get_available_menu()
            self.print_separator("🍽️  MENU CÓ SẴN")
        
        if not available:
            print("  ❌ Không có món nào có sẵn")
            return
        
        for i, (menu_id, menu_item) in enumerate(available.items(), 1):
            print(f"  {i}. [{menu_item.id}] {menu_item.name} - {menu_item.price:,} VNĐ")
            for ingredient, amount in menu_item.recipe.items():
                ing = self.ingredients[ingredient]
                print(f"     └─ {amount} {ing.unit} {ing.name}")
    
    def display_current_order(self):
        """Hiển thị đơn hàng hiện tại"""
        self.print_separator("🛒 ĐƠN HÀNG HIỆN TẠI")
        
        if not self.current_order:
            print("  (Trống)")
            return
        
        total = 0
        for menu_id, quantity in self.current_order:
            menu_item = self.menu[menu_id]
            subtotal = menu_item.price * quantity
            total += subtotal
            print(f"  • {menu_item.name} x{quantity} = {subtotal:,} VNĐ")
        
        print(f"\n  {'Tổng cộng:':.<40} {total:,} VNĐ")
    
    def display_simulated_inventory(self):
        """Hiển thị ước tính kho sau đơn hàng"""
        simulated = self.simulate_inventory()
        self.print_separator("📈 ƯỚC TÍNH KHO SAU ĐƠN")
        
        for ingredient_id, quantity in simulated.items():
            ing = self.ingredients[ingredient_id]
            
            # Tính trạng thái
            if quantity <= 0:
                status = "🔴 HẾT"
            elif quantity <= 2:
                status = "🟡 CẢNH BÁO"
            else:
                status = "🟢 OK"
            
            print(f"  {ing.name}: {quantity:.1f} {ing.unit} {status}")


# =====================================================
# MAIN: INTERACTIVE DEMO
# =====================================================

def main():
    """Hàm chính - Demo từng bước"""
    
    system = CafePOSSystem()
    
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + "  ☕ HỆ THỐNG QUẢN LÝ QUÁN CAFE - POS SYSTEM".center(58) + "║")
    print("║" + "  Python Demo - Test Từng Bước Một".center(58) + "║")
    print("╚" + "="*58 + "╝")
    
    # Bước 1: Hiển thị kho ban đầu
    system.display_inventory()
    
    # Bước 2: Hiển thị menu có sẵn
    system.display_available_menu()
    
    while True:
        print("\n")
        print("📋 LỆNH KHÁC NHAU:")
        print("  [+] <menu_id>  : Thêm 1 ly vào đơn (VD: + coffee_black)")
        print("  [-] <menu_id>  : Xóa món khỏi đơn (VD: - coffee_black)")
        print("  [c]            : Xem đơn hàng")
        print("  [s]            : Xem ước tính kho sau đơn")
        print("  [i]            : Xem tồn kho")
        print("  [m]            : Xem menu")
        print("  [p]            : Thanh toán")
        print("  [q]            : Thoát")
        
        command = input("\n➤ Nhập lệnh: ").strip()
        
        if command == 'q':
            print("\n✓ Tạm biệt! Cảm ơn đã sử dụng hệ thống.")
            break
        
        elif command == 'c':
            system.display_current_order()
        
        elif command == 's':
            if system.current_order:
                system.display_simulated_inventory()
                print("\n  📌 Sau khi hoàn tất đơn, các món nào còn đủ nguyên liệu?")
                system.display_available_menu(simulated=True)
            else:
                print("\n  ℹ️  Chưa có món nào trong đơn")
        
        elif command == 'i':
            system.display_inventory()
        
        elif command == 'm':
            system.display_available_menu()
        
        elif command == 'p':
            if not system.current_order:
                print("\n❌ Đơn hàng trống, không thể thanh toán")
                continue
            
            system.display_current_order()
            
            print("\n💳 CHỌN PHƯƠNG THỨC THANH TOÁN:")
            print("  [1] Tiền mặt (Cash)")
            print("  [2] Chuyển khoản (Bank Transfer)")
            
            method_input = input("\n➤ Chọn (1/2): ").strip()
            
            if method_input == '1':
                success, msg = system.process_payment('cash')
            elif method_input == '2':
                success, msg = system.process_payment('bank')
            else:
                print("❌ Lựa chọn không hợp lệ")
                continue
            
            if success:
                print(f"\n{msg}")
                system.display_inventory()
                system.display_available_menu()
            else:
                print(f"\n{msg}")
        
        elif command.startswith('+'):
            menu_id = command[1:].strip()
            success, msg = system.add_to_order(menu_id)
            print(f"\n{msg}")
            
            if success:
                system.display_current_order()
                if system.current_order:
                    print("\n  📈 Các món còn đủ nguyên liệu sau đơn này:")
                    system.display_available_menu(simulated=True)
        
        elif command.startswith('-'):
            menu_id = command[1:].strip()
            success, msg = system.remove_from_order(menu_id)
            print(f"\n{msg}")
            
            if success:
                system.display_current_order()
        
        else:
            print("❌ Lệnh không hợp lệ")


if __name__ == '__main__':
    main()
