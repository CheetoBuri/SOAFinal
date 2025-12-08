// ========== PROFILE COMPONENT ==========
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';
import * as storage from '../utils/storage.js';
import { state } from '../utils/state.js';
import { logout } from './auth.js';

export async function loadProfileData() {
    if (!state.currentUser) return;

    const displayText = state.currentUser.username || state.currentUser.email;
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = displayText;

    const profileEmailEl = document.getElementById('profileEmail');
    const profileUsernameEl = document.getElementById('profileUsername');
    const profileNameEl = document.getElementById('profileName');
    const profilePhoneEl = document.getElementById('profilePhone');
    
    if (profileEmailEl) profileEmailEl.textContent = state.currentUser.email || '-';
    if (profileUsernameEl) profileUsernameEl.textContent = state.currentUser.username || '-';
    if (profileNameEl) profileNameEl.textContent = state.currentUser.name || '-';
    if (profilePhoneEl) profilePhoneEl.textContent = state.currentUser.phone || '-';
    
    // Load balance
    const balanceResult = await api.apiCall(`/user/balance?user_id=${state.currentUser.id}`);
    const profileBalanceEl = document.getElementById('profileBalance');
    
    if (balanceResult.ok) {
        if (profileBalanceEl) profileBalanceEl.textContent = ui.formatCurrency(balanceResult.data.balance);
    } else if (balanceResult.status === 404) {
        ui.showError('User session expired. Please login again.');
        logout();
    } else {
        if (profileBalanceEl) profileBalanceEl.textContent = ui.formatCurrency(0);
    }
    
    const joinDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
    });
    const profileJoinedEl = document.getElementById('profileJoined');
    if (profileJoinedEl) profileJoinedEl.textContent = joinDate;
}

export function openChangeUsernameModal() {
    ui.openModal('changeUsernameModal');
}

export function closeChangeUsernameModal() {
    ui.closeModal('changeUsernameModal');
    ui.clearForm('changeUsernameForm');
}

export async function submitChangeUsername(e) {
    e.preventDefault();
    
    const newUsername = document.getElementById('newUsername')?.value;
    const password = document.getElementById('usernameChangePassword')?.value;

    const result = await api.changeUsername(state.currentUser.id, newUsername, password);
    
    if (result.ok) {
        state.currentUser.username = newUsername;
        storage.updateUserInStorage({ username: newUsername });
        ui.showSuccess('Username updated successfully!');
        closeChangeUsernameModal();
        loadProfileData();
    } else {
        ui.showError(result.data.detail);
    }
}

export function openChangeEmailModal() {
    ui.openModal('changeEmailModal');
}

export function closeChangeEmailModal() {
    ui.closeModal('changeEmailModal');
    ui.clearForm('changeEmailForm');
}

export async function submitChangeEmail(e) {
    e.preventDefault();
    
    const newEmail = document.getElementById('newEmail')?.value;
    const password = document.getElementById('emailChangePassword')?.value;

    const result = await api.changeEmail(state.currentUser.id, newEmail, password);
    
    if (result.ok) {
        state.currentUser.email = newEmail;
        storage.updateUserInStorage({ email: newEmail });
        ui.showSuccess('Email updated successfully!');
        closeChangeEmailModal();
        loadProfileData();
    } else {
        ui.showError(result.data.detail);
    }
}

export function openChangePhoneModal() {
    ui.openModal('changePhoneModal');
}

export function closeChangePhoneModal() {
    ui.closeModal('changePhoneModal');
    ui.clearForm('changePhoneForm');
}

export async function submitChangePhone(e) {
    e.preventDefault();
    
    const newPhone = document.getElementById('newPhone')?.value;
    const password = document.getElementById('phoneChangePassword')?.value;

    const result = await api.changePhone(state.currentUser.id, newPhone, password);
    
    if (result.ok) {
        state.currentUser.phone = newPhone;
        storage.updateUserInStorage({ phone: newPhone });
        ui.showSuccess('Phone number updated successfully!');
        closeChangePhoneModal();
        loadProfileData();
    } else {
        ui.showError(result.data.detail);
    }
}

export function openChangePasswordModal() {
    ui.openModal('changePasswordModal');
}

export function closeChangePasswordModal() {
    ui.closeModal('changePasswordModal');
    ui.clearForm('changePasswordForm');
}

export async function submitChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmNewPassword')?.value;

    if (newPassword !== confirmPassword) {
        ui.showError('New passwords do not match!');
        return;
    }

    const result = await api.changePassword(state.currentUser.id, currentPassword, newPassword);
    
    if (result.ok) {
        ui.showSuccess('Password changed successfully! Please login again.');
        closeChangePasswordModal();
        logout();
    } else {
        ui.showError(result.data.detail);
    }
}

export async function loadTransactionHistory() {
    if (!state.currentUser) return;
    
    const result = await api.apiCall(`/transactions?user_id=${state.currentUser.id}`);
    const transactionList = document.getElementById('transactionHistoryList');
    
    if (!transactionList) return;
    
    if (result.ok && result.data.transactions && result.data.transactions.length > 0) {
        transactionList.innerHTML = result.data.transactions.map(formatTransaction).join('');
    } else {
        transactionList.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">No transaction history yet</p>';
    }
}

function formatTransaction(txn) {
    const isPositive = txn.amount >= 0;
    const amountClass = isPositive ? 'positive' : 'negative';
    const amountPrefix = isPositive ? '+' : '';
    
    return `
        <div class="transaction-item">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="flex:1;">
                    <div style="font-weight:600; color:#333;">${txn.description || txn.type}</div>
                    <div style="font-size:12px; color:#999;">${ui.formatDate(txn.created_at)}</div>
                    ${txn.order_id ? `<div style="font-size:12px; color:#666;">Order #${txn.order_id}</div>` : ''}
                </div>
                <div style="text-align:right;">
                    <div class="transaction-amount ${amountClass}">${amountPrefix}${ui.formatCurrency(Math.abs(txn.amount))}</div>
                    <div style="font-size:11px; color:#999;">Balance: ${ui.formatCurrency(txn.balance_after)}</div>
                </div>
            </div>
        </div>
    `;
}
