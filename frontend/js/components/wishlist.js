// ========== WISHLIST COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import { state } from '../utils/state.js';

export async function loadWishlist() {
    const result = await api.getWishlist(state.currentUser.id);
    const wishlistContainer = document.getElementById('wishlistContainer');
    
    if (!wishlistContainer) return;

    if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
        wishlistContainer.innerHTML = result.data.map(formatWishlistItem).join('');
    } else {
        wishlistContainer.innerHTML = '<p style="color:#999; text-align:center; padding:40px;">Your wishlist is empty</p>';
    }
}

function formatWishlistItem(item) {
    return `
        <div class="wishlist-item">
            <div class="wishlist-header">
                <span class="wishlist-product-id">${item.product_id}</span>
                <span class="wishlist-date">${new Date(item.added_at).toLocaleDateString()}</span>
            </div>
            ${item.notes ? `<div class="wishlist-notes">📝 ${item.notes}</div>` : ''}
            <div class="wishlist-actions">
                <button class="btn-add-to-cart" onclick="addWishlistToCart('${item.product_id}')">Add to Cart</button>
                <button class="btn-remove-wishlist" onclick="removeFromWishlist('${item.product_id}')">Remove</button>
            </div>
        </div>
    `;
}

export async function addToWishlist(productId, notes = '') {
    const result = await api.addToWishlist(state.currentUser.id, productId, notes);
    
    if (result.ok) {
        ui.showSuccess('Added to wishlist! 💭');
        loadWishlist();
        return true;
    } else {
        const errorMsg = result.data?.message || result.data?.detail || 'Failed to add to wishlist';
        ui.showError(errorMsg);
        return false;
    }
}

export async function removeFromWishlist(productId) {
    if (!confirm('Remove from wishlist?')) return;
    
    const result = await api.removeFromWishlist(productId, state.currentUser.id);
    
    if (result.ok) {
        ui.showSuccess('Removed from wishlist');
        loadWishlist();
    } else {
        ui.showError('Failed to remove from wishlist');
    }
}

export async function clearAllWishlist() {
    if (!confirm('Clear entire wishlist?')) return;
    
    const result = await api.clearWishlist(state.currentUser.id);
    
    if (result.ok) {
        ui.showSuccess('Wishlist cleared');
        loadWishlist();
    } else {
        ui.showError('Failed to clear wishlist');
    }
}

export function openWishlistModal(productId) {
    const modal = document.getElementById('wishlistModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('wishlistProductId').value = productId;
        document.getElementById('wishlistNotes').value = '';
    }
}

export function closeWishlistModal() {
    const modal = document.getElementById('wishlistModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

export async function submitWishlistItem() {
    const productId = document.getElementById('wishlistProductId').value;
    const notes = document.getElementById('wishlistNotes').value;
    
    if (await addToWishlist(productId, notes)) {
        closeWishlistModal();
    }
}

function addWishlistToCart(productId) {
    // Trigger add to cart with product ID
    window.showAddToCart(productId);
}

// Expose to window
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.clearAllWishlist = clearAllWishlist;
window.openWishlistModal = openWishlistModal;
window.closeWishlistModal = closeWishlistModal;
window.submitWishlistItem = submitWishlistItem;
window.loadWishlist = loadWishlist;
