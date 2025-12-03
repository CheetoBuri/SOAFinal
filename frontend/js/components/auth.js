// ========== AUTHENTICATION COMPONENT ==========
import * as api from '../utils/api.js';
import * as storage from '../utils/storage.js';
import * as ui from '../utils/ui.js';
import { setCurrentUser } from '../utils/state.js';
import { loadMenu, loadFavorites } from './menu.js';
import { switchView } from './navigation.js';

export function initAuth() {
    // Check if user is already logged in
    const user = storage.getUserFromStorage();
    if (user) {
        setCurrentUser(user);
        showApp();
        loadMenu();
        loadFavorites();
    } else {
        showAuthScreen();
    }
}

export function showAuthScreen() {
    ui.hideElement('appScreen');
    ui.showElement('authScreen');
}

export function showApp() {
    ui.hideElement('authScreen');
    ui.showElement('appScreen');
    
    const user = storage.getUserFromStorage();
    if (user) {
        const displayText = user.username || user.email;
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) userEmailEl.textContent = displayText;
    }
}

export function switchAuthTab(tab) {
    ui.setActive('.auth-form', null);
    ui.setActive('.auth-tab', null);
    
    // Clear all error messages
    ui.clearError('loginError');
    ui.clearError('registerError');
    ui.clearError('forgotError');
    
    if (tab === 'login') {
        document.getElementById('loginForm')?.classList.add('active');
        document.querySelectorAll('.auth-tab')[0]?.classList.add('active');
    } else if (tab === 'register') {
        document.getElementById('registerForm')?.classList.add('active');
        document.querySelectorAll('.auth-tab')[1]?.classList.add('active');
    } else if (tab === 'forgot') {
        document.getElementById('forgotForm')?.classList.add('active');
        document.querySelectorAll('.auth-tab')[2]?.classList.add('active');
    }
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    ui.clearError('loginError');

    const result = await api.loginUser(email, password);
    
    if (result.ok) {
        const user = {
            id: result.data.user_id,
            email: result.data.email,
            name: result.data.name,
            phone: result.data.phone || '',
            username: result.data.username
        };
        
        setCurrentUser(user);
        storage.saveUserToStorage(user);
        
        showApp();
        await loadMenu();
        await loadFavorites();
        switchView('shop');  // Go to shop view (menu)
        ui.clearForm('loginForm');
    } else {
        ui.displayError('loginError', result.data.detail);
    }
}

export async function sendOTP() {
    const email = document.getElementById('registerEmail').value;
    
    if (!email) {
        ui.displayError('registerError', 'Please enter email');
        return;
    }

    const result = await api.apiCall('/auth/send-otp', 'POST', { email });
    
    if (result.ok) {
        ui.clearError('registerError');
        ui.displaySuccess('registerSuccess', `OTP sent to ${email}`);
        document.getElementById('registerStep1').style.display = 'none';
        document.getElementById('registerStep2').style.display = 'block';
    } else {
        ui.displayError('registerError', result.data.detail);
    }
}

export function resetRegisterForm() {
    document.getElementById('registerStep1').style.display = 'block';
    document.getElementById('registerStep2').style.display = 'none';
    ui.clearForm('registerForm');
    ui.clearError('registerError');
    ui.clearError('registerSuccess');
}

export async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const otp = document.getElementById('otpCode').value;
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (!password || password.length < 6) {
        ui.displayError('registerError', 'Password must be at least 6 characters');
        return;
    }

    if (password !== passwordConfirm) {
        ui.displayError('registerError', 'Passwords do not match');
        return;
    }

    const result = await api.apiCall('/auth/verify-otp', 'POST', {
        email,
        otp_code: otp,
        full_name: name,
        username: username || null,
        phone: phone || null,
        password: password
    });

    if (result.ok) {
        const user = {
            id: result.data.user_id,
            email: result.data.email,
            name: result.data.name,
            phone: phone || '',
            username: username || null
        };
        
        setCurrentUser(user);
        storage.saveUserToStorage(user);
        
        showApp();
        await loadMenu();
        await loadFavorites();
        switchView('shop');  // Go to shop view (menu)
        resetRegisterForm();
        switchAuthTab('login');
    } else {
        ui.displayError('registerError', result.data.detail);
    }
}

export async function sendForgotOTP() {
    const email = document.getElementById('forgotEmail').value.toLowerCase().trim();
    
    if (!email) {
        ui.displayError('forgotError', 'Please enter your email');
        return;
    }

    const result = await api.sendResetOTP(email);
    
    if (result.ok) {
        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
    } else {
        ui.displayError('forgotError', result.data.detail);
    }
}

export async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.toLowerCase().trim();
    const otp = document.getElementById('forgotOTP').value;
    const newPassword = document.getElementById('forgotNewPassword').value;
    const confirmPassword = document.getElementById('forgotConfirmPassword').value;
    
    if (newPassword.length < 6) {
        ui.displayError('forgotError', 'Password must be at least 6 characters');
        return;
    }

    if (newPassword !== confirmPassword) {
        ui.displayError('forgotError', 'Passwords do not match');
        return;
    }

    const result = await api.resetPassword(email, otp, newPassword);
    
    if (result.ok) {
        ui.showSuccess('Password reset successfully! Please login with your new password.');
        resetForgotForm();
        switchAuthTab('login');
    } else {
        ui.displayError('forgotError', result.data.detail);
    }
}

export function resetForgotForm() {
    ui.clearForm('forgotForm');
    document.getElementById('forgotStep1').style.display = 'block';
    document.getElementById('forgotStep2').style.display = 'none';
    ui.clearError('forgotError');
}

export function logout() {
    storage.clearAllStorage();
    setCurrentUser(null);
    showAuthScreen();
    switchAuthTab('login');
}

// Setup event listeners
export function setupAuthListeners() {
    // Clear errors on input
    const clearLoginError = () => ui.clearError('loginError');
    const clearRegisterError = () => ui.clearError('registerError');
    const clearForgotError = () => ui.clearError('forgotError');

    document.getElementById('loginEmail')?.addEventListener('input', clearLoginError);
    document.getElementById('loginPassword')?.addEventListener('input', clearLoginError);
    
    document.getElementById('registerEmail')?.addEventListener('input', clearRegisterError);
    document.getElementById('registerPassword')?.addEventListener('input', clearRegisterError);
    document.getElementById('registerPasswordConfirm')?.addEventListener('input', clearRegisterError);
    document.getElementById('registerName')?.addEventListener('input', clearRegisterError);
    document.getElementById('registerPhone')?.addEventListener('input', clearRegisterError);
    
    document.getElementById('forgotEmail')?.addEventListener('input', clearForgotError);
    document.getElementById('forgotOTP')?.addEventListener('input', clearForgotError);
    document.getElementById('forgotNewPassword')?.addEventListener('input', clearForgotError);
    document.getElementById('forgotConfirmPassword')?.addEventListener('input', clearForgotError);
}
