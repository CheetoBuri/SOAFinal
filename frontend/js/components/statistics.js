// ========== STATISTICS COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state } from '../utils/state.js';

export async function loadOrderStats() {
    const result = await api.getOrderStats(state.currentUser.id);
    const statsContainer = document.getElementById('statsContainer');
    
    if (!statsContainer) return;

    if (result.ok) {
        const stats = result.data;
        statsContainer.innerHTML = formatStatsCards(stats);
    } else {
        statsContainer.innerHTML = '<p style="color:#999;">No stats available yet</p>';
    }
}

function formatStatsCards(stats) {
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">${stats.total_orders}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value">${ui.formatCurrency(stats.total_spent)}</div>
                <div class="stat-label">Total Spent</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">${ui.formatCurrency(stats.average_order_value)}</div>
                <div class="stat-label">Avg Order</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">${ui.formatCurrency(stats.highest_order)}</div>
                <div class="stat-label">Highest Order</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📉</div>
                <div class="stat-value">${ui.formatCurrency(stats.lowest_order)}</div>
                <div class="stat-label">Lowest Order</div>
            </div>
            
            ${stats.favorite_product ? `
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">${stats.favorite_product_count}x</div>
                <div class="stat-label">Favorite: ${stats.favorite_product}</div>
            </div>
            ` : ''}
        </div>
    `;
}

export async function loadFrequentItems() {
    const result = await api.getFrequentItems(state.currentUser.id, 5);
    const frequentContainer = document.getElementById('frequentItemsContainer');
    
    if (!frequentContainer) return;

    if (result.ok && result.data.frequent_items.length > 0) {
        frequentContainer.innerHTML = formatFrequentItems(result.data.frequent_items);
    } else {
        frequentContainer.innerHTML = '<p style="color:#999;">No order history yet</p>';
    }
}

function formatFrequentItems(items) {
    return `
        <div class="frequent-items-list">
            ${items.map((item, idx) => `
                <div class="frequent-item">
                    <span class="rank">#${idx + 1}</span>
                    <span class="product-id">${item.product_id}</span>
                    <span class="count">${item.order_count} orders</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Expose to window
window.loadOrderStats = loadOrderStats;
window.loadFrequentItems = loadFrequentItems;
