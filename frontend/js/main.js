// ========== MAIN APPLICATION FILE ==========
import { initAuth, handleLogin, sendOTP, handleRegister, sendForgotOTP, handleForgotPassword, resetForgotForm, resetRegisterForm, logout, switchAuthTab, setupAuthListeners } from './components/auth.js';
import { loadMenu, filterByCategory, handleSearch, selectSearchResult, toggleFavorite } from './components/menu.js';
import { showAddToCart, closeSizeModal, addToCartFromModal, updateModalPrice, updateCartUI, changeQty, removeFromCart, openCheckoutModal, closeCheckoutModal, processCheckout } from './components/cart.js';
import { switchView } from './components/navigation.js';
import { cancelOrder, confirmReceived } from './components/orders.js';
import * as profileComponent from './components/profile.js';
import * as ui from './utils/ui.js';
import { initDarkMode, toggleDarkMode } from './utils/darkmode.js';

// Expose functions to window for onclick handlers
window.handleLogin = handleLogin;
window.sendOTP = sendOTP;
window.handleRegister = handleRegister;
window.sendForgotOTP = sendForgotOTP;
window.handleForgotPassword = handleForgotPassword;
window.resetForgotForm = resetForgotForm;
window.resetRegisterForm = resetRegisterForm;
window.logout = logout;
window.switchAuthTab = switchAuthTab;
window.switchView = switchView;
window.filterByCategory = filterByCategory;
window.handleSearch = handleSearch;
window.selectSearchResult = selectSearchResult;
window.toggleFavorite = toggleFavorite;
window.showAddToCart = showAddToCart;
window.closeSizeModal = closeSizeModal;
window.addToCartFromModal = addToCartFromModal;
window.updateModalPrice = updateModalPrice;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.processCheckout = processCheckout;
window.cancelOrder = cancelOrder;
window.confirmReceived = confirmReceived;
window.togglePasswordVisibility = ui.togglePasswordVisibility;
window.closeModal = ui.closeModal;
window.toggleDarkMode = toggleDarkMode;

// Profile functions
window.openChangeUsernameModal = profileComponent.openChangeUsernameModal;
window.closeChangeUsernameModal = profileComponent.closeChangeUsernameModal;
window.submitChangeUsername = profileComponent.submitChangeUsername;
window.openChangeEmailModal = profileComponent.openChangeEmailModal;
window.closeChangeEmailModal = profileComponent.closeChangeEmailModal;
window.submitChangeEmail = profileComponent.submitChangeEmail;
window.openChangePhoneModal = profileComponent.openChangePhoneModal;
window.closeChangePhoneModal = profileComponent.closeChangePhoneModal;
window.submitChangePhone = profileComponent.submitChangePhone;
window.openChangePasswordModal = profileComponent.openChangePasswordModal;
window.closeChangePasswordModal = profileComponent.closeChangePasswordModal;
window.submitChangePassword = profileComponent.submitChangePassword;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cafe Ordering System - Refactored Version');
    setupAuthListeners();
    initAuth();
    initDarkMode();
});
