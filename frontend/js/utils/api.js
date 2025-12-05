// ========== API UTILITIES ==========
import { API_URL } from './state.js';

// Generic API call wrapper
export async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        return { ok: response.ok, data, status: response.status };
    } catch (error) {
        console.error('API call error:', error);
        return { ok: false, data: { detail: 'Connection error' }, status: 0 };
    }
}

// Auth APIs
export async function loginUser(email, password) {
    // Send both 'identifier' (new) and 'email' (backward compatibility)
    return await apiCall('/auth/login', 'POST', { 
        identifier: email,
        email: email,
        password 
    });
}

export async function registerUser(email, password, name, phone, username) {
    return await apiCall('/auth/register', 'POST', { 
        email, 
        password, 
        name, 
        phone, 
        username 
    });
}

export async function sendResetOTP(email) {
    return await apiCall('/auth/send-reset-otp', 'POST', { email });
}

export async function resetPassword(email, otp_code, new_password) {
    return await apiCall('/auth/reset-password', 'POST', { 
        email, 
        otp_code, 
        new_password 
    });
}

// Menu APIs
export async function getMenu() {
    return await apiCall('/menu');
}

// Cart APIs
export async function applyPromo(code, user_id) {
    return await apiCall('/cart/apply-promo', 'POST', { code, user_id });
}

// Order APIs
export async function placeOrder(orderData) {
    return await apiCall('/checkout', 'POST', orderData);
}

export async function getOrderHistory(user_id) {
    return await apiCall(`/orders?user_id=${user_id}`);
}

export async function getOrderStatus(user_id, status = null) {
    const endpoint = status 
        ? `/orders?user_id=${user_id}&status=${status}`
        : `/orders?user_id=${user_id}`;
    return await apiCall(endpoint);
}

export async function cancelOrder(order_id, user_id) {
    return await apiCall(`/orders/${order_id}/cancel`, 'POST', { user_id });
}

export async function markOrderReceived(order_id, user_id) {
    return await apiCall(`/orders/${order_id}/received`, 'POST', { user_id });
}

// Favorites APIs
export async function getFavorites(user_id) {
    return await apiCall(`/favorites/${String(user_id)}`);
}

export async function addFavorite(user_id, product_id) {
    return await apiCall('/favorites/add', 'POST', { 
        user_id: String(user_id), 
        product_id: String(product_id) 
    });
}

export async function removeFavorite(user_id, product_id) {
    return await apiCall('/favorites/remove', 'POST', { 
        user_id: String(user_id), 
        product_id: String(product_id) 
    });
}

// Profile APIs
export async function changeUsername(user_id, new_username, password) {
    return await apiCall('/user/change-username', 'POST', { 
        user_id, 
        new_username, 
        password 
    });
}

export async function changeEmail(user_id, new_email, password) {
    return await apiCall('/user/change-email', 'POST', {
        user_id,
        new_email,
        password
    });
}

export async function changePhone(user_id, new_phone, password) {
    return await apiCall('/user/change-phone', 'POST', { 
        user_id, 
        new_phone, 
        password 
    });
}

export async function changePassword(user_id, current_password, new_password) {
    return await apiCall('/user/change-password', 'POST', { 
        user_id, 
        current_password, 
        new_password 
    });
}

// Payment API
export async function processPayment(order_id, method, amount) {
    return await apiCall('/payment/process', 'POST', { 
        order_id, 
        payment_method: method, 
        amount 
    });
}

// Payment OTP APIs
export async function sendPaymentOTP(user_id, order_id, amount) {
    return await apiCall('/payment/send-otp', 'POST', {
        user_id,
        order_id,
        amount
    });
}

export async function verifyPaymentOTP(user_id, order_id, otp_code) {
    return await apiCall('/payment/verify-otp', 'POST', {
        user_id,
        order_id,
        otp_code
    });
}

// Location APIs
export async function getDistricts(city = 'HCM') {
    return await apiCall(`/locations/districts?city=${city}`);
}

export async function getWards(district) {
    return await apiCall(`/locations/wards?district=${encodeURIComponent(district)}`);
}
