// ========== CART COMPONENT V2 - Advanced Customization ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state, addToCart as stateAddToCart } from '../utils/state.js';

// Cache for customization options
let customizationCache = null;

// ========== SHOW ADD TO CART MODAL ==========
export async function showAddToCart(productId) {
    // Fetch product details with customization options
    const result = await api.apiCall(`/menu/product/${productId}`);
    if (!result.ok) {
        alert('Failed to load product details');
        return;
    }
    
    const { product, customization } = result.data;
    
    // Cache customization options if not already cached
    if (!customizationCache) {
        const optionsResult = await api.apiCall('/menu/options/all');
        if (optionsResult.ok) {
            customizationCache = optionsResult.data;
        }
    }
    
    showCustomizationModal(product, customization);
}

function showCustomizationModal(product, customization) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '2000';
    modal.id = 'customizationModal';
    
    const isFood = product.category === 'food';
    const isCoffee = product.category === 'coffee';
    const isVNCoffee = isCoffee && product.type === 'vietnamese';
    
    let modalContent = `
        <div class="modal-content" style="max-inline-size: 600px; max-block-size: 90vh; overflow-y: auto;">
            <button class="modal-close" onclick="window.closeSizeModal()" aria-label="Close">×</button>
            <div class="modal-header">
                <span>${product.icon} ${product.name}</span>
                <span style="color: #c41e3a; font-size: 18px;">${ui.formatCurrency(product.price)}</span>
            </div>
            <input type="hidden" id="modalProductId" value="${product.id}">
            <input type="hidden" id="modalProductName" value="${product.name}">
            <input type="hidden" id="modalBasePrice" value="${product.price}">
            <input type="hidden" id="modalCategory" value="${product.category}">
    `;
    
    // Size selection (for beverages only)
    if (customization.hasSize) {
        modalContent += `
            <div class="form-group">
                <label><strong>📏 Size:</strong></label>
                <div class="size-options" style="display: flex; gap: 10px; margin-block-start: 8px;">
                    ${Object.entries(customization.sizes).map(([key, data]) => `
                        <label class="option-card ${key === 'M' ? 'selected' : ''}" style="flex: 1; cursor: pointer; padding: 12px; border: 2px solid #ddd; border-radius: 8px; text-align: center; transition: all 0.3s;">
                            <input type="radio" name="size" value="${key}" ${key === 'M' ? 'checked' : ''} 
                                   data-price="${data.priceModifier}" onchange="window.updateModalPrice()" style="display: none;">
                            <div style="font-weight: bold; font-size: 16px;">${key}</div>
                            <div style="font-size: 12px; color: #666;">${data.name}</div>
                            ${data.priceModifier !== 0 ? `<div style="color: #c41e3a; font-size: 13px; font-weight: 600;">${data.priceModifier > 0 ? '+' : ''}${ui.formatCurrency(data.priceModifier)}</div>` : '<div style="font-size: 12px; color: #999;">Base</div>'}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Milk options (for coffee)
    if (isCoffee && Object.keys(customization.milkOptions).length > 0) {
        modalContent += `
            <div class="form-group">
                <label><strong>🥛 Milk Options:</strong> <span style="font-size: 12px; color: #666;">(Optional) Choose up to 1 milk. Condensed milk can be added anytime.</span></label>
                <div class="milk-options" style="display: flex; flex-direction: column; gap: 8px; margin-block-start: 8px;">
                    ${Object.entries(customization.milkOptions).map(([key, data]) => `
                        <label class="checkbox-option ${data.default ? 'selected' : ''}" style="cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 10px; border: 2px solid #ddd; border-radius: 8px; transition: all 0.3s;" data-milk-key="${key}">
                            <input type="checkbox" class="milk-checkbox" value="${key}" ${data.default ? 'checked' : ''}
                                   data-price="${data.price}">
                            <span style="flex: 1;">${data.name}</span>
                            ${data.price > 0 ? `<span style="color: #c41e3a; font-weight: 600;">+${ui.formatCurrency(data.price)}</span>` : ''}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Sugar level (if applicable)
    if (customization.hasSugar) {
        const defaultSugar = product.defaultSugar || '0';
        modalContent += `
            <div class="form-group">
                <label><strong>🍬 Sugar Level:</strong></label>
                <select id="sugarSelect" class="form-select" style="inline-size:100%; padding:12px; border:2px solid #ddd; border-radius:8px; margin-block-start:8px; font-size: 14px;">
                    <option value="0" ${defaultSugar === '0' ? 'selected' : ''}>0% (No Sugar)</option>
                    <option value="25" ${defaultSugar === '25' ? 'selected' : ''}>25%</option>
                    <option value="50" ${defaultSugar === '50' ? 'selected' : ''}>50%</option>
                    <option value="75" ${defaultSugar === '75' ? 'selected' : ''}>75%</option>
                    <option value="100" ${defaultSugar === '100' ? 'selected' : ''}>100%</option>
                    <option value="125" ${defaultSugar === '125' ? 'selected' : ''}>125% (Extra Sweet)</option>
                    <option value="150" ${defaultSugar === '150' ? 'selected' : ''}>150% (Very Sweet)</option>
                </select>
            </div>
        `;
    }
    
    // Upsells (for coffee/tea)
    if (Object.keys(customization.upsells).length > 0) {
        const upsellTitle = isCoffee ? '✨ Add Coffee Toppings' : '✨ Add Tea Toppings';
        modalContent += `
            <div class="form-group">
                <label><strong>${upsellTitle}:</strong></label>
                <div class="upsells-options" style="display: flex; flex-direction: column; gap: 6px; margin-block-start: 8px;">
                    ${Object.entries(customization.upsells).map(([key, data]) => `
                        <label class="checkbox-option" style="cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 10px; border: 2px solid #ddd; border-radius: 8px; transition: all 0.3s;">
                            <input type="checkbox" class="upsell-checkbox" value="${key}" data-price="${data.price}" onchange="window.updateModalPrice()">
                            <span style="flex: 1;">${data.name}</span>
                            <span style="color: #c41e3a; font-weight: 600;">+${ui.formatCurrency(data.price)}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Toppings (for food)
    if (Object.keys(customization.toppings).length > 0) {
        modalContent += `
            <div class="form-group">
                <label><strong>🎂 Toppings:</strong></label>
                <div class="toppings-options" style="display: flex; flex-direction: column; gap: 6px; margin-block-start: 8px;">
                    ${Object.entries(customization.toppings).map(([key, data]) => `
                        <label class="checkbox-option" style="cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 10px; border: 2px solid #ddd; border-radius: 8px; transition: all 0.3s;">
                            <input type="checkbox" class="topping-checkbox" value="${key}" data-price="${data.price}" onchange="window.updateModalPrice()">
                            <span style="flex: 1;">${data.name}</span>
                            <span style="color: #c41e3a; font-weight: 600;">+${ui.formatCurrency(data.price)}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Price summary
    modalContent += `
            <div class="form-group" style="margin-block-start: 20px; padding: 15px; background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%); border-radius: 12px; border: 2px solid #c41e3a;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: bold; font-size: 18px; margin: 0; color: #333;">Total:</label>
                    <span id="modalFinalPrice" style="font-size: 24px; font-weight: bold; color: #c41e3a;">${ui.formatCurrency(product.price)}</span>
                </div>
            </div>
            
            <div class="modal-buttons" style="margin-block-start: 20px; display: flex; gap: 10px;">
                <button class="btn-submit" onclick="window.addToCartFromModal()" style="flex: 2; padding: 14px; font-size: 16px;">
                    🛒 Add to Cart
                </button>
                <button class="btn-cancel" onclick="window.closeSizeModal()" style="flex: 1; padding: 14px; font-size: 16px;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Add backdrop click to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSizeModal();
        }
    });
    
    // Add event listeners for option-card selection styling
    addOptionCardListeners();
}

// Add listeners for visual selection feedback
function addOptionCardListeners() {
    // Size option cards
    document.querySelectorAll('.option-card input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
            this.closest('.option-card').classList.add('selected');
        });
    });
    
    // Milk option cards - Rules:
    // - User may choose no milk at all
    // - If choosing regular milk: allow only one at a time (exclusive)
    // - Condensed milk can be added with or without a regular milk
    document.querySelectorAll('.milk-options .milk-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const milkValue = this.value;
            const isCondensed = milkValue === 'condensed' || milkValue === 'condensed_milk';

            // Get current selections AFTER this checkbox has toggled
            const allMilkCbs = Array.from(document.querySelectorAll('.milk-options .milk-checkbox'));
            const checkedCbs = allMilkCbs.filter(cb => cb.checked);
            const checkedRegular = checkedCbs.filter(cb => cb.value !== 'condensed' && cb.value !== 'condensed_milk');
            const condensedCb = allMilkCbs.find(cb => cb.value === 'condensed' || cb.value === 'condensed_milk');

            if (this.checked) {
                // If a regular milk was just selected and there is another regular already, uncheck the others (exclusive selection)
                if (!isCondensed && checkedRegular.length > 1) {
                    checkedRegular
                        .filter(cb => cb !== this)
                        .forEach(cb => {
                            cb.checked = false;
                            cb.closest('.checkbox-option')?.classList.remove('selected');
                        });
                }

                this.closest('.checkbox-option')?.classList.add('selected');
            } else {
                this.closest('.checkbox-option')?.classList.remove('selected');
            }
            updateModalPrice();
        });
    });
    
    // Checkbox options (upsells/toppings)
    document.querySelectorAll('.checkbox-option input[type="checkbox"]:not(.milk-checkbox)').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                this.closest('.checkbox-option').classList.add('selected');
            } else {
                this.closest('.checkbox-option').classList.remove('selected');
            }
        });
    });
}

// ========== UPDATE MODAL PRICE ==========
export function updateModalPrice() {
    const basePrice = parseFloat(document.getElementById('modalBasePrice')?.value || 0);
    let finalPrice = basePrice;
    
    // Size modifier
    const sizeRadio = document.querySelector('input[name="size"]:checked');
    if (sizeRadio) {
        finalPrice += parseFloat(sizeRadio.dataset.price || 0);
    }
    
    // Milk options - can have multiple selected (up to 2)
    document.querySelectorAll('.milk-checkbox:checked').forEach(milkCheckbox => {
        finalPrice += parseFloat(milkCheckbox.dataset.price || 0);
    });
    
    // Upsells
    document.querySelectorAll('.upsell-checkbox:checked').forEach(checkbox => {
        finalPrice += parseFloat(checkbox.dataset.price || 0);
    });
    
    // Toppings
    document.querySelectorAll('.topping-checkbox:checked').forEach(checkbox => {
        finalPrice += parseFloat(checkbox.dataset.price || 0);
    });
    
    // Update display
    const priceEl = document.getElementById('modalFinalPrice');
    if (priceEl) {
        priceEl.textContent = ui.formatCurrency(finalPrice);
    }
}

// ========== ADD TO CART FROM MODAL ==========
export function addToCartFromModal() {
    const productId = document.getElementById('modalProductId')?.value;
    const productName = document.getElementById('modalProductName')?.value;
    const basePrice = parseFloat(document.getElementById('modalBasePrice')?.value || 0);
    const category = document.getElementById('modalCategory')?.value;
    
    if (!productId) return;
    
    // Collect selections
    const size = document.querySelector('input[name="size"]:checked')?.value || 'M';
    const checkedMilkCbs = Array.from(document.querySelectorAll('.milk-checkbox:checked'));
    const regularMilks = checkedMilkCbs.filter(cb => cb.value !== 'condensed' && cb.value !== 'condensed_milk');

    // Enforce only one regular milk
    if (regularMilks.length > 1) {
        alert('Bạn chỉ có thể chọn 1 loại sữa chính.');
        return;
    }

    const milks = checkedMilkCbs.map(cb => cb.value);
    const sugar = document.getElementById('sugarSelect')?.value || '0';
    
    const upsells = Array.from(document.querySelectorAll('.upsell-checkbox:checked')).map(cb => cb.value);
    const toppings = Array.from(document.querySelectorAll('.topping-checkbox:checked')).map(cb => cb.value);
    
    // Calculate final price
    let finalPrice = basePrice;
    const sizeRadio = document.querySelector('input[name="size"]:checked');
    if (sizeRadio) finalPrice += parseFloat(sizeRadio.dataset.price || 0);
    
    document.querySelectorAll('.milk-checkbox:checked').forEach(milkCheckbox => {
        finalPrice += parseFloat(milkCheckbox.dataset.price || 0);
    });
    
    document.querySelectorAll('.upsell-checkbox:checked').forEach(cb => {
        finalPrice += parseFloat(cb.dataset.price || 0);
    });
    
    document.querySelectorAll('.topping-checkbox:checked').forEach(cb => {
        finalPrice += parseFloat(cb.dataset.price || 0);
    });
    
    // Create cart item
    const cartItem = {
        id: productId,
        name: productName,
        price: finalPrice,
        quantity: 1,
        category: category,
        size: size,
        sugar: sugar,
        milks: milks,
        upsells: upsells,
        toppings: toppings
    };
    
    // Add to cart state
    stateAddToCart(cartItem);
    updateCartUI();
    closeSizeModal();
}

// ========== CLOSE MODAL ==========
export function closeSizeModal() {
    const modal = document.getElementById('customizationModal') || document.getElementById('sizeModal');
    if (modal) modal.remove();
}

// ========== UPDATE CART UI ==========
export function updateCartUI() {
    const cartItems = state.cart;
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartSummary = document.getElementById('cartSummary');
    const subtotalEl = document.getElementById('subtotal');
    const totalPriceEl = document.getElementById('totalPrice');
    
    // Update cart count badge
    if (cartCount) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    if (!cartItemsDiv) return;
    
    if (cartItems.length === 0) {
        cartItemsDiv.innerHTML = '<div class="cart-empty">Cart is empty</div>';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    let total = 0;
    cartItemsDiv.innerHTML = cartItems.map((item, index) => {
        total += item.price * item.quantity;
        
        // Build detailed customization display
        let customizations = [];
        
        // Size
        if (item.size) customizations.push(`Size: ${item.size}`);
        
        // Sugar level
        if (item.sugar) customizations.push(`Sugar: ${item.sugar}%`);
        
        // Milk options (show all selected milk types)
        if (item.milks && Array.isArray(item.milks) && item.milks.length > 0) {
            const milkNames = {
                'fresh': 'Fresh Milk',
                'fresh_milk': 'Fresh Milk',
                'condensed': 'Condensed Milk',
                'condensed_milk': 'Condensed Milk',
                'coconut': 'Coconut Milk',
                'coconut_milk': 'Coconut Milk',
                'almond': 'Almond Milk',
                'almond_milk': 'Almond Milk',
                'oat': 'Oat Milk',
                'oat_milk': 'Oat Milk',
                'soy': 'Soy Milk',
                'soy_milk': 'Soy Milk'
            };
            const milkLabels = item.milks.map(m => milkNames[m] || m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
            customizations.push(`Milk: ${milkLabels}`);
        }
        
        // Upsells/extras
        if (item.upsells && Array.isArray(item.upsells) && item.upsells.length > 0) {
            const upsellNames = {
                'extra_shot': 'Extra Shot',
                'whipped_cream': 'Whipped Cream',
                'chocolate_sauce': 'Chocolate Sauce',
                'caramel_sauce': 'Caramel Sauce',
                'vanilla_syrup': 'Vanilla Syrup',
                'caramel_drizzle': 'Caramel Drizzle',
                'chocolate_drizzle': 'Chocolate Drizzle'
            };
            const upsellLabels = item.upsells.map(u => upsellNames[u] || u.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
            customizations.push(`Extras: ${upsellLabels}`);
        }
        
        // Toppings
        if (item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) {
            const toppingNames = {
                'pearl': 'Pearl',
                'jelly': 'Jelly',
                'pudding': 'Pudding',
                'aloe': 'Aloe Vera',
                'grass_jelly': 'Grass Jelly',
                'coconut_jelly': 'Coconut Jelly',
                'tapioca': 'Tapioca',
                'red_bean': 'Red Bean'
            };
            const toppingLabels = item.toppings.map(t => toppingNames[t] || t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
            customizations.push(`Toppings: ${toppingLabels}`);
        }
        
        const customText = customizations.length > 0 ? `<div style="font-size: 11px; color: #999; margin-block-start: 2px;">${customizations.join(' • ')}</div>` : '';
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    ${customText}
                    <div class="cart-item-price">${ui.formatCurrency(item.price)}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-decrease" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-increase" data-index="${index}">+</button>
                    <button class="btn-remove" data-index="${index}">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach event listeners to buttons
    cartItemsDiv.querySelectorAll('.btn-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (!isNaN(index)) {
                changeQty(index, -1);
            }
        });
    });
    
    cartItemsDiv.querySelectorAll('.btn-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (!isNaN(index)) {
                changeQty(index, 1);
            }
        });
    });
    
    cartItemsDiv.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (!isNaN(index)) {
                removeFromCart(index);
            }
        });
    });
    
    // Update cart summary
    if (subtotalEl) subtotalEl.textContent = ui.formatCurrency(total);
    if (totalPriceEl) totalPriceEl.textContent = ui.formatCurrency(total);
    if (cartSummary) cartSummary.style.display = 'block';
}

// ========== CART QUANTITY MANAGEMENT ==========
export function changeQty(index, delta) {
    if (index < 0 || index >= state.cart.length) return;
    
    const item = state.cart[index];
    if (!item) return;
    
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
        // Remove item from cart
        state.cart.splice(index, 1);
    } else {
        // Update quantity
        item.quantity = newQty;
    }
    
    updateCartUI();
}

export function removeFromCart(index) {
    if (index < 0 || index >= state.cart.length) return;
    
    // Remove item at index
    state.cart.splice(index, 1);
    updateCartUI();
}

// ========== CHECKOUT MODAL ==========
export function openCheckoutModal() {
    if (state.cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    // Pre-fill user information
    const user = state.currentUser;
        // Ensure app screen is visible
        const appScreen = document.getElementById('appScreen');
        if (appScreen && appScreen.style.display === 'none') {
            appScreen.style.display = 'block';
        }

        // Ensure checkout modal exists; if missing, inject it
        let checkoutModal = document.getElementById('checkoutModal');
        if (!checkoutModal) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
            <div id="checkoutModal" class="modal">
                <div class="modal-content">
                    <button class="modal-close" onclick="closeCheckoutModal()" aria-label="Close">×</button>
                    <div class="modal-header">🛒 Checkout</div>
                    <form onsubmit="processCheckout(event)">
                        <div class="form-group">
                            <label>Customer Name *</label>
                            <input type="text" id="customerName" required placeholder="Your full name">
                        </div>
                        <div class="form-group">
                            <label>Phone Number *</label>
                            <input type="tel" id="customerPhone" required placeholder="Your phone number">
                        </div>
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" id="customerEmail" required placeholder="Your email">
                        </div>
                        <div class="form-group">
                            <label>District / Quận *</label>
                            <select id="deliveryDistrict" required onchange="loadWards()">
                                <option value="">Choose district...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Ward / Phường *</label>
                            <select id="deliveryWard" required>
                                <option value="">Choose ward...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Street Address *</label>
                            <input type="text" id="deliveryStreet" required placeholder="123 Nguyễn Huệ">
                        </div>
                        <div class="form-group">
                            <label>Payment Method *</label>
                            <select id="paymentMethod" required>
                                <option value="">Choose payment method...</option>
                                <option value="balance">Account Balance</option>
                                <option value="cash">Cash on Delivery</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Special Notes (Optional)</label>
                            <textarea id="specialNotes" rows="3" placeholder="Any special requests? (e.g., less sugar, no ice)"></textarea>
                        </div>
                        <div id="checkoutOrderItems" style="background:#fff; border:1px solid #ddd; border-radius:8px; padding:15px; margin:15px 0; max-block-size:200px; overflow-y:auto;">
                            <h4 style="margin:0 0 10px 0; color:#006241; font-size:16px;">📋 Order Items</h4>
                            <div id="checkoutItemsList"></div>
                        </div>
                        <div id="checkoutSummary" style="background:#f5f5f5; padding:15px; border-radius:8px; margin:15px 0;">
                            <div style="display:flex; justify-content:space-between; margin-block-end:8px;">
                                <span>Subtotal:</span>
                                <span id="checkoutSubtotal">₫0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-block-end:8px;">
                                <span>Discount:</span>
                                <span id="checkoutDiscount">-₫0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:18px; color:#c41e3a; padding-block-start:8px; border-block-start:2px solid #ddd;">
                                <span>Total:</span>
                                <span id="checkoutTotal">₫0</span>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-submit">Place Order</button>
                            <button type="button" class="btn-cancel" onclick="closeCheckoutModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>`;
            document.body.appendChild(wrapper.firstElementChild);
            checkoutModal = document.getElementById('checkoutModal');
        }

        const subtotalEl = document.getElementById('checkoutSubtotal');
        const discountEl = document.getElementById('checkoutDiscount');
        const totalEl = document.getElementById('checkoutTotal');
        const itemsListEl = document.getElementById('checkoutItemsList');
        if (!subtotalEl || !discountEl || !totalEl || !itemsListEl) {
            console.warn('Checkout modal elements missing after injection. Aborting openCheckoutModal.');
            return;
        }

    if (user) {
        const nameField = document.getElementById('customerName');
        const emailField = document.getElementById('customerEmail');
        const phoneField = document.getElementById('customerPhone');
        
        if (nameField) nameField.value = user.name || '';
        if (emailField) emailField.value = user.email || '';
        if (phoneField && user.phone) phoneField.value = user.phone;
    }
    
    // CRITICAL: Reset ALL fields including special notes to ensure no data carries over from previous order
    const districtSelect = document.getElementById('deliveryDistrict');
    const wardSelect = document.getElementById('deliveryWard');
    const streetInput = document.getElementById('deliveryStreet');
    const notesInput = document.getElementById('specialNotes');
    
    if (districtSelect) districtSelect.selectedIndex = 0;
    if (wardSelect) {
        wardSelect.innerHTML = '<option value="">Choose ward...</option>';
        wardSelect.disabled = true;
    }
    if (streetInput) streetInput.value = '';
    // Always clear special notes when opening checkout
    if (notesInput) notesInput.value = '';

    // Load districts
    loadDistricts();

        // Load districts (guarded)
        try {
            loadDistricts();
        } catch (e) {
            console.warn('loadDistricts failed:', e);
        }
    displayCheckoutItems();

    // Calculate totals
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * (state.discountPercent / 100);
    const total = subtotal - discount;

    // Update totals in modal
    subtotalEl.textContent = ui.formatCurrency(subtotal);
    discountEl.textContent = `-${ui.formatCurrency(Math.round(discount))}`;
    totalEl.textContent = ui.formatCurrency(Math.round(total));

    // Open modal and attach backdrop close
    const modal = checkoutModal;
    if (modal) {
        modal.classList.add('active');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCheckoutModal();
            }
        });
    }
}

function displayCheckoutItems() {
    const itemsList = document.getElementById('checkoutItemsList');
    if (!itemsList) return;

    itemsList.innerHTML = state.cart.map(item => {
        const details = [];

        // Sugar level
        if (item.sugar) details.push(`Sugar: ${item.sugar}%`);
        
        // Milk options (show all selected milk types)
        if (item.milks && Array.isArray(item.milks) && item.milks.length > 0) {
            const milkNames = {
                'fresh': 'Fresh Milk',
                'fresh_milk': 'Fresh Milk',
                'condensed': 'Condensed Milk',
                'condensed_milk': 'Condensed Milk',
                'coconut': 'Coconut Milk',
                'coconut_milk': 'Coconut Milk',
                'almond': 'Almond Milk',
                'almond_milk': 'Almond Milk',
                'oat': 'Oat Milk',
                'oat_milk': 'Oat Milk',
                'soy': 'Soy Milk',
                'soy_milk': 'Soy Milk'
            };
            const milkLabels = item.milks.map(m => milkNames[m] || m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
            details.push(`Milk: ${milkLabels}`);
        }
        
        // Upsells/extras
        if (item.upsells && Array.isArray(item.upsells) && item.upsells.length > 0) {
            const upsellNames = {
                'extra_shot': 'Extra Shot',
                'whipped_cream': 'Whipped Cream',
                'chocolate_sauce': 'Chocolate Sauce',
                'caramel_sauce': 'Caramel Sauce',
                'vanilla_syrup': 'Vanilla Syrup',
                'caramel_drizzle': 'Caramel Drizzle',
                'chocolate_drizzle': 'Chocolate Drizzle'
            };
            const upsellLabels = item.upsells.map(u => upsellNames[u] || u.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
            details.push(`Extras: ${upsellLabels}`);
        }
        
        // Toppings
        if (item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) {
            const toppingNames = {
                'pearl': 'Pearl',
                'jelly': 'Jelly',
                'pudding': 'Pudding',
                'aloe': 'Aloe Vera',
                'grass_jelly': 'Grass Jelly',
                'coconut_jelly': 'Coconut Jelly',
                'tapioca': 'Tapioca',
                'red_bean': 'Red Bean'
            };
            const toppingLabels = item.toppings.map(t => toppingNames[t] || t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
            details.push(`Toppings: ${toppingLabels}`);
        }
        
        const detailsText = details.length > 0 ? `<br><span style="font-size:12px; color:#666;">${details.join(' | ')}</span>` : '';
        
        return `
            <div style="padding:8px 0; border-block-end:1px solid #eee;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="flex:1;">
                        <strong>${item.name}</strong> x${item.quantity}
                        ${detailsText}
                    </div>
                    <div style="color:#c41e3a; font-weight:bold; white-space:nowrap; margin-inline-start:10px;">
                        ${ui.formatCurrency(item.price * item.quantity)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('active');
    
    // CRITICAL: Reset ALL fields including special notes to prevent data leakage between orders
    const districtSelect = document.getElementById('deliveryDistrict');
    const wardSelect = document.getElementById('deliveryWard');
    const streetInput = document.getElementById('deliveryStreet');
    const notesInput = document.getElementById('specialNotes');
    
    if (districtSelect) districtSelect.selectedIndex = 0;
    if (wardSelect) {
        wardSelect.innerHTML = '<option value="">Choose ward...</option>';
        wardSelect.selectedIndex = 0;
        wardSelect.disabled = true;
    }
    if (streetInput) streetInput.value = '';
    // Force clear special notes
    if (notesInput) notesInput.value = '';
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
    const notesInputEl = document.getElementById('specialNotes');
    const notes = notesInputEl ? notesInputEl.value.trim() : '';

    if (!customerName || !customerPhone || !customerEmail || !deliveryDistrict || !deliveryWard || !deliveryStreet || !paymentMethod) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    if (state.cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const orderData = {
        user_id: String(state.currentUser.id),
        items: state.cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            size: item.size || 'M',
            sugar: item.sugar || '0',
            milks: item.milk ? [item.milk] : [],
            toppings: [...(item.upsells || []), ...(item.toppings || [])],
            price: item.price
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

    console.log('=== ORDER DATA DEBUG ===');
    console.log('District:', deliveryDistrict, 'Ward:', deliveryWard, 'Street:', deliveryStreet);
    console.log('Full orderData:', JSON.stringify(orderData, null, 2));

    const result = await api.placeOrder(orderData);

    if (result.ok) {
        const orderId = result.data.order_id;
        const total = result.data.total;
        
        closeCheckoutModal();
        
        if (paymentMethod === 'balance') {
            alert('Order created! Sending payment OTP...');
            
            const otpResult = await api.sendPaymentOTP(state.currentUser.id, orderId, total);
            
            if (otpResult.ok) {
                showPaymentOTPModal(orderId, total);
            } else {
                alert(otpResult.data.detail || 'Failed to send OTP');
            }
        } else {
            alert(`Order placed successfully! Order ID: ${orderId}`);
            // Clear cart and reset state
            state.cart = [];
            state.promoApplied = null;
            state.discountPercent = 0;
            updateCartUI();
            
            // CRITICAL: Force clear special notes after successful order
            const notesField = document.getElementById('specialNotes');
            if (notesField) {
                notesField.value = '';
                console.log('Special notes cleared after COD order');
            }
            
            const { switchView } = await import('./navigation.js');
            switchView('orderStatus');
        }
    } else {
        alert(result.data.detail || 'Đặt hàng thất bại');
    }
}

async function loadDistricts() {
    try {
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

window.loadWards = async function() {
    const districtSelect = document.getElementById('deliveryDistrict');
    const wardSelect = document.getElementById('deliveryWard');
    const district = districtSelect.value;
    
    wardSelect.innerHTML = '<option value="">Choose ward...</option>';
    wardSelect.disabled = false;
    
    if (!district) {
        wardSelect.disabled = true;
        return;
    }
    
    try {
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

function showPaymentOTPModal(orderId, amount) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '3000';
    modal.id = 'paymentOTPModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-inline-size: 450px;">
            <div class="modal-header">🔐 Payment Confirmation</div>
            <div style="padding: 20px;">
                <p style="color: #666; margin-block-end: 15px;">
                    Enter the 6-digit OTP sent to your email to confirm payment of <strong style="color: #c41e3a;">${ui.formatCurrency(amount)}</strong>
                </p>
                <div class="form-group">
                    <label>OTP Code *</label>
                    <input type="text" id="paymentOTPInput" maxlength="6" placeholder="Enter 6 digits" 
                        style="inline-size:100%; padding:12px; font-size:24px; text-align:center; letter-spacing:5px; border:2px solid #ddd; border-radius:8px;">
                </div>
                <p style="color: #999; font-size: 12px; margin-block-start: 10px;">
                    OTP expires in 10 minutes. Check spam folder if you don't see the email.
                </p>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-submit" onclick="window.verifyPaymentOTP('${orderId}', ${amount})">
                    Confirm & Pay
                </button>
                <button type="button" class="btn-cancel" onclick="window.closePaymentOTPModal()">
                    Cancel
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => {
        document.getElementById('paymentOTPInput')?.focus();
    }, 100);
}

window.verifyPaymentOTP = async function(orderId, amount) {
    const otpInput = document.getElementById('paymentOTPInput');
    const otpCode = otpInput?.value.trim();
    
    if (!otpCode || otpCode.length !== 6) {
        alert('Vui lòng nhập đúng 6 số OTP');
        return;
    }
    
    console.log('Verifying payment OTP:', { user_id: state.currentUser.id, order_id: orderId, otp_code: otpCode });
    
    const result = await api.verifyPaymentOTP(state.currentUser.id, orderId, otpCode);
    
    console.log('Verify payment OTP result:', result);
    
    if (result.ok) {
        alert(`Payment successful! Order ID: ${orderId}`);
        
        if (result.data.new_balance !== undefined) {
            state.currentUser.balance = result.data.new_balance;
        }
        
        // Clear cart and reset state
        state.cart = [];
        state.promoApplied = null;
        state.discountPercent = 0;
        
        // CRITICAL: Force clear special notes after successful payment
        const notesField = document.getElementById('specialNotes');
        if (notesField) {
            notesField.value = '';
            console.log('Special notes cleared after balance payment');
        }
        
        closePaymentOTPModal();
        updateCartUI();
        
        const { switchView } = await import('./navigation.js');
        switchView('orderStatus');
    } else {
        const errorMsg = result.data?.detail || result.data?.message || 'Xác thực OTP thất bại';
        console.error('Payment OTP verification failed:', errorMsg, result);
        alert(`Lỗi: ${errorMsg}`);
    }
}

window.closePaymentOTPModal = function() {
    const modal = document.getElementById('paymentOTPModal');
    if (modal) modal.remove();
}
