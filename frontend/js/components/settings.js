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
    const settings = document.getElementById('settingsModal');
    if (settings) {
        settings.classList.add('active');
        settings.classList.remove('dimmed');
    }
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('active');
    }
};

window.closeSettingsModal = function(event) {
    // Only close if clicking directly on the settings modal overlay, not other modals
    if (!event || (event.target && event.target.id === 'settingsModal')) {
        const settings = document.getElementById('settingsModal');
        if (settings) {
            // Remove both active and dimmed classes when closing
            settings.classList.remove('active');
            settings.classList.remove('dimmed');
        }
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
    
    document.getElementById('displayEmail').textContent = user.email || '-';
    document.getElementById('displayUsername').textContent = user.username || '-';
    document.getElementById('displayFullName').textContent = user.full_name || '-';
    document.getElementById('displayPhone').textContent = user.phone || '-';

    // Try to load live balance when user id exists
    const userId = user.id;
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
        openSettingsModal();
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
        openSettingsModal();
    }
};

async function loadTransactions() {
    const userId = localStorage.getItem('userId');
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
    const currentEmail = localStorage.getItem('userEmail');
    document.getElementById('currentEmailDisplay').value = currentEmail || '';
    document.getElementById('newEmailInput').value = '';
    document.getElementById('emailChangePassword').value = '';
    setTimeout(() => document.getElementById('changeEmailModal').classList.add('active'), 0);
};

// Dedicated handlers for Settings screen to avoid conflicts with main.js rebindings
window.settingsOpenChangeEmailModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const currentEmail = localStorage.getItem('userEmail');
    document.getElementById('currentEmailDisplay').value = currentEmail || '';
    document.getElementById('newEmailInput').value = '';
    document.getElementById('emailChangePassword').value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    document.getElementById('changeEmailModal').classList.add('active');
};

window.closeChangeEmailModalNew = function(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Clear input fields
    const newEmailInput = document.getElementById('newEmailInput');
    const emailPasswordInput = document.getElementById('emailChangePassword');
    if (newEmailInput) newEmailInput.value = '';
    if (emailPasswordInput) emailPasswordInput.value = '';
    
    // Close the modal
    document.getElementById('changeEmailModal').classList.remove('active');
    // Restore Settings interactivity and ensure it's active
    const settings = document.getElementById('settingsModal');
    if (settings) {
        settings.classList.remove('dimmed');
        // Ensure settings modal stays active (don't close it)
        if (!settings.classList.contains('active')) {
            settings.classList.add('active');
        }
    }
};

window.submitChangeEmailNew = async function(event) {
    event.preventDefault();
    const user = {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        phone: localStorage.getItem('userPhone'),
        username: localStorage.getItem('userUsername')
    };
    const newEmail = document.getElementById('newEmailInput').value.trim();
    const password = document.getElementById('emailChangePassword').value;

    if (!newEmail) {
        alert('Please enter a new email');
        return;
    }

    try {
        // Verify current password first (reuse existing endpoint)
        const verifyResp = await fetch(`/api/user/verify-password?user_id=${user.id}&current_password=${encodeURIComponent(password)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const verifyData = await verifyResp.json();
        if (!verifyResp.ok) {
            const errorMsg = typeof verifyData.detail === 'string' ? verifyData.detail : JSON.stringify(verifyData.detail) || 'Current password is incorrect';
            alert(errorMsg);
            return;
        }

        const { sendChangeEmailOTP, verifyChangeEmailOTP } = await import('../utils/api.js');

        // Dim settings and close change email modal
        const changeEmailModal = document.getElementById('changeEmailModal');
        if (changeEmailModal) changeEmailModal.classList.remove('active');
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.remove('active');

        // Build OTP modal
        const otpModal = document.createElement('div');
        otpModal.className = 'modal-overlay active';
        otpModal.id = 'emailChangeOTPModal';
        otpModal.innerHTML = `
            <div class="modal-popup-small" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Verify Email Change</h3>
                    <button class="modal-close-btn" onclick="document.getElementById('emailChangeOTPModal')?.remove()">×</button>
                </div>
                <div class="modal-popup-content">
                    <p style="margin-bottom:8px;">Enter the 6-digit OTP sent to <strong>${newEmail}</strong> to confirm email change.</p>
                    <p id="emailOtpSendStatus" class="help-text" style="font-size:12px;color:#888; margin-bottom:12px;">Sending OTP…</p>
                    <div class="form-group">
                        <label>Enter OTP</label>
                        <input type="text" id="emailChangeOTPInput" maxlength="6" placeholder="123456" class="form-input"/>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" id="btnCancelEmailOTP">Cancel</button>
                        <button type="button" class="btn-save" id="btnConfirmEmailOTP">Confirm</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(otpModal);

        document.getElementById('btnCancelEmailOTP').onclick = () => {
            otpModal.remove();
            // Restore settings modal
            const settings = document.getElementById('settingsModal');
            if (settings) settings.classList.add('active');
        };

        // Send OTP to new email
        const sent = await sendChangeEmailOTP(user.id, newEmail);
        const statusEl = document.getElementById('emailOtpSendStatus');
        if (statusEl) {
            statusEl.textContent = sent.ok ? `OTP sent to ${newEmail}.` : (typeof sent.data?.detail === 'string' ? sent.data.detail : 'Failed to send OTP');
        }

        document.getElementById('btnConfirmEmailOTP').onclick = async () => {
            const code = document.getElementById('emailChangeOTPInput').value.trim();
            if (!code || code.length !== 6) {
                alert('Please enter a valid 6-digit OTP');
                return;
            }
            const verify = await verifyChangeEmailOTP(user.id, newEmail, code);
            if (verify.ok) {
                alert('Email changed successfully!');
                localStorage.setItem('userEmail', newEmail);
                otpModal.remove();
                const settings = document.getElementById('settingsModal');
                if (settings) settings.classList.add('active');
            } else {
                const errorMsg = verify.data?.detail;
                const displayMsg = typeof errorMsg === 'string' ? errorMsg : (errorMsg ? JSON.stringify(errorMsg) : 'OTP verification failed');
                alert(displayMsg);
            }
        };
    } catch (err) {
        alert('Error processing email change: ' + (err.message || err));
    }
};

// Change Phone Modal
window.openChangePhoneModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    const currentPhone = localStorage.getItem('userPhone');
    document.getElementById('currentPhoneDisplay').value = currentPhone || '';
    document.getElementById('newPhoneInput').value = '';
    document.getElementById('phoneChangePassword').value = '';
    setTimeout(() => document.getElementById('changePhoneModal').classList.add('active'), 0);
};

window.settingsOpenChangePhoneModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const currentPhone = localStorage.getItem('userPhone');
    document.getElementById('currentPhoneDisplay').value = currentPhone || '';
    document.getElementById('newPhoneInput').value = '';
    document.getElementById('phoneChangePassword').value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    document.getElementById('changePhoneModal').classList.add('active');
};

window.closeChangePhoneModalNew = function(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Clear input field
    const newPhoneInput = document.getElementById('newPhoneInput');
    if (newPhoneInput) newPhoneInput.value = '';
    
    document.getElementById('changePhoneModal').classList.remove('active');
    const settings = document.getElementById('settingsModal');
    if (settings) {
        settings.classList.remove('dimmed');
        // Ensure settings modal stays active (don't close it)
        if (!settings.classList.contains('active')) {
            settings.classList.add('active');
        }
    }
};

window.submitChangePhoneNew = async function(event) {
    event.preventDefault();
    const user = {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        phone: localStorage.getItem('userPhone'),
        username: localStorage.getItem('userUsername')
    };
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
            localStorage.setItem('userPhone', newPhone);
            // Close both modals
            document.getElementById('changePhoneModal').classList.remove('active');
            document.getElementById('settingsModal')?.classList.remove('active');
            document.getElementById('settingsModal')?.classList.remove('dimmed');
        } else {
            const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail) || 'Failed to update phone';
            alert(errorMsg);
        }
    } catch (err) {
        alert('Error updating phone: ' + (err.message || err));
    }
};

// Change Username Modal
window.openChangeUsernameModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    const currentUsername = localStorage.getItem('userUsername');
    document.getElementById('currentUsernameDisplay').value = currentUsername || '';
    document.getElementById('newUsernameInput').value = '';
    document.getElementById('usernameChangePassword').value = '';
    setTimeout(() => document.getElementById('changeUsernameModal').classList.add('active'), 0);
};

window.settingsOpenChangeUsernameModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const currentUsername = localStorage.getItem('userUsername');
    document.getElementById('currentUsernameDisplay').value = currentUsername || '';
    document.getElementById('newUsernameInput').value = '';
    document.getElementById('usernameChangePassword').value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    document.getElementById('changeUsernameModal').classList.add('active');
};

window.closeChangeUsernameModalNew = function(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Clear input fields
    const newUsernameInput = document.getElementById('newUsernameInput');
    const usernamePasswordInput = document.getElementById('usernameChangePassword');
    if (newUsernameInput) newUsernameInput.value = '';
    if (usernamePasswordInput) usernamePasswordInput.value = '';
    
    document.getElementById('changeUsernameModal').classList.remove('active');
    const settings = document.getElementById('settingsModal');
    if (settings) {
        settings.classList.remove('dimmed');
        // Ensure settings modal stays active (don't close it)
        if (!settings.classList.contains('active')) {
            settings.classList.add('active');
        }
    }
};

window.submitChangeUsernameNew = async function(event) {
    event.preventDefault();
    const user = {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        phone: localStorage.getItem('userPhone'),
        username: localStorage.getItem('userUsername')
    };
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
            localStorage.setItem('userUsername', newUsername);
            // Close both modals
            document.getElementById('changeUsernameModal').classList.remove('active');
            document.getElementById('settingsModal')?.classList.remove('active');
            document.getElementById('settingsModal')?.classList.remove('dimmed');
        } else {
            const errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail) || 'Failed to update username';
            alert(errorMsg);
        }
    } catch (err) {
        alert('Error updating username: ' + (err.message || err));
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
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    document.getElementById('changePasswordModal').classList.add('active');
};

// Clear password fields helper function
function clearPasswordFields() {
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
}

window.closeChangePasswordModalNew = function(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Clear password fields when closing modal
    clearPasswordFields();
    
    document.getElementById('changePasswordModal').classList.remove('active');
    const settings = document.getElementById('settingsModal');
    if (settings) {
        settings.classList.remove('dimmed');
        // Ensure settings modal stays active (don't close it)
        if (!settings.classList.contains('active')) {
            settings.classList.add('active');
        }
    }
};

window.submitChangePasswordNew = async function(event) {
    event.preventDefault();
    const user = {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        phone: localStorage.getItem('userPhone'),
        username: localStorage.getItem('userUsername')
    };
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    try {
        // Verify current password first
        const verifyResp = await fetch(`/api/user/verify-password?user_id=${user.id}&current_password=${encodeURIComponent(currentPassword)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const verifyData = await verifyResp.json();
        if (!verifyResp.ok) {
            const errorMsg = typeof verifyData.detail === 'string' ? verifyData.detail : JSON.stringify(verifyData.detail) || 'Current password is incorrect';
            alert(errorMsg);
            return;
        }

        const { sendChangePasswordOTP, verifyChangePasswordOTP } = await import('../utils/api.js');

        // Close the change password modal and the Settings modal immediately
        const changePwdModal = document.getElementById('changePasswordModal');
        if (changePwdModal) changePwdModal.classList.remove('active');
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.remove('active');

        // Build OTP modal immediately (no waiting for email sending)
        const otpModal = document.createElement('div');
        otpModal.className = 'modal-overlay active';
        otpModal.id = 'passwordChangeOTPModal';
        otpModal.innerHTML = `
            <div class="modal-popup-small" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Verify Password Change</h3>
                    <button class="modal-close-btn" onclick="document.getElementById('passwordChangeOTPModal')?.remove()">×</button>
                </div>
                <div class="modal-popup-content">
                    <p style="margin-bottom:8px;">Enter the 6-digit OTP sent to your email to confirm password change.</p>
                    <p id="otpSendStatus" class="help-text" style="font-size:12px;color:#888; margin-bottom:12px;">Sending OTP…</p>
                    <div class="form-group">
                        <label>Enter OTP</label>
                        <input type="text" id="passwordChangeOTPInput" maxlength="6" placeholder="123456" class="form-input"/>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" id="btnCancelPasswordOTP">Cancel</button>
                        <button type="button" class="btn-save" id="btnConfirmPasswordOTP">Confirm</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(otpModal);

        document.getElementById('btnCancelPasswordOTP').onclick = () => {
            otpModal.remove();
        };

        // Fire OTP send in background and update status
        const sent = await sendChangePasswordOTP(user.id);
        const statusEl = document.getElementById('otpSendStatus');
        if (statusEl) {
            statusEl.textContent = sent.ok ? 'OTP sent to your email.' : (typeof sent.data?.detail === 'string' ? sent.data.detail : 'Failed to send OTP');
        }
        document.getElementById('btnConfirmPasswordOTP').onclick = async () => {
            const code = document.getElementById('passwordChangeOTPInput').value.trim();
            if (!code || code.length !== 6) {
                alert('Please enter a valid 6-digit OTP');
                return;
            }
            const verify = await verifyChangePasswordOTP(user.id, code, newPassword);
            if (verify.ok) {
                // Show success message first
                alert('Password changed successfully! Please login again.');
                
                // Ensure OTP modal is removed before logout
                try { otpModal.remove(); } catch (e) {}

                // Logout will handle clearing storage and removing other modals
                const { logout } = await import('./auth.js');
                logout();
            } else {
                const errorMsg = verify.data?.detail;
                const displayMsg = typeof errorMsg === 'string' ? errorMsg : (errorMsg ? JSON.stringify(errorMsg) : 'OTP verification failed');
                alert(displayMsg);
            }
        };
    } catch (err) {
        alert('Error processing password change: ' + (err.message || err));
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
