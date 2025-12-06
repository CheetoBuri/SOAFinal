// ========== ORDERS COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state } from '../utils/state.js';
import { loadFrequentItems } from './menu.js';

export async function loadOrderHistory() {
    const result = await api.getOrderHistory(state.currentUser.id);
    const ordersList = document.getElementById('ordersList');
    
    if (!ordersList) return;

    if (result.ok && result.data.orders && result.data.orders.length > 0) {
        ordersList.innerHTML = result.data.orders.map(formatOrderCard).join('');
    } else {
        ordersList.innerHTML = '<p style="color:#999;">No orders yet. Start shopping!</p>';
    }
}

export async function loadOrderStatus() {
    const result = await api.getOrderHistory(state.currentUser.id);
    const ordersList = document.getElementById('orderStatusList');
    
    if (!ordersList) return;

    if (result.ok && result.data.orders) {
        // Show all active orders including pending_payment (COD orders)
        const activeOrders = result.data.orders.filter(order => 
            order.status === 'pending_payment' || 
            order.status === 'paid' ||
            order.status === 'confirmed' || 
            order.status === 'preparing' || 
            order.status === 'delivering' ||
            order.status === 'in_transit'
        );

        if (activeOrders.length > 0) {
            ordersList.innerHTML = activeOrders.map(formatActiveOrderCard).join('');
        } else {
            ordersList.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">No active orders</p>';
        }
    } else {
        ordersList.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">No active orders</p>';
    }
}

export async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    // Show loading spinner
    const cancelBtn = document.querySelector(`button[onclick*="${orderId}"][onclick*="cancelOrder"]`);
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.innerHTML = '<span class="spinner"></span> Cancelling...';
        cancelBtn.style.opacity = '0.7';
    }

    const result = await api.cancelOrder(orderId, state.currentUser.id);
    
    if (result.ok) {
        // Show refund message only if refund was processed
        const refundAmount = result.data.refund_amount || 0;
        if (refundAmount > 0) {
            ui.showSuccess(`Order cancelled! ${ui.formatCurrency(refundAmount)} refunded to your balance.`);
            
            // Update balance in sidebar
            if (state.currentUser) {
                const balanceResult = await api.apiCall(`/user/balance?user_id=${state.currentUser.id}`);
                if (balanceResult.ok) {
                    state.currentUser.balance = balanceResult.data.balance;
                    const balanceEl = document.getElementById('userBalance');
                    if (balanceEl) balanceEl.textContent = ui.formatCurrency(balanceResult.data.balance);
                }
            }
        } else {
            // COD or unpaid orders - just cancelled, no refund
            ui.showSuccess('Order cancelled!');
        }
        
        loadOrderStatus();
    } else {
        const errorMsg = result.data?.detail || result.data?.message || (typeof result.data === 'string' ? result.data : 'Failed to cancel order');
        ui.showError(errorMsg);
        
        // Restore button if error
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = 'Cancel Order';
            cancelBtn.style.opacity = '1';
        }
    }
}

export async function confirmPayment(orderId, amount) {
    if (!confirm('Send payment confirmation OTP to your email?')) {
        return;
    }
    
    // Send OTP
    const result = await api.sendPaymentOTP(state.currentUser.id, orderId, amount);
    
    if (!result.ok) {
        alert(`Failed to send OTP: ${result.data?.detail || 'Unknown error'}`);
        return;
    }
    
    alert(`OTP sent to your email! Please check your inbox.`);
    
    // Show OTP verification modal
    showPaymentOTPModal(orderId, amount);
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
                <button type="button" class="btn-submit" onclick="window.verifyPaymentOTPFromOrders('${orderId}')">
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

window.verifyPaymentOTPFromOrders = async function(orderId) {
    const otpInput = document.getElementById('paymentOTPInput');
    const otpCode = otpInput?.value.trim();
    
    if (!otpCode || otpCode.length !== 6) {
        alert('Vui lòng nhập đúng 6 số OTP');
        return;
    }
    
    const result = await api.verifyPaymentOTP(state.currentUser.id, orderId, otpCode);
    
    if (result.ok) {
        alert(`Payment successful! Order #${orderId} is now paid.`);
        
        if (result.data.new_balance !== undefined) {
            state.currentUser.balance = result.data.new_balance;
        }
        
        closePaymentOTPModal();
        
        // Refresh orders view
        const { switchView } = await import('./navigation.js');
        switchView('orderStatus');
    } else {
        const errorMsg = result.data?.detail || result.data?.message || 'Xác thực OTP thất bại';
        alert(`Lỗi: ${errorMsg}`);
    }
}

window.closePaymentOTPModal = function() {
    const modal = document.getElementById('paymentOTPModal');
    if (modal) modal.remove();
}

window.confirmPayment = confirmPayment;

export async function confirmReceived(orderId) {
    if (!confirm('Confirm that you have received your order?')) {
        return;
    }

    // Show loading spinner
    const receivedBtn = document.querySelector(`button[onclick*="${orderId}"][onclick*="confirmReceived"]`);
    if (receivedBtn) {
        receivedBtn.disabled = true;
        receivedBtn.innerHTML = '<span class="spinner"></span> Processing...';
        receivedBtn.style.opacity = '0.7';
    }

    const result = await api.markOrderReceived(orderId, state.currentUser.id);
    
    if (result.ok) {
        ui.showSuccess('Thank you! Order marked as received.');
        loadOrderStatus();
        // Reload frequent items to show newly added items with customization options
        loadFrequentItems();
    } else {
        ui.showError(result.data.detail);
        
        // Restore button if error
        if (receivedBtn) {
            receivedBtn.disabled = false;
            receivedBtn.innerHTML = '✓ Received';
            receivedBtn.style.opacity = '1';
        }
    }
}

function formatOrderCard(order) {
    const itemsList = formatOrderItems(order.items);
    const priceBreakdown = formatPriceBreakdown(order);
    const createdDate = ui.formatDate(order.created_at);
    const paymentDate = order.payment_time ? ui.formatDate(order.payment_time) : null;
    const deliveredDate = order.delivered_at ? ui.formatDate(order.delivered_at) : null;
    const address = formatAddress(order);
    
    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">Created: ${createdDate}</div>
                    ${paymentDate ? `<div class="order-date" style="color:#28a745;">💳 Paid: ${paymentDate}</div>` : ''}
                    ${deliveredDate ? `<div class="order-date" style="color:#1e90ff;">📦 Delivered: ${deliveredDate}</div>` : ''}
                </div>
                <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
            </div>
            <div style="margin:12px 0;">
                <h4 style="margin:0 0 8px 0; color:#006241; font-size:14px;">📋 Order Items</h4>
                ${itemsList}
            </div>
            ${priceBreakdown}
            ${address ? `<div style="color:#666; font-size:13px; margin-top:10px;">📍 ${address}</div>` : ''}
            ${order.special_notes ? `<div style="color:#999; font-size:12px; margin-top:8px;">📝 ${order.special_notes}</div>` : ''}
            <div style="color:#666; font-size:13px; margin-top:8px;">💳 Payment: ${order.payment_method}</div>
        </div>
    `;
}

function formatActiveOrderCard(order) {
    const itemsList = formatOrderItems(order.items);
    const priceBreakdown = formatPriceBreakdown(order);
    const address = formatAddress(order);
    
    // Determine status badges and payment method display
    let statusBadges = '';
    let paymentMethodText = '';
    
    // Main status badge - all orders show "Out for Delivery Soon"
    statusBadges = '<span style="background:#FFA500; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold;">🚚 Out for Delivery Soon</span>';
    
    // Payment status badge
    if (order.status === 'pending_payment') {
        if (order.payment_method === 'cod' || order.payment_method === 'cash') {
            // COD: Show pending payment + payment method
            statusBadges += ' <span style="background:#FF6B6B; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; margin-left:8px;">⏳ Pending Payment</span>';
            paymentMethodText = '<div style="color:#666; font-size:13px; margin-top:6px;">💵 Payment Method: <strong>Cash on Delivery</strong></div>';
        } else {
            // Balance: Need OTP verification
            statusBadges += ' <span style="background:#FF6B6B; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; margin-left:8px;">⏳ Awaiting OTP Verification</span>';
            paymentMethodText = '<div style="color:#666; font-size:13px; margin-top:6px;">💳 Payment Method: <strong>Wallet Balance</strong><br>Please check your email for OTP to complete payment</div>';
        }
    } else if (order.status === 'paid') {
        statusBadges += ' <span style="background:#4CAF50; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; margin-left:8px;">✓ Paid</span>';
        paymentMethodText = (order.payment_method === 'cod' || order.payment_method === 'cash')
            ? '<div style="color:#666; font-size:13px; margin-top:6px;">💵 Payment Method: <strong>Cash on Delivery</strong></div>'
            : '<div style="color:#666; font-size:13px; margin-top:6px;">💳 Payment Method: <strong>Wallet Balance</strong></div>';
    } else if (order.status === 'preparing') {
        statusBadges = '<span style="background:#2196F3; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold;">👨‍🍳 Preparing</span>';
    } else if (order.status === 'in_transit' || order.status === 'delivering') {
        statusBadges = '<span style="background:#9C27B0; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold;">🚚 On the Way</span>';
    }
    
    return `
        <div class="order-status-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">${ui.formatDate(order.created_at)}</div>
                </div>
                <div class="order-total">${ui.formatCurrency(order.total)}</div>
            </div>
            <div style="margin: 12px 0;">
                ${statusBadges}
                ${paymentMethodText}
            </div>
            <div style="margin:12px 0;">
                <h4 style="margin:0 0 8px 0; color:#006241; font-size:14px;">📋 Order Items</h4>
                ${itemsList}
            </div>
            ${priceBreakdown}
            ${address ? `<div style="color:#666; font-size:13px; margin-top:10px;">📍 ${address}</div>` : ''}
            ${order.special_notes ? `<div style="color:#999; font-size:12px; margin-top:8px;">📝 ${order.special_notes}</div>` : ''}
            ${formatOrderActions(order)}
        </div>
    `;
}

function formatOrderActions(order) {
    // Don't show buttons for cancelled or delivered orders
    if (order.status === 'cancelled' || order.status === 'delivered') {
        return '';
    }
    
    let buttons = '<div class="order-actions">';
    
    // Cancel button always available for active orders
    buttons += `<button class="btn-cancel" onclick="window.cancelOrder('${order.id}')">❌ Cancel Order</button>`;
    
    // Conditional second button based on payment status
    if (order.status === 'pending_payment' && order.payment_method === 'balance') {
        // Balance payment pending - show Confirm Payment
        buttons += `<button class="btn-received" onclick="window.confirmPayment('${order.id}', ${order.total})">💳 Confirm Payment</button>`;
    } else if (order.status !== 'pending_payment' || order.payment_method === 'cod' || order.payment_method === 'cash') {
        // Order paid or is COD - show Received button
        buttons += `<button class="btn-received" onclick="window.confirmReceived('${order.id}')">✅ Received</button>`;
    }
    
    buttons += '</div>';
    return buttons;
}

function formatOrderItems(items) {
    if (!Array.isArray(items)) {
        console.error('Invalid items format:', items);
        return '<div style="color:#999;">No items</div>';
    }
    
    return items.map(item => {
        let details = item.product_name || item.name || 'Unknown';
        if (item.size) details += ` (${item.size})`;
        
        // Temperature (hot/ice)
        if (item.temperature) {
            const tempLabel = item.temperature === 'hot' ? '☕ Hot' : '🧊 Iced';
            details += `, ${tempLabel}`;
        }
        
        if (item.milks && Array.isArray(item.milks) && item.milks.length > 0) {
            const milkNames = { 'nut': 'Nut Milk', 'condensed': 'Condensed Milk' };
            const milkLabels = item.milks.map(m => milkNames[m] || m).join(', ');
            details += `, ${milkLabels}`;
        }
        
        if (item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) {
            const toppingNames = { 
                'butter': 'Butter', 
                'jam': 'Jam', 
                'cream': 'Cream cheese', 
                'nutella': 'Nutella',
                'sauce': 'Sauce', 
                'almond': 'Almond', 
                'whipped': 'Whipped Cream', 
                'fruit': 'Fresh Fruit'
            };
            const toppingLabels = item.toppings.map(t => toppingNames[t] || t).join(', ');
            details += `, ${toppingLabels}`;
        }
        
        if (item.sugar && item.sugar !== '0') {
            details += `, Sugar ${item.sugar}%`;
        }
        
        const itemPrice = item.price || 0;
        const itemTotal = itemPrice * (item.quantity || 1);
        
        return `
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0;">
                <span style="flex:1;">${details} x${item.quantity}</span>
                <span style="color:#006241; font-weight:500;">${ui.formatCurrency(itemTotal)}</span>
            </div>
        `;
    }).join('');
}

function formatPriceBreakdown(order) {
    // Calculate subtotal from items
    let subtotal = 0;
    if (Array.isArray(order.items)) {
        subtotal = order.items.reduce((sum, item) => {
            const itemPrice = item.price || 0;
            const itemTotal = itemPrice * (item.quantity || 1);
            return sum + itemTotal;
        }, 0);
    }
    
    const discount = order.discount || 0;
    const shippingFee = order.shipping_fee || 0;
    const total = order.total || 0;
    
    return `
        <div style="background:#f9f9f9; padding:12px; border-radius:6px; margin-top:10px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#666;">Subtotal:</span>
                <span style="font-weight:500;">${ui.formatCurrency(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#666;">Discount${order.promo_code ? ` (${order.promo_code})` : ''}:</span>
                <span style="color:#28a745; font-weight:500;">-${ui.formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:#666;">🚚 Shipping Fee:</span>
                <span style="font-weight:500;">${ui.formatCurrency(shippingFee)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding-top:8px; border-top:2px solid #ddd; margin-top:6px;">
                <span style="color:#000; font-weight:600; font-size:14px;">Total:</span>
                <span style="color:#c41e3a; font-weight:700; font-size:15px;">${ui.formatCurrency(total)}</span>
            </div>
        </div>
    `;
}

function formatAddress(order) {
    if (order.delivery_street && order.delivery_ward && order.delivery_district) {
        return `${order.delivery_street}, ${order.delivery_ward}, ${order.delivery_district}`;
    }
    return null;
}
