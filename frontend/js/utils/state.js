// ========== STATE MANAGEMENT ==========
export const state = {
    currentUser: null,
    cart: [],
    currentCategory: 'all',
    promoApplied: null,
    discountPercent: 0,
    currentView: 'shop',
    pendingOrder: null,
    favorites: [],
    menuItems: []
};

export const API_URL = 'http://localhost:3000/api';

// State getters
export function getCurrentUser() {
    return state.currentUser;
}

export function getCart() {
    return state.cart;
}

export function getCartCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * (state.discountPercent / 100);
    return subtotal - discount;
}

export function getCartSubtotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// State setters
export function setCurrentUser(user) {
    state.currentUser = user;
}

export function clearCurrentUser() {
    state.currentUser = null;
}

export function addToCart(product) {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
}

export function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
}

export function updateCartQuantity(productId, quantity) {
    const item = state.cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        }
    }
}

export function clearCart() {
    state.cart = [];
    state.promoApplied = null;
    state.discountPercent = 0;
}

export function setPromo(code, discount) {
    state.promoApplied = code;
    state.discountPercent = discount;
}

export function clearPromo() {
    state.promoApplied = null;
    state.discountPercent = 0;
}

export function setCurrentCategory(category) {
    state.currentCategory = category;
}

export function setCurrentView(view) {
    state.currentView = view;
}

export function setPendingOrder(order) {
    state.pendingOrder = order;
}

export function setFavorites(favorites) {
    state.favorites = favorites;
}

export function setMenuItems(items) {
    state.menuItems = items;
}

export function isFavorite(productId) {
    return state.favorites.some(f => f.product_id === productId);
}
