// ========== ORDERS COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state } from '../utils/state.js';

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
    const createdDate = ui.formatDate(order.created_at);
    const paymentDate = order.payment_time ? ui.formatDate(order.payment_time) : null;
    const address = formatAddress(order);
    
    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">Created: ${createdDate}</div>
                    ${paymentDate ? `<div class="order-date" style="color:#28a745;">💳 Paid: ${paymentDate}</div>` : ''}
                </div>
                <div class="order-status status-${order.status}">${order.status.toUpperCase()}</div>
            </div>
            <div class="order-items">${itemsList}</div>
            ${address ? `<div style="color:#666; font-size:13px; margin-top:8px;">📍 ${address}</div>` : ''}
            ${order.special_notes ? `<div style="color:#999; font-size:12px; margin-top:8px;">📝 ${order.special_notes}</div>` : ''}
            <div class="order-footer">
                <span>Payment: ${order.payment_method}</span>
                <div class="order-total">${ui.formatCurrency(order.total)}</div>
            </div>
        </div>
    `;
}

function formatActiveOrderCard(order) {
    const itemsList = formatOrderItems(order.items);
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
            <div class="order-items">${itemsList}</div>
            ${address ? `<div style="color:#666; font-size:13px; margin-top:8px;">📍 ${address}</div>` : ''}
            ${order.special_notes ? `<div style="color:#999; font-size:12px; margin-top:8px;">📝 ${order.special_notes}</div>` : ''}
            <div class="order-actions">
                <button class="btn-cancel" onclick="window.cancelOrder('${order.id}')">❌ Cancel Order</button>
                <button class="btn-received" onclick="window.confirmReceived('${order.id}')">✅ Received</button>
            </div>
        </div>
    `;
}

function formatOrderItems(items) {
    if (!Array.isArray(items)) {
        console.error('Invalid items format:', items);
        return ['No items'];
    }
    
    return items.map(item => {
        let details = item.product_name || item.name || 'Unknown';
        if (item.size) details += ` (${item.size})`;
        
        if (item.milks && Array.isArray(item.milks) && item.milks.length > 0) {
            const milkNames = { 'nut': 'Sữa hạt', 'condensed': 'Sữa đặc' };
            const milkLabels = item.milks.map(m => milkNames[m] || m).join(', ');
            details += `, ${milkLabels}`;
        }
        
        if (item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) {
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
            details += `, ${toppingLabels}`;
        }
        
        if (item.sugar && item.sugar !== '0') {
            details += `, Sugar ${item.sugar}%`;
        }
        
        details += ` x${item.quantity}`;
        return details;
    }).join(', ');
}

function formatAddress(order) {
    if (order.delivery_street && order.delivery_ward && order.delivery_district) {
        return `${order.delivery_street}, ${order.delivery_ward}, ${order.delivery_district}`;
    }
    return null;
}
