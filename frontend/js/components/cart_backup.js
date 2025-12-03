// ========== CART COMPONENT ==========
import * as ui from '../utils/ui.js';
import { state, addToCart as stateAddToCart, updateCartQuantity, removeFromCart as stateRemoveFromCart } from '../utils/state.js';

export function showAddToCart(productId, productName, price, category, defaultSugar = '0') {
    const isFood = category === 'food';
    
    const sizeModal = document.createElement('div');
    sizeModal.className = 'modal active';
    sizeModal.style.zIndex = '2000';
    sizeModal.id = 'sizeModal';
    sizeModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">${productName}</div>
            
            ${!isFood ? `
            <div class="form-group">
                <label>Size:</label>
                <select id="sizeSelect" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;" onchange="window.updateModalPrice()">
                    <option value="">Choose size...</option>
                    <option value="S">Small (-₫10,000)</option>
                    <option value="M" selected>Medium (Standard)</option>
                    <option value="L">Large (+₫10,000)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Milk Options (+₫5,000 each):</label>
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="milkNut" value="nut" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Sữa hạt (+₫5,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="milkCondensed" value="condensed" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Sữa đặc (+₫5,000)</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label>Sugar Level:</label>
                <select id="sugarSelect" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
                    <option value="0" ${defaultSugar === '0' ? 'selected' : ''}>0% (No sugar)</option>
                    <option value="25" ${defaultSugar === '25' ? 'selected' : ''}>25%</option>
                    <option value="50" ${defaultSugar === '50' ? 'selected' : ''}>50%</option>
                    <option value="75" ${defaultSugar === '75' ? 'selected' : ''}>75%</option>
                    <option value="100" ${defaultSugar === '100' ? 'selected' : ''}>100%</option>
                    <option value="125" ${defaultSugar === '125' ? 'selected' : ''}>125%</option>
                    <option value="150" ${defaultSugar === '150' ? 'selected' : ''}>150%</option>
                </select>
            </div>
            ` : `
            <div class="form-group">
                <label>Toppings:</label>
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingButter" value="butter" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Bơ (+₫5,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingJam" value="jam" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Mứt (+₫5,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingCream" value="cream" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Cream cheese (+₫10,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingNutella" value="nutella" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Nutella (+₫10,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingSauce" value="sauce" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Sốt caramel/chocolate (+₫5,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingAlmond" value="almond" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Hạnh nhân lát (+₫5,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingWhipped" value="whipped" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Whipped cream (+₫10,000)</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="toppingFruit" value="fruit" style="width:18px; height:18px;" onchange="window.updateModalPrice()">
                        <span>Trái cây tươi (+₫10,000)</span>
                    </label>
                </div>
            </div>
            `}
            
            <div class="form-group" style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: bold; font-size: 16px; margin: 0;">Final Price:</label>
                    <span id="modalFinalPrice" style="font-size: 20px; font-weight: bold; color: #c41e3a;">${ui.formatCurrency(price)}</span>
                </div>
            </div>
            
            <div class="modal-buttons">
                <button type="button" class="btn-submit" onclick="window.addToCartFromModal('${productId}', '${productName}', ${price}, ${isFood}, '${defaultSugar}')">Add to Cart</button>
                <button type="button" class="btn-cancel" onclick="window.closeSizeModal()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(sizeModal);
    
    // Store base price for calculation
    sizeModal.dataset.basePrice = price;
}

export function closeSizeModal() {
    const modal = document.getElementById('sizeModal');
    if (modal) modal.remove();
}

export function updateModalPrice() {
    const modal = document.getElementById('sizeModal');
    if (!modal) return;
    
    const basePrice = parseFloat(modal.dataset.basePrice);
    const size = document.getElementById('sizeSelect')?.value;
    const milkNut = document.getElementById('milkNut')?.checked;
    const milkCondensed = document.getElementById('milkCondensed')?.checked;
    
    let finalPrice = basePrice;
    
    // Size adjustment: ±10,000đ (only for non-food)
    if (size === 'S') finalPrice -= 10000;
    else if (size === 'L') finalPrice += 10000;
    
    // Milk extras: +5,000đ each (for drinks)
    if (milkNut) finalPrice += 5000;
    if (milkCondensed) finalPrice += 5000;
    
    // Topping extras for food items
    // 5,000đ toppings
    if (document.getElementById('toppingButter')?.checked) finalPrice += 5000;
    if (document.getElementById('toppingJam')?.checked) finalPrice += 5000;
    if (document.getElementById('toppingSauce')?.checked) finalPrice += 5000;
    if (document.getElementById('toppingAlmond')?.checked) finalPrice += 5000;
    
    // 10,000đ toppings
    if (document.getElementById('toppingCream')?.checked) finalPrice += 10000;
    if (document.getElementById('toppingNutella')?.checked) finalPrice += 10000;
    if (document.getElementById('toppingWhipped')?.checked) finalPrice += 10000;
    if (document.getElementById('toppingFruit')?.checked) finalPrice += 10000;
    
    const priceEl = document.getElementById('modalFinalPrice');
    if (priceEl) {
        priceEl.textContent = ui.formatCurrency(finalPrice);
    }
}

export function addToCartFromModal(productId, productName, price, isFood, defaultSugar = '0') {
    let size = document.getElementById('sizeSelect')?.value;
    
    // For food items, size is not required (no size selection)
    if (!isFood && !size) {
        alert('Please select a size');
        return;
    }
    
    // Default size for food items
    if (isFood && !size) {
        size = 'M';
    }
    
    let milks = [];
    let toppings = [];
    let sugar = defaultSugar;
    
    if (!isFood) {
        // Drinks: collect milk options and sugar
        if (document.getElementById('milkNut')?.checked) milks.push('nut');
        if (document.getElementById('milkCondensed')?.checked) milks.push('condensed');
        sugar = document.getElementById('sugarSelect')?.value || defaultSugar;
    } else {
        // Food: collect toppings
        if (document.getElementById('toppingButter')?.checked) toppings.push('butter');
        if (document.getElementById('toppingJam')?.checked) toppings.push('jam');
        if (document.getElementById('toppingCream')?.checked) toppings.push('cream');
        if (document.getElementById('toppingNutella')?.checked) toppings.push('nutella');
        if (document.getElementById('toppingSauce')?.checked) toppings.push('sauce');
        if (document.getElementById('toppingAlmond')?.checked) toppings.push('almond');
        if (document.getElementById('toppingWhipped')?.checked) toppings.push('whipped');
        if (document.getElementById('toppingFruit')?.checked) toppings.push('fruit');
    }
    
    addToCart(productId, productName, price, size, milks, sugar, defaultSugar, toppings);
    closeSizeModal();
}

export function addToCart(productId, productName, basePrice, size, milks = [], sugar = '0', defaultSugar = '0', toppings = []) {
    if (!size) return;
    
    // Calculate final price with size modifier: ±10,000đ (only for drinks)
    let finalPrice = basePrice;
    if (size === 'S') finalPrice = basePrice - 10000;
    else if (size === 'L') finalPrice = basePrice + 10000;
    
    // Add milk extras (+5,000 each)
    const milkCount = Array.isArray(milks) ? milks.length : 0;
    finalPrice += (milkCount * 5000);
    
    // Add topping extras for food items
    if (Array.isArray(toppings)) {
        toppings.forEach(topping => {
            // 5,000đ toppings
            if (['butter', 'jam', 'sauce', 'almond'].includes(topping)) {
                finalPrice += 5000;
            }
            // 10,000đ toppings
            else if (['cream', 'nutella', 'whipped', 'fruit'].includes(topping)) {
                finalPrice += 10000;
            }
        });
    }
    
    const sortedMilks = Array.isArray(milks) ? milks.sort() : [];
    const sortedToppings = Array.isArray(toppings) ? toppings.sort() : [];
    const milkKey = sortedMilks.join(',');
    const toppingKey = sortedToppings.join(',');

    const existingItem = state.cart.find(item => {
        const itemMilks = Array.isArray(item.milks) ? item.milks.sort() : [];
        const itemToppings = Array.isArray(item.toppings) ? item.toppings.sort() : [];
        const itemMilkKey = itemMilks.join(',');
        const itemToppingKey = itemToppings.join(',');
        return item.id === productId && 
            item.size === size && 
            itemMilkKey === milkKey && 
            itemToppingKey === toppingKey &&
            item.sugar === sugar;
    });

    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({ 
            id: productId, 
            name: productName, 
            price: finalPrice,  // Store final price with all extras
            size, 
            milks: sortedMilks, 
            toppings: sortedToppings,
            sugar, 
            defaultSugar,  // Store default sugar for display logic
            quantity: 1 
        });
    }

    updateCartUI();
}

export function updateCartUI() {
    const cartDiv = document.getElementById('cartItems');
    const summaryDiv = document.getElementById('cartSummary');

    if (!cartDiv) return;

    if (state.cart.length === 0) {
        cartDiv.innerHTML = '<div class="cart-empty">Cart is empty</div>';
        if (summaryDiv) summaryDiv.style.display = 'none';
        return;
    }

    cartDiv.innerHTML = state.cart.map(item => {
        const milks = Array.isArray(item.milks) ? item.milks : [];
        const toppings = Array.isArray(item.toppings) ? item.toppings : [];
        // item.price already includes size modifier and milk extras
        const itemPrice = item.price * item.quantity;
        
        let customizations = `Size: ${item.size}`;
        
        // Show milk options for drinks
        if (milks.length > 0) {
            const milkNames = { 'nut': 'Sữa hạt', 'condensed': 'Sữa đặc' };
            const milkLabels = milks.map(m => milkNames[m]).join(', ');
            customizations += ` | ${milkLabels}`;
        }
        
        // Show topping options for food
        if (toppings.length > 0) {
            const toppingNames = { 
                'butter': 'Bơ', 
                'jam': 'Mứt', 
                'cream': 'Cream cheese', 
                'nutella': 'Nutella',
                'sauce': 'Sốt', 
                'almond': 'Hạnh nhân', 
                'whipped': 'Kem tươi', 
                'fruit': 'Trái cây tươi'
            };
            const toppingLabels = toppings.map(t => toppingNames[t]).join(', ');
            customizations += ` | ${toppingLabels}`;
        }
        
        // Only show sugar if different from default
        if (item.sugar && item.sugar !== (item.defaultSugar || '0')) {
            customizations += ` | Sugar: ${item.sugar}%`;
        }
        
        const milksKey = milks.join(',');
        const toppingsKey = toppings.join(',');
        
        return `
            <div class="cart-item">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">${customizations}</div>
                <div class="cart-item-price">${ui.formatCurrency(itemPrice)}</div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick='window.changeQty("${item.id}", "${item.size}", "${milksKey}", "${toppingsKey}", "${item.sugar || '0'}", -1)'>-</button>
                    <span style="padding:4px; flex:1; text-align:center;">${item.quantity}</span>
                    <button class="qty-btn" onclick='window.changeQty("${item.id}", "${item.size}", "${milksKey}", "${toppingsKey}", "${item.sugar || '0'}", 1)'>+</button>
                    <button class="remove-btn" onclick='window.removeFromCart("${item.id}", "${item.size}", "${milksKey}", "${toppingsKey}", "${item.sugar || '0'}")'>Remove</button>
                </div>
            </div>
        `;
    }).join('');

    updateCartTotal();
    if (summaryDiv) summaryDiv.style.display = 'block';
}

export function updateCartTotal() {
    let subtotal = 0;
    state.cart.forEach(item => {
        // item.price already includes size modifier and milk extras
        subtotal += item.price * item.quantity;
    });

    const discount = subtotal * (state.discountPercent / 100);
    const total = subtotal - discount;

    const subtotalEl = document.getElementById('subtotal');
    const totalPriceEl = document.getElementById('totalPrice');
    const discountRowEl = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');

    if (subtotalEl) subtotalEl.textContent = ui.formatCurrency(subtotal);
    if (totalPriceEl) totalPriceEl.textContent = ui.formatCurrency(Math.round(total));

    if (discount > 0) {
        if (discountRowEl) discountRowEl.style.display = 'flex';
        if (discountAmountEl) discountAmountEl.textContent = `-${ui.formatCurrency(Math.round(discount))}`;
    } else {
        if (discountRowEl) discountRowEl.style.display = 'none';
    }

    // Update modal summary too
    const modalSubtotalEl = document.getElementById('modalSubtotal');
    const modalTotalEl = document.getElementById('modalTotal');
    const modalDiscountRowEl = document.getElementById('modalDiscountRow');
    const modalDiscountAmountEl = document.getElementById('modalDiscountAmount');

    if (modalSubtotalEl) modalSubtotalEl.textContent = ui.formatCurrency(subtotal);
    if (modalTotalEl) modalTotalEl.textContent = ui.formatCurrency(Math.round(total));

    if (discount > 0) {
        if (modalDiscountRowEl) modalDiscountRowEl.style.display = 'flex';
        if (modalDiscountAmountEl) modalDiscountAmountEl.textContent = `-${ui.formatCurrency(Math.round(discount))}`;
    } else {
        if (modalDiscountRowEl) modalDiscountRowEl.style.display = 'none';
    }
}

export function changeQty(productId, size, milksKey, toppingsKey, sugar, change) {
    const item = state.cart.find(i => {
        const itemMilks = Array.isArray(i.milks) ? i.milks.sort().join(',') : '';
        const itemToppings = Array.isArray(i.toppings) ? i.toppings.sort().join(',') : '';
        return i.id === productId && 
            i.size === size && 
            itemMilks === milksKey && 
            itemToppings === toppingsKey &&
            i.sugar === sugar;
    });
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId, size, milksKey, toppingsKey, sugar);
        } else {
            updateCartUI();
        }
    }
}

export function removeFromCart(productId, size, milksKey, toppingsKey, sugar) {
    state.cart = state.cart.filter(item => {
        const itemMilks = Array.isArray(item.milks) ? item.milks.sort().join(',') : '';
        const itemToppings = Array.isArray(item.toppings) ? item.toppings.sort().join(',') : '';
        return !(
            item.id === productId && 
            item.size === size && 
            itemMilks === milksKey && 
            itemToppings === toppingsKey &&
            item.sugar === sugar
        );
    });
    updateCartUI();
}

export function openCheckoutModal() {
    if (state.cart.length === 0) {
        ui.showError('Your cart is empty!');
        return;
    }

    // Pre-fill user information
    const user = state.currentUser;
    if (user) {
        const nameField = document.getElementById('customerName');
        const emailField = document.getElementById('customerEmail');
        const phoneField = document.getElementById('customerPhone');
        
        if (nameField) nameField.value = user.name || '';
        if (emailField) emailField.value = user.email || '';
        if (phoneField && user.phone) phoneField.value = user.phone;
    }

    // Load districts
    loadDistricts();

    // Display order items summary
    displayCheckoutItems();

    // Calculate totals with extras included
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * (state.discountPercent / 100);
    const total = subtotal - discount;

    document.getElementById('checkoutSubtotal').textContent = ui.formatCurrency(subtotal);
    document.getElementById('checkoutDiscount').textContent = `-${ui.formatCurrency(Math.round(discount))}`;
    document.getElementById('checkoutTotal').textContent = ui.formatCurrency(Math.round(total));

    ui.openModal('checkoutModal');
}

// Display order items in checkout modal
function displayCheckoutItems() {
    const itemsList = document.getElementById('checkoutItemsList');
    if (!itemsList) return;

    itemsList.innerHTML = state.cart.map(item => {
        const details = [];
        if (item.size) details.push(`Size: ${item.size}`);
        if (item.sugar) details.push(`Sugar: ${item.sugar}`);
        if (item.milks && item.milks.length > 0) details.push(`Milk: ${item.milks.join(', ')}`);
        if (item.toppings && item.toppings.length > 0) {
            const toppingNames = { 
                'butter': 'Bơ', 
                'jam': 'Mứt', 
                'cream': 'Cream cheese', 
                'nutella': 'Nutella',
                'sauce': 'Sốt', 
                'almond': 'Hạnh nhân', 
                'whipped': 'Kem tươi', 
                'fruit': 'Trái cây tươi'
            };
            const toppingLabels = item.toppings.map(t => toppingNames[t] || t).join(', ');
            details.push(`Toppings: ${toppingLabels}`);
        }
        
        const detailsText = details.length > 0 ? `<br><span style="font-size:12px; color:#666;">${details.join(' | ')}</span>` : '';
        
        return `
            <div style="padding:8px 0; border-bottom:1px solid #eee;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="flex:1;">
                        <strong>${item.name}</strong> x${item.quantity}
                        ${detailsText}
                    </div>
                    <div style="color:#006241; font-weight:bold; white-space:nowrap; margin-left:10px;">
                        ${ui.formatCurrency(item.price * item.quantity)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function closeCheckoutModal() {
    ui.closeModal('checkoutModal');
}

export async function processCheckout(event) {
    event.preventDefault();

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const deliveryDistrict = document.getElementById('deliveryDistrict').value.trim();
    const deliveryWard = document.getElementById('deliveryWard').value.trim();
    const deliveryStreet = document.getElementById('deliveryStreet').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('orderNotes').value.trim();

    if (!customerName || !customerPhone || !customerEmail || !deliveryDistrict || !deliveryWard || !deliveryStreet || !paymentMethod) {
        ui.showError('Please fill in all required fields!');
        return;
    }

    if (state.cart.length === 0) {
        ui.showError('Your cart is empty!');
        return;
    }

    const orderData = {
        user_id: String(state.currentUser.id),
        items: state.cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            size: item.size,
            sugar: item.sugar,
            milks: item.milks || [],
            toppings: item.toppings || [],
            price: item.price  // Changed from unit_price to price
        })),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        delivery_district: deliveryDistrict,
        delivery_ward: deliveryWard,
        delivery_street: deliveryStreet,
        payment_method: paymentMethod,
        promo_code: state.promoApplied || '',
        special_notes: notes
    };

    const result = await import('../utils/api.js').then(api => api.placeOrder(orderData));

    if (result.ok) {
        const orderId = result.data.order_id;
        const total = result.data.total;
        
        closeCheckoutModal();
        
        // For balance payment, send OTP
        if (paymentMethod === 'balance') {
            ui.showSuccess('Order created! Sending payment OTP to your email...');
            
            // Send OTP
            const api = await import('../utils/api.js');
            const otpResult = await api.sendPaymentOTP(state.currentUser.id, orderId, total);
            
            if (otpResult.ok) {
                // Show OTP modal
                showPaymentOTPModal(orderId, total);
            } else {
                ui.showError(otpResult.data.detail || 'Failed to send OTP');
            }
        } else {
            // Cash on delivery - just show success
            ui.showSuccess(`Order placed successfully! Order ID: ${orderId}`);
            
            // Clear cart
            state.cart = [];
            state.promoApplied = null;
            state.discountPercent = 0;
            
            updateCartUI();
            
            // Switch to order status view
            const { switchView } = await import('./navigation.js');
            switchView('orderStatus');
        }
    } else {
        ui.showError(result.data.detail || 'Failed to place order');
    }
}

// Load districts into dropdown
async function loadDistricts() {
    try {
        const api = await import('../utils/api.js');
        const result = await api.getDistricts('HCM');
        
        if (result.ok && result.data.districts) {
            const select = document.getElementById('deliveryDistrict');
            select.innerHTML = '<option value="">Choose district...</option>';
            
            result.data.districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load districts:', error);
    }
}

// Load wards based on selected district
window.loadWards = async function() {
    const districtSelect = document.getElementById('deliveryDistrict');
    const wardSelect = document.getElementById('deliveryWard');
    const district = districtSelect.value;
    
    wardSelect.innerHTML = '<option value="">Choose ward...</option>';
    
    if (!district) return;
    
    try {
        const api = await import('../utils/api.js');
        const result = await api.getWards(district);
        
        if (result.ok && result.data.wards) {
            result.data.wards.forEach(ward => {
                const option = document.createElement('option');
                option.value = ward;
                option.textContent = ward;
                wardSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load wards:', error);
    }
}

// Show payment OTP modal
function showPaymentOTPModal(orderId, amount) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '3000';
    modal.id = 'paymentOTPModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">🔐 Payment Confirmation</div>
            <div style="padding: 20px;">
                <p style="color: #666; margin-bottom: 15px;">
                    Enter the 6-digit OTP code sent to your email to confirm payment of <strong style="color: #006241;">${ui.formatCurrency(amount)}</strong>
                </p>
                <div class="form-group">
                    <label>OTP Code *</label>
                    <input type="text" id="paymentOTPInput" maxlength="6" placeholder="Enter 6-digit code" 
                        style="width:100%; padding:12px; font-size:24px; text-align:center; letter-spacing:5px; border:2px solid #ddd; border-radius:8px;">
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 10px;">
                    OTP expires in 10 minutes. Check your spam folder if you don't see it.
                </p>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-submit" onclick="window.verifyPaymentOTP('${orderId}', ${amount})">
                    Verify & Pay
                </button>
                <button type="button" class="btn-cancel" onclick="window.closePaymentOTPModal()">
                    Cancel
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('paymentOTPInput')?.focus();
    }, 100);
}

// Verify payment OTP
window.verifyPaymentOTP = async function(orderId, amount) {
    const otpInput = document.getElementById('paymentOTPInput');
    const otpCode = otpInput?.value.trim();
    
    if (!otpCode || otpCode.length !== 6) {
        ui.showError('Please enter a valid 6-digit OTP code');
        return;
    }
    
    const api = await import('../utils/api.js');
    const result = await api.verifyPaymentOTP(state.currentUser.id, orderId, otpCode);
    
    if (result.ok) {
        ui.showSuccess(`Payment successful! Order ID: ${orderId}`);
        
        // Update user balance in state
        if (result.data.new_balance !== undefined) {
            state.currentUser.balance = result.data.new_balance;
        }
        
        // Clear cart
        state.cart = [];
        state.promoApplied = null;
        state.discountPercent = 0;
        
        closePaymentOTPModal();
        updateCartUI();
        
        // Switch to order status view
        const { switchView } = await import('./navigation.js');
        switchView('orderStatus');
    } else {
        ui.showError(result.data.detail || 'OTP verification failed');
    }
}

// Close payment OTP modal
window.closePaymentOTPModal = function() {
    const modal = document.getElementById('paymentOTPModal');
    if (modal) modal.remove();
}

