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
        const activeOrders = result.data.orders.filter(order => 
            order.status === 'confirmed' || order.status === 'preparing' || order.status === 'delivering'
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
    if (!confirm('Are you sure you want to cancel this order? Your balance will be refunded.')) {
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
        ui.showSuccess(`Order cancelled! ${ui.formatCurrency(result.data.refund_amount)} refunded to your balance.`);
        loadOrderStatus();
        
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
    
    return `
        <div class="order-status-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">${ui.formatDate(order.created_at)}</div>
                </div>
                <div class="order-total">${ui.formatCurrency(order.total)}</div>
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
        
        if (item.sugar && item.sugar !== '100') {
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
