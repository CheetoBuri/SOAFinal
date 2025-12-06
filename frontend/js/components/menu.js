// ========== MENU COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state, setMenuItems, setFavorites, isFavorite } from '../utils/state.js';

export async function loadMenu() {
    const result = await api.getMenu();
    if (result.ok) {
        setMenuItems(result.data.items);
        displayProducts(result.data.items);
    }
}

export function displayProducts(items, targetGridId = null) {
    const gridId = targetGridId || (state.currentView === 'favorites' ? 'favoritesGrid' : 'productsGrid');
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Group items by category for better display
    const categories = {
        coffee: { title: '☕ Coffee', items: [] },
        tea: { title: '🍵 Tea', items: [] },
        juice: { title: '🧃 Juice & Smoothies', items: [] },
        food: { title: '🥐 Food & Desserts', items: [] }
    };
    
    items.forEach(item => {
        if (categories[item.category]) {
            categories[item.category].items.push(item);
        }
    });
    
    // Display each category
    Object.entries(categories).forEach(([catKey, catData]) => {
        if (catData.items.length === 0) return;
        
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `<h3 class="category-title">${catData.title}</h3>`;
        
        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'category-products-grid';
        
        catData.items.forEach(item => {
            const favorited = isFavorite(item.id);
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-product-id', item.id);
            
            // Show type badge for coffee (Italian vs Vietnamese)
            let typeBadge = '';
            if (item.category === 'coffee' && item.type) {
                typeBadge = `<span class="type-badge ${item.type}">${item.type === 'italian' ? '🇮🇹' : '🇻🇳'}</span>`;
            }
            
            // Show food type badge
            if (item.category === 'food' && item.type) {
                const typeLabels = { savory: '🥐', sweet: '🍪', cake: '🍰' };
                typeBadge = `<span class="type-badge food-${item.type}">${typeLabels[item.type] || ''}</span>`;
            }
            
            card.innerHTML = `
                <div class="product-icon">${item.icon}</div>
                ${typeBadge}
                <div class="product-name">${item.name}</div>
                <div class="product-price">${ui.formatCurrency(item.price)}</div>
                <div class="product-buttons">
                    <button class="btn-small btn-add" onclick="window.showAddToCart('${item.id}')">Add</button>
                    <button class="btn-small btn-favorite ${favorited ? 'favorited' : ''}" onclick="window.toggleFavorite('${item.id}')" title="${favorited ? 'Remove from favorites' : 'Add to favorites'}">
                        ${favorited ? '❤️' : '🤍'}
                    </button>
                </div>
            `;
            categoryGrid.appendChild(card);
        });
        
        categorySection.appendChild(categoryGrid);
        grid.appendChild(categorySection);
    });
}

export async function filterByCategory(category, event) {
    if (event) {
        ui.setActive('.category-btn', event.target);
    }
    
    // If in favorites view, filter favorites by category
    if (state.currentView === 'favorites') {
        if (!state.currentUser) return;
        
        const result = await api.getFavorites(state.currentUser.id);
        
        if (result.ok && result.data.length > 0) {
            let favoriteProducts = state.menuItems.filter(item => 
                result.data.some(f => f.product_id === item.id)
            );
            
            // Filter by category if not "all"
            if (category !== 'all') {
                favoriteProducts = favoriteProducts.filter(item => item.category === category);
            }
            
            displayProducts(favoriteProducts, 'favoritesGrid');
        } else {
            const grid = document.getElementById('favoritesGrid');
            if (grid) {
                grid.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">No favorites in this category</div>';
            }
        }
        return;
    }
    
    // For shop view, proceed normally
    let result;
    if (category === 'all') {
        result = await api.getMenu();
    } else {
        result = await api.apiCall(`/menu/${category}`);
    }
    
    if (result.ok) {
        displayProducts(result.data.items || result.data);
    }
}

export async function handleSearch() {
    // Support both sidebar and header search
    const headerInput = document.getElementById('headerSearchInput');
    const query = headerInput?.value.trim() || '';
    const resultsDiv = document.getElementById('headerSearchResults');
    const resultsList = document.getElementById('headerSearchResultsList');
    
    if (!query || query.length < 2) {
        if (resultsDiv) resultsDiv.style.display = 'none';
        return;
    }

    const result = await api.apiCall(`/menu/search?q=${encodeURIComponent(query)}`);
    
    if (result.ok && result.data.items && result.data.items.length > 0) {
        if (resultsList) {
            resultsList.innerHTML = result.data.items.map(item => 
                `<div onclick="window.selectSearchResult('${item.id}')">
                    <span style="font-size:20px;">${item.icon}</span>
                    <span style="flex:1;">${item.name}</span>
                    <span style="font-weight:600;">${ui.formatCurrency(item.price)}</span>
                </div>`
            ).join('');
        }
        if (resultsDiv) resultsDiv.style.display = 'block';
    } else {
        if (resultsList) {
            resultsList.innerHTML = '<div style="color:#999; text-align:center; padding:20px;">No results found</div>';
        }
        if (resultsDiv) resultsDiv.style.display = 'block';
    }
}

export function selectSearchResult(productId) {
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerResultsDiv = document.getElementById('headerSearchResults');
    
    if (headerSearchInput) headerSearchInput.value = '';
    if (headerResultsDiv) headerResultsDiv.style.display = 'none';
    
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productCard.style.boxShadow = '0 0 20px rgba(196, 30, 58, 0.6)';
        setTimeout(() => {
            productCard.style.boxShadow = '';
        }, 2000);
    } else {
        filterByCategory('all');
    }
}

// Favorites
export async function loadFavorites() {
    if (!state.currentUser) return;
    
    const result = await api.getFavorites(state.currentUser.id);
    if (result.ok) {
        // Store full result data (array of {product_id: "cf_1"})
        setFavorites(result.data || []);
    }
}

// Helper function to update all heart icons for a product across both views
function updateHeartIcons(productId, isFavorited) {
    // Update all cards with this product ID in both grids
    const cards = document.querySelectorAll(`[data-product-id="${productId}"]`);
    cards.forEach(card => {
        const heartBtn = card.querySelector('.btn-favorite');
        if (heartBtn) {
            if (isFavorited) {
                heartBtn.classList.add('favorited');
                heartBtn.innerHTML = '❤️';
                heartBtn.title = 'Remove from favorites';
            } else {
                heartBtn.classList.remove('favorited');
                heartBtn.innerHTML = '🤍';
                heartBtn.title = 'Add to favorites';
            }
        }
    });
}

export async function toggleFavorite(productId) {
    if (!state.currentUser) {
        ui.showError('Please login to add favorites');
        return;
    }

    const favorited = isFavorite(productId);
    let result;
    
    if (favorited) {
        result = await api.removeFavorite(String(state.currentUser.id), String(productId));
    } else {
        result = await api.addFavorite(String(state.currentUser.id), String(productId));
    }
    
    if (result.ok) {
        // Reload favorites state first
        await loadFavorites();
        
        // Update heart icons in all views without reloading
        updateHeartIcons(productId, !favorited);
        
        // If in favorites view and we just removed an item, reload favorites to remove the card
        if (state.currentView === 'favorites' && favorited) {
            await loadFavoritesView();
        }
    } else {
        ui.showError(result.data.detail);
    }
}

export async function loadFavoritesView() {
    if (!state.currentUser) return;
    
    const result = await api.getFavorites(state.currentUser.id);
    
    if (result.ok && result.data.length > 0) {
        const favoriteProducts = state.menuItems.filter(item => 
            result.data.some(f => f.product_id === item.id)
        );
        displayProducts(favoriteProducts, 'favoritesGrid');
    } else {
        const grid = document.getElementById('favoritesGrid');
        if (grid) {
            grid.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">No favorites yet</div>';
        }
    }
}

// ========== FREQUENT ITEMS ==========
export async function loadFrequentItems() {
    if (!state.currentUser) return;
    
    const listDiv = document.getElementById('frequentItemsList');
    if (!listDiv) return;
    
    try {
        // Get user's order history to calculate frequent items
        const result = await api.apiCall(`/orders?user_id=${state.currentUser.id}`);
        
        const orders = result.ok ? (result.data.orders || result.data) : [];
        
        if (orders.length > 0) {
            // Count product frequency
            const productCounts = {};
            orders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (!productCounts[item.product_id]) {
                            productCounts[item.product_id] = {
                                count: 0,
                                productInfo: item
                            };
                        }
                        productCounts[item.product_id].count += item.quantity;
                    });
                }
            });
            
            // Sort by frequency and get top 5
            const frequentItems = Object.entries(productCounts)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([id, data]) => {
                    // Find matching menu item to get icon
                    const menuItem = state.menuItems.find(m => m.id === id);
                    return {
                        id,
                        ...data.productInfo,
                        orderCount: data.count,
                        icon: menuItem?.icon || '🍽️',
                        product_id: id // Ensure product_id is set
                    };
                });
            
            if (frequentItems.length > 0) {
                listDiv.innerHTML = frequentItems.map(item => `
                    <div class="frequent-item" onclick="window.selectSearchResult('${item.product_id}')">
                        <div class="frequent-item-icon">${item.icon}</div>
                        <div class="frequent-item-info">
                            <div class="frequent-item-name">${item.product_name || item.name}</div>
                            <div class="frequent-item-meta">
                                <span class="frequent-item-count">Ordered ${item.orderCount}x</span>
                                <span class="frequent-item-price">${ui.formatCurrency(item.price)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                listDiv.innerHTML = '<p style="color:#999; font-size:12px; text-align:center;">No order history yet</p>';
            }
        } else {
            listDiv.innerHTML = '<p style="color:#999; font-size:12px; text-align:center;">No order history yet</p>';
        }
    } catch (error) {
        console.error('Error loading frequent items:', error);
        listDiv.innerHTML = '<p style="color:#999; font-size:12px; text-align:center;">Unable to load</p>';
    }
}

