// ========== MENU COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state, setMenuItems, setFavorites, isFavorite } from '../utils/state.js';

// Lazy loading observer for images
let imageObserver = null;

function initLazyLoading() {
    if (imageObserver) {
        imageObserver.disconnect();
    }
    
    imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const placeholder = img.nextElementSibling;
                
                // Load the actual image
                img.src = img.dataset.src;
                img.classList.remove('lazy-image');
                img.classList.add('lazy-loaded');
                
                // Hide placeholder when image loads
                img.onload = () => {
                    if (placeholder && placeholder.classList.contains('image-placeholder')) {
                        placeholder.style.display = 'none';
                    }
                };
                
                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
    });
    
    // Observe all lazy images
    document.querySelectorAll('.lazy-image').forEach(img => {
        imageObserver.observe(img);
    });
}

export async function loadMenu() {
    const result = await api.getMenu();
    if (result.ok) {
        setMenuItems(result.data.items);
        displayProducts(result.data.items);
        
        // Initialize lazy loading after products are rendered
        setTimeout(() => initLazyLoading(), 100);
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
            
            // Use lazy loading for images to improve performance
            const productImage = item.image 
                ? `<img class="lazy-image" data-src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="image-placeholder"></div>
                   <span style="display:none;">${item.icon}</span>`
                : `<span>${item.icon}</span>`;
            
            card.innerHTML = `
                <div class="product-icon">${productImage}</div>
                ${typeBadge}
                <div class="product-name">${item.name}</div>
                <div class="product-price">${ui.formatCurrency(item.price)}</div>
                <div class="product-buttons">
                    <button class="btn-small btn-favorite ${favorited ? 'favorited' : ''}" onclick="event.stopPropagation(); window.toggleFavorite('${item.id}')" title="${favorited ? 'Remove from favorites' : 'Add to favorites'}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            // Click on card to open customization modal
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking on favorite button
                if (!e.target.closest('.btn-favorite')) {
                    window.showAddToCart(item.id);
                }
            });
            
            categoryGrid.appendChild(card);
        });
        
        categorySection.appendChild(categoryGrid);
        grid.appendChild(categorySection);
    });
    
    // Re-initialize lazy loading for newly rendered products
    setTimeout(() => initLazyLoading(), 100);
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
                heartBtn.title = 'Remove from favorites';
            } else {
                heartBtn.classList.remove('favorited');
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
        // Get user's frequent items from new API endpoint
        const result = await api.apiCall(`/frequent-items?user_id=${state.currentUser.id}&limit=5`);
        
        if (result.ok && result.data.items && result.data.items.length > 0) {
            const frequentItems = result.data.items;
            
            listDiv.innerHTML = frequentItems.map(item => {
                // Create a summary of customization options
                const customSummary = [];
                if (item.customization) {
                    if (item.customization.size) customSummary.push(item.customization.size);
                    if (item.customization.temperature) customSummary.push(item.customization.temperature);
                    if (item.customization.milk) customSummary.push('milk');
                    if (item.customization.sugar) customSummary.push(`${item.customization.sugar}% sugar`);
                }
                
                // Use lazy loading for frequent items images too
                const iconContent = item.image 
                    ? `<img class="lazy-image-sidebar" data-src="${item.image}" alt="${item.product_name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                       <div class="image-placeholder-sidebar"></div>
                       <span style="display:none; font-size:24px;">${item.icon}</span>`
                    : `<span style="font-size:24px;">${item.icon}</span>`;
                
                return `
                    <div class="frequent-item" data-frequent-item='${JSON.stringify(item)}' onclick="window.openFrequentItemModal(this)">
                        <div class="frequent-item-icon">${iconContent}</div>
                        <div class="frequent-item-info">
                            <div class="frequent-item-name">${item.product_name}</div>
                            <div class="frequent-item-meta">
                                <span class="frequent-item-count">Ordered ${item.order_count}x</span>
                                <span class="frequent-item-price">${ui.formatCurrency(item.price)}</span>
                            </div>
                            ${customSummary.length > 0 ? `<div style="font-size:11px; color:#888; margin-top:2px;">${customSummary.join(', ')}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            // Initialize lazy loading for sidebar images
            setTimeout(() => initSidebarLazyLoading(), 100);
        } else {
            listDiv.innerHTML = '<p style="color:#999; font-size:12px; text-align:center;">No order history yet</p>';
        }
    } catch (error) {
        console.error('Error loading frequent items:', error);
        listDiv.innerHTML = '<p style="color:#999; font-size:12px; text-align:center;">Unable to load</p>';
    }
}

function initSidebarLazyLoading() {
    const sidebarImages = document.querySelectorAll('.lazy-image-sidebar');
    
    sidebarImages.forEach(img => {
        const placeholder = img.nextElementSibling;
        
        // Sidebar images load immediately since they're small
        img.src = img.dataset.src;
        img.classList.remove('lazy-image-sidebar');
        
        img.onload = () => {
            if (placeholder && placeholder.classList.contains('image-placeholder-sidebar')) {
                placeholder.style.display = 'none';
            }
        };
    });
}

