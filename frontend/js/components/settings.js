// ========== SETTINGS SYSTEM HANDLERS ==========

// User Dropdown
window.toggleUserDropdown = function() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const btn = document.getElementById('userDropdownBtn');
    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Settings Modal
window.openSettingsModal = function() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('userDropdown').classList.remove('active');
};

window.closeSettingsModal = function(event) {
    if (!event || (event.target && (event.target.id === 'settingsModal' || event.target.classList.contains('modal-overlay')))) {
        document.getElementById('settingsModal').classList.remove('active');
    }
};

// Personal Information Modal
window.openPersonalInfoModal = async function() {
    // Prefer saved storage keys (used by auth.js), fallback to legacy currentUser JSON
    const user = {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        username: localStorage.getItem('userUsername'),
        full_name: localStorage.getItem('userName'),
        phone: localStorage.getItem('userPhone')
    };
    const legacy = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const email = user.email || legacy.email || '-';
    const username = user.username || legacy.username || '-';
    const fullName = user.full_name || legacy.full_name || legacy.name || '-';
    const phone = user.phone || legacy.phone || '-';

    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayUsername').textContent = username;
    document.getElementById('displayFullName').textContent = fullName;
    document.getElementById('displayPhone').textContent = phone;

    // Try to load live balance when user id exists
    const userId = user.id || legacy.id;
    if (userId) {
        try {
            const res = await fetch(`/api/user/balance?user_id=${userId}`);
            const data = await res.json();
            if (res.ok && typeof data.balance !== 'undefined') {
                document.getElementById('displayBalance').textContent = formatCurrency(data.balance);
            } else {
                document.getElementById('displayBalance').textContent = formatCurrency(0);
            }
        } catch (e) {
            document.getElementById('displayBalance').textContent = formatCurrency(0);
        }
    } else {
        document.getElementById('displayBalance').textContent = formatCurrency(0);
    }

    document.getElementById('displayMemberSince').textContent = '-';

    document.getElementById('personalInfoModal').classList.add('active');
};

window.closePersonalInfoModal = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('personalInfoModal').classList.remove('active');
    }
};

// Transaction History Modal
window.openTransactionHistoryModal = function() {
    document.getElementById('transactionHistoryModal').classList.add('active');
    loadTransactions();
};

window.closeTransactionHistoryModal = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('transactionHistoryModal').classList.remove('active');
    }
};

async function loadTransactions() {
    const userId = localStorage.getItem('userId') || (JSON.parse(localStorage.getItem('currentUser') || '{}').id);
    const list = document.getElementById('transactionsList');
    
    try {
        const response = await fetch(`/api/transactions?user_id=${encodeURIComponent(userId || '')}`);
        const data = await response.json();
        
        if (data.transactions && data.transactions.length > 0) {
            list.innerHTML = data.transactions.map(t => {
                const isPositive = (t.amount || 0) >= 0 || t.type === 'refund';
                const amountAbs = Math.abs(t.amount || 0);
                const sign = isPositive ? '+' : '-';
                const amountClass = isPositive ? 'positive' : 'negative';
                const icon = t.type === 'payment' ? '💳' : (t.type === 'refund' ? '↩️' : '💰');
                const orderRef = t.order_id ? `#${t.order_id}` : '';
                return `
                <div class="txn-item">
                    <div class="txn-icon">${icon}</div>
                    <div class="txn-main">
                        <div class="txn-title">
                            <div>${t.description || (t.type === 'refund' ? 'Refund' : 'Payment')}</div>
                            <div class="txn-amount ${amountClass}">${sign}${formatCurrency(amountAbs)}</div>
                        </div>
                        <div class="txn-meta">
                            <span>${orderRef}</span>
                            <span>${formatDate(t.created_at)}</span>
                        </div>
                        ${typeof t.balance_after !== 'undefined' ? `<div class="txn-balance">Balance: ${formatCurrency(t.balance_after)}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        } else {
            list.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">No transactions yet</p>';
        }
    } catch (err) {
        list.innerHTML = '<p style="color:#dc3545; text-align:center; padding:20px;">Failed to load transactions</p>';
    }
}

// Change Email Modal
window.openChangeEmailModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    document.getElementById('currentEmailDisplay').value = user.email || '';
    document.getElementById('newEmailInput').value = '';
    document.getElementById('emailChangePassword').value = '';
    setTimeout(() => document.getElementById('changeEmailModal').classList.add('active'), 0);
};

// Dedicated handlers for Settings screen to avoid conflicts with main.js rebindings
window.settingsOpenChangeEmailModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    document.getElementById('currentEmailDisplay').value = user.email || '';
    document.getElementById('newEmailInput').value = '';
    document.getElementById('emailChangePassword').value = '';
    setTimeout(() => document.getElementById('changeEmailModal').classList.add('active'), 0);
};

window.closeChangeEmailModalNew = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('changeEmailModal').classList.remove('active');
        openSettingsModal();
    }
};

window.submitChangeEmailNew = async function(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const newEmail = document.getElementById('newEmailInput').value;
    const password = document.getElementById('emailChangePassword').value;
    
    try {
        const response = await fetch('/api/user/change-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                new_email: newEmail,
                password: password
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Email updated successfully!');
            user.email = newEmail;
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('userEmail', newEmail);
            document.getElementById('changeEmailModal').classList.remove('active');
            openSettingsModal();
        } else {
            alert(data.detail || 'Failed to update email');
        }
    } catch (err) {
        alert('Error updating email');
    }
};

// Change Phone Modal
window.openChangePhoneModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    document.getElementById('currentPhoneDisplay').value = user.phone || '';
    document.getElementById('newPhoneInput').value = '';
    document.getElementById('phoneChangePassword').value = '';
    setTimeout(() => document.getElementById('changePhoneModal').classList.add('active'), 0);
};

window.settingsOpenChangePhoneModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    document.getElementById('currentPhoneDisplay').value = user.phone || '';
    document.getElementById('newPhoneInput').value = '';
    document.getElementById('phoneChangePassword').value = '';
    setTimeout(() => document.getElementById('changePhoneModal').classList.add('active'), 0);
};

window.closeChangePhoneModalNew = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('changePhoneModal').classList.remove('active');
        openSettingsModal();
    }
};

window.submitChangePhoneNew = async function(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const newPhone = document.getElementById('newPhoneInput').value;
    const password = document.getElementById('phoneChangePassword').value;
    
    try {
        const response = await fetch('/api/user/change-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                new_phone: newPhone,
                password: password
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Phone updated successfully!');
            user.phone = newPhone;
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('userPhone', newPhone);
            document.getElementById('changePhoneModal').classList.remove('active');
            openSettingsModal();
        } else {
            alert(data.detail || 'Failed to update phone');
        }
    } catch (err) {
        alert('Error updating phone');
    }
};

// Change Username Modal
window.openChangeUsernameModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    document.getElementById('currentUsernameDisplay').value = user.username || '';
    document.getElementById('newUsernameInput').value = '';
    document.getElementById('usernameChangePassword').value = '';
    setTimeout(() => document.getElementById('changeUsernameModal').classList.add('active'), 0);
};

window.settingsOpenChangeUsernameModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    document.getElementById('currentUsernameDisplay').value = user.username || '';
    document.getElementById('newUsernameInput').value = '';
    document.getElementById('usernameChangePassword').value = '';
    setTimeout(() => document.getElementById('changeUsernameModal').classList.add('active'), 0);
};

window.closeChangeUsernameModalNew = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('changeUsernameModal').classList.remove('active');
        openSettingsModal();
    }
};

window.submitChangeUsernameNew = async function(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const newUsername = document.getElementById('newUsernameInput').value;
    const password = document.getElementById('usernameChangePassword').value;
    
    try {
        const response = await fetch('/api/user/change-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                new_username: newUsername,
                password: password
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Username updated successfully!');
            user.username = newUsername;
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('userUsername', newUsername);
            document.getElementById('changeUsernameModal').classList.remove('active');
            openSettingsModal();
        } else {
            alert(data.detail || 'Failed to update username');
        }
    } catch (err) {
        alert('Error updating username');
    }
};

// Change Password Modal
window.openChangePasswordModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    setTimeout(() => document.getElementById('changePasswordModal').classList.add('active'), 0);
};

window.settingsOpenChangePasswordModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    setTimeout(() => document.getElementById('changePasswordModal').classList.add('active'), 0);
};

window.closeChangePasswordModalNew = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('changePasswordModal').classList.remove('active');
        openSettingsModal();
    }
};

window.submitChangePasswordNew = async function(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Password updated successfully!');
            document.getElementById('changePasswordModal').classList.remove('active');
            openSettingsModal();
        } else {
            alert(data.detail || 'Failed to update password');
        }
    } catch (err) {
        alert('Error updating password');
    }
};

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
