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

export function displayProducts(items) {
    const gridId = state.currentView === 'favorites' ? 'favoritesGrid' : 'productsGrid';
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
    const query = document.getElementById('searchInput')?.value.trim();
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');
    
    if (!query || query.length < 2) {
        if (resultsDiv) resultsDiv.style.display = 'none';
        return;
    }

    const result = await api.apiCall(`/menu/search?q=${encodeURIComponent(query)}`);
    
    if (result.ok && result.data.items && result.data.items.length > 0) {
        if (resultsList) {
            resultsList.innerHTML = result.data.items.map(item => 
                `<div style="padding:8px; background:#f0f0f0; border-radius:4px; margin:5px 0; cursor:pointer;" onclick="window.selectSearchResult('${item.id}')">
                    ${item.icon} ${item.name} - ${ui.formatCurrency(item.price)}
                </div>`
            ).join('');
        }
        if (resultsDiv) resultsDiv.style.display = 'block';
    } else {
        if (resultsList) {
            resultsList.innerHTML = '<div style="color:#999;">No results found</div>';
        }
        if (resultsDiv) resultsDiv.style.display = 'block';
    }
}

export function selectSearchResult(productId) {
    const searchInput = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('searchResults');
    
    if (searchInput) searchInput.value = '';
    if (resultsDiv) resultsDiv.style.display = 'none';
    
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
        await loadFavorites();
        
        // Update UI
        if (state.currentView === 'favorites') {
            await loadFavoritesView();
        } else {
            await loadMenu();
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
        displayProducts(favoriteProducts);
    } else {
        const grid = document.getElementById('favoritesGrid');
        if (grid) {
            grid.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">No favorites yet</div>';
        }
    }
}
