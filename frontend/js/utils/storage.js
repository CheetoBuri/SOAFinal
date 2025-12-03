// ========== LOCAL STORAGE UTILITIES ==========

// User data
export function saveUserToStorage(user) {
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userPhone', user.phone || '');
    localStorage.setItem('userUsername', user.username || '');
}

export function getUserFromStorage() {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;

    return {
        id: userId,
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        phone: localStorage.getItem('userPhone') || '',
        username: localStorage.getItem('userUsername')
    };
}

export function updateUserInStorage(updates) {
    if (updates.email) localStorage.setItem('userEmail', updates.email);
    if (updates.name) localStorage.setItem('userName', updates.name);
    if (updates.phone) localStorage.setItem('userPhone', updates.phone);
    if (updates.username) localStorage.setItem('userUsername', updates.username);
}

export function clearUserStorage() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userUsername');
}

export function clearAllStorage() {
    localStorage.clear();
}

// Cart data (optional - if you want to persist cart)
export function saveCartToStorage(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

export function getCartFromStorage() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

export function clearCartStorage() {
    localStorage.removeItem('cart');
}
