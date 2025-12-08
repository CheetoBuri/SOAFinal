// ========== ORDERS COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state } from '../utils/state.js';
import { loadFrequentItems } from './menu.js';
import { icons } from '../utils/icons.js';

export async function loadOrderHistory() {
    const result = await api.getOrderHistory(state.currentUser.id);
    const ordersList = document.getElementById('ordersList');
    
    if (!ordersList) return;

    if (result.ok && result.data.orders && result.data.orders.length > 0) {
        ordersList.innerHTML = result.data.orders.map(formatOrderCard).join('');
        
        // Check review status and hide Write Review button if already reviewed
        const userId = localStorage.getItem('userId');
        if (userId) {
            for (const order of result.data.orders) {
                if (order.status === 'delivered' || order.status === 'completed') {
                    checkAndHideWriteReviewButton(order.id, userId);
                }
            }
        }
    } else {
        ordersList.innerHTML = '<p style="color:#999;">No orders yet. Start shopping!</p>';
    }
}

async function checkAndHideWriteReviewButton(orderId, userId) {
    try {
        const response = await fetch(`/api/reviews/order/${orderId}?user_id=${userId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.has_reviews) {
            // Hide Write Review button, keep only View Reviews button
            const reviewSection = document.getElementById(`reviewSection_${orderId}`);
            if (reviewSection) {
                const writeButton = reviewSection.querySelector('button:first-child');
                if (writeButton) {
                    writeButton.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error checking review status:', error);
    }
}

// View reviews for an order
window.viewOrderReviews = async function(orderId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('⚠ Please log in to view reviews');
        return;
    }
    
    try {
        const url = `/api/reviews/order/${orderId}?user_id=${userId}`;
        console.log('Fetching reviews from:', url);
        const response = await fetch(url);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Review data received:', data);
        
        if (!data.has_reviews || !data.reviews || data.reviews.length === 0) {
            alert('ℹ️ You haven\'t submitted any reviews for this order yet.');
            return;
        }
        
        // Open view review modal with the data
        window.openViewReviewModalDirect(orderId, data.reviews);
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        alert('ℹ️ No reviews found for this order.');
    }
}

export async function loadOrderStatus() {
    const result = await api.getOrderHistory(state.currentUser.id);
    const ordersList = document.getElementById('orderStatusList');
    
    if (!ordersList) return;

    if (result.ok && result.data.orders) {
        // Show only active orders (exclude delivered, cancelled, completed)
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
            ordersList.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">No active orders. All orders have been completed or cancelled.</p>';
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
            <div class="modal-header">Payment Confirmation</div>
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
        await loadOrderStatus();
        // Reload frequent items to show newly added items with customization options
        await loadFrequentItems();
    } else {
        ui.showError(result.data.detail);
        
        // Restore button if error
        if (receivedBtn) {
            receivedBtn.disabled = false;
            receivedBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg>Received';
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
    
    // Show review button only for delivered/completed orders
    const canReview = order.status === 'delivered' || order.status === 'completed';
    
    // Check if order has reviews (will be set after checking)
    const hasReviews = order.hasReviews || false;
    
    return `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">Created: ${createdDate}</div>
                    ${paymentDate ? `<div class="order-date" style="color:#28a745;">Paid: ${paymentDate}</div>` : ''}
                    ${deliveredDate ? `<div class="order-date" style="color:#1e90ff;">Delivered: ${deliveredDate}</div>` : ''}
                </div>
                <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
            </div>
            <div style="margin:12px 0;">
                <h4 style="margin:0 0 8px 0; color:#006241; font-size:14px;">Order Items</h4>
                ${itemsList}
            </div>
            ${priceBreakdown}
            ${order.customer_name ? `<div style="color:#666; font-size:13px; margin-top:10px;">${order.customer_name}</div>` : ''}
            ${order.customer_phone ? `<div style="color:#666; font-size:13px; margin-top:4px;">${order.customer_phone}</div>` : ''}
            ${address ? `<div style="color:#666; font-size:13px; margin-top:10px;">${address}</div>` : ''}
            ${order.special_notes ? `<div style="color:#999; font-size:12px; margin-top:8px;">Note: ${order.special_notes}</div>` : ''}
            <div style="color:#666; font-size:13px; margin-top:8px;">Payment: ${order.payment_method}</div>
            ${canReview ? `
                <div style="margin-top:15px; padding-top:15px; border-top:1px solid #f0f0f0; display:flex; gap:10px; flex-wrap:wrap;" id="reviewSection_${order.id}">
                    <button class="btn-review" onclick="window.openOrderReviewModal('${order.id}', ${JSON.stringify(order.items).replace(/"/g, '&quot;')})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        Write Review
                    </button>
                    <button class="btn-review" onclick="window.viewOrderReviews('${order.id}')" style="background:#f8f9fa; color:#006241;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Reviews
                    </button>
                </div>
            ` : ''}
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
    
    // Main status badge - depends on payment status
    if (order.status === 'pending_payment') {
        if (order.payment_method === 'cod' || order.payment_method === 'cash') {
            // COD: Order is ready for delivery, will be paid on arrival
            statusBadges = `<span style="background:#FFA500; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">${icons.truck} Out for Delivery Soon</span>`;
            paymentMethodText = `<div style="color:#666; font-size:13px; margin-top:6px;">Payment Method: <strong>Cash on Delivery</strong></div>`;
        } else {
            // Balance: Need OTP verification before delivery
            statusBadges = `<span style="background:#FF6B6B; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">${icons.clock} Awaiting OTP Verification</span>`;
            paymentMethodText = `<div style="color:#666; font-size:13px; margin-top:6px;">Payment Method: <strong>Wallet Balance</strong><br>Please check your email for OTP to complete payment</div>`;
        }
    } else if (order.status === 'paid') {
        // Payment confirmed - ready for delivery
        statusBadges = `<span style="background:#FFA500; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">${icons.truck} Out for Delivery Soon</span>`;
        statusBadges += ` <span style="background:#4CAF50; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; margin-left:8px; display:inline-flex; align-items:center; gap:4px;">${icons.check} Paid</span>`;
        paymentMethodText = (order.payment_method === 'cod' || order.payment_method === 'cash')
            ? `<div style="color:#666; font-size:13px; margin-top:6px;">Payment Method: <strong>Cash on Delivery</strong></div>`
            : `<div style="color:#666; font-size:13px; margin-top:6px;">Payment Method: <strong>Wallet Balance</strong></div>`;
    } else if (order.status === 'preparing') {
        statusBadges = `<span style="background:#2196F3; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">${icons.flame} Preparing</span>`;
    } else if (order.status === 'in_transit' || order.status === 'delivering') {
        statusBadges = `<span style="background:#9C27B0; color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">${icons.truck} On the Way</span>`;
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
                <h4 style="margin:0 0 8px 0; color:#006241; font-size:14px;">Order Items</h4>
                ${itemsList}
            </div>
            ${priceBreakdown}
            ${order.customer_name ? `<div style="color:#666; font-size:13px; margin-top:10px;">${order.customer_name}</div>` : ''}
            ${order.customer_phone ? `<div style="color:#666; font-size:13px; margin-top:4px;">${order.customer_phone}</div>` : ''}
            ${address ? `<div style="color:#666; font-size:13px; margin-top:10px;">${address}</div>` : ''}
            ${order.special_notes ? `<div style="color:#999; font-size:12px; margin-top:8px;">Note: ${order.special_notes}</div>` : ''}
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
    buttons += `<button class="btn-cancel" onclick="window.cancelOrder('${order.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Cancel Order</button>`;
    
    // Conditional second button based on payment status
    if (order.status === 'pending_payment' && order.payment_method === 'balance') {
        // Balance payment pending - show Confirm Payment
        buttons += `<button class="btn-received" onclick="window.confirmPayment('${order.id}', ${order.total})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Confirm Payment</button>`;
    } else if (order.status !== 'pending_payment' || order.payment_method === 'cod' || order.payment_method === 'cash') {
        // Order paid or is COD - show Received button
        buttons += `<button class="btn-received" onclick="window.confirmReceived('${order.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg>Received</button>`;
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
            const tempLabel = item.temperature === 'hot' ? 'Hot' : 'Iced';
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
        <div class="order-price-breakdown">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span class="price-label">Subtotal:</span>
                <span class="price-value">${ui.formatCurrency(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span class="price-label">Discount${order.promo_code ? ` (${order.promo_code})` : ''}:</span>
                <span class="discount-value">-${ui.formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span class="price-label">Shipping Fee:</span>
                <span class="price-value">${ui.formatCurrency(shippingFee)}</span>
            </div>
            <div class="order-total-row">
                <span class="total-label">Total:</span>
                <span class="total-value">${ui.formatCurrency(total)}</span>
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
