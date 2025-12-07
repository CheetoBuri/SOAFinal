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
window.openSettingsModal = function(event) {
    // Prevent event bubbling if called from dropdown
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
    // Close dropdown first
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('active');
    }
    
    // Use setTimeout to ensure dropdown closes before opening modal
    setTimeout(() => {
        let settings = document.getElementById('settingsModal');
        if (!settings) {
            // Safely inject a single instance matching index.html structure
            const wrapper = document.createElement('div');
            wrapper.id = 'settingsModal';
            wrapper.className = 'modal-overlay';
            wrapper.setAttribute('onclick', 'closeSettingsModal(event)');
            wrapper.innerHTML = `
                <div class="modal-popup" onclick="event.stopPropagation()">
                    <div class="modal-popup-header">
                        <h3>Settings</h3>
                        <button class="modal-close-btn" onclick="closeSettingsModal()">×</button>
                    </div>
                    <div class="modal-popup-content">
                        <div class="settings-section">
                            <h3>ACCOUNT DETAILS</h3>
                            <button class="settings-item" onclick="openPersonalInfoModal()">
                                <div class="settings-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <span>Personal Information</span>
                                <svg class="settings-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <button class="settings-item" onclick="settingsOpenChangeEmailModal()">
                                <div class="settings-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <span>Change Email</span>
                                <svg class="settings-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <button class="settings-item" onclick="settingsOpenChangePhoneModal()">
                                <div class="settings-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                </div>
                                <span>Change Phone</span>
                                <svg class="settings-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <button class="settings-item" onclick="settingsOpenChangeUsernameModal()">
                                <div class="settings-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <span>Change Username</span>
                                <svg class="settings-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <button class="settings-item" onclick="settingsOpenChangePasswordModal()">
                                <div class="settings-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <span>Change Password</span>
                                <svg class="settings-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <button class="settings-item" onclick="openTransactionHistoryModal()">
                                <div class="settings-item-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                </div>
                                <span>Transaction History</span>
                                <svg class="settings-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(wrapper);
            settings = wrapper;
        }
        settings.classList.add('active');
        settings.classList.remove('dimmed');
        document.body.style.overflow = 'hidden';
        try { 
            ensureAllModalsExist();
            initSettingsInteractivity(); 
        } catch {}
        console.log('Settings modal opened');
    }, 50);
};

window.closeSettingsModal = function(event) {
    // Only close if clicking directly on the settings modal overlay, not other modals
    if (!event || (event.target && event.target.id === 'settingsModal')) {
        const settings = document.getElementById('settingsModal');
        if (settings) {
            // Remove both active and dimmed classes when closing
            settings.classList.remove('active');
            settings.classList.remove('dimmed');
            document.body.style.overflow = '';
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
    
    const elEmail = document.getElementById('displayEmail');
    const elUsername = document.getElementById('displayUsername');
    const elFullName = document.getElementById('displayFullName');
    const elPhone = document.getElementById('displayPhone');
    if (elEmail) elEmail.textContent = user.email || '-';
    if (elUsername) elUsername.textContent = user.username || '-';
    if (elFullName) elFullName.textContent = user.full_name || '-';
    if (elPhone) elPhone.textContent = user.phone || '-';

    // Try to load live balance when user id exists
    const userId = user.id;
    if (userId) {
        try {
            const res = await fetch(`/api/user/balance?user_id=${userId}`);
            const data = await res.json();
            const balEl = document.getElementById('displayBalance');
            if (balEl) {
                if (res.ok && typeof data.balance !== 'undefined') {
                    balEl.textContent = formatCurrency(data.balance);
                } else {
                    balEl.textContent = formatCurrency(0);
                }
            }
        } catch (e) {
            const balEl = document.getElementById('displayBalance');
            if (balEl) balEl.textContent = formatCurrency(0);
        }
    } else {
        const balEl = document.getElementById('displayBalance');
        if (balEl) balEl.textContent = formatCurrency(0);
    }
    const memEl = document.getElementById('displayMemberSince');
    if (memEl) memEl.textContent = '-';

    const pi = document.getElementById('personalInfoModal');
    if (pi) pi.classList.add('active');
};

window.closePersonalInfoModal = function(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('personalInfoModal').classList.remove('active');
        openSettingsModal();
    }
};

// Transaction History Modal
window.openTransactionHistoryModal = function() {
    const th = document.getElementById('transactionHistoryModal');
    if (th) th.classList.add('active');
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
    if (!list) {
        // Transactions container not present; avoid throwing and exit gracefully
        return;
    }
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
        if (list) {
            list.innerHTML = '<p style="color:#dc3545; text-align:center; padding:20px;">Failed to load transactions</p>';
        }
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
    const curEl = document.getElementById('currentEmailDisplay');
    const newEl = document.getElementById('newEmailInput');
    const pwdEl = document.getElementById('emailChangePassword');
    if (curEl) curEl.value = currentEmail || '';
    if (newEl) newEl.value = '';
    if (pwdEl) pwdEl.value = '';
    const modal = document.getElementById('changeEmailModal');
    if (modal) setTimeout(() => modal.classList.add('active'), 0);
};

// Dedicated handlers for Settings screen to avoid conflicts with main.js rebindings
window.settingsOpenChangeEmailModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const currentEmail = localStorage.getItem('userEmail');
    const curEl = document.getElementById('currentEmailDisplay');
    const newEl = document.getElementById('newEmailInput');
    const pwdEl = document.getElementById('emailChangePassword');
    if (curEl) curEl.value = currentEmail || '';
    if (newEl) newEl.value = '';
    if (pwdEl) pwdEl.value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    const modal = document.getElementById('changeEmailModal');
    if (modal) modal.classList.add('active');
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
window.openChangePhoneModal = function(event) {
    if (event) event.stopPropagation();
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.remove('active');
    const personal = document.getElementById('personalInfoModal');
    if (personal) personal.classList.remove('active');
    const currentPhone = localStorage.getItem('userPhone');
    const curEl = document.getElementById('currentPhoneDisplay');
    const newEl = document.getElementById('newPhoneInput');
    const pwdEl = document.getElementById('phoneChangePassword');
    if (curEl) curEl.value = currentPhone || '';
    if (newEl) newEl.value = '';
    if (pwdEl) pwdEl.value = '';
    const modal = document.getElementById('changePhoneModal');
    if (modal) setTimeout(() => modal.classList.add('active'), 0);
};

window.settingsOpenChangePhoneModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const currentPhone = localStorage.getItem('userPhone');
    const curEl = document.getElementById('currentPhoneDisplay');
    const newEl = document.getElementById('newPhoneInput');
    const pwdEl = document.getElementById('phoneChangePassword');
    if (curEl) curEl.value = currentPhone || '';
    if (newEl) newEl.value = '';
    if (pwdEl) pwdEl.value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    const modal = document.getElementById('changePhoneModal');
    if (modal) modal.classList.add('active');
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
    const curEl = document.getElementById('currentUsernameDisplay');
    const newEl = document.getElementById('newUsernameInput');
    const pwdEl = document.getElementById('usernameChangePassword');
    if (curEl) curEl.value = currentUsername || '';
    if (newEl) newEl.value = '';
    if (pwdEl) pwdEl.value = '';
    const modal = document.getElementById('changeUsernameModal');
    if (modal) setTimeout(() => modal.classList.add('active'), 0);
};

window.settingsOpenChangeUsernameModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const currentUsername = localStorage.getItem('userUsername');
    const curEl = document.getElementById('currentUsernameDisplay');
    const newEl = document.getElementById('newUsernameInput');
    const pwdEl = document.getElementById('usernameChangePassword');
    if (curEl) curEl.value = currentUsername || '';
    if (newEl) newEl.value = '';
    if (pwdEl) pwdEl.value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    const modal = document.getElementById('changeUsernameModal');
    if (modal) modal.classList.add('active');
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
    const curEl = document.getElementById('currentPasswordInput');
    const newEl = document.getElementById('newPasswordInput');
    const confEl = document.getElementById('confirmPasswordInput');
    if (curEl) curEl.value = '';
    if (newEl) newEl.value = '';
    if (confEl) confEl.value = '';
    const modal = document.getElementById('changePasswordModal');
    if (modal) setTimeout(() => modal.classList.add('active'), 0);
};

window.settingsOpenChangePasswordModal = function(event) {
    if (event) event.stopPropagation();
    // Don't close settings modal - keep it open like Personal Info (it will be dimmed behind)
    const curEl = document.getElementById('currentPasswordInput');
    const newEl = document.getElementById('newPasswordInput');
    const confEl = document.getElementById('confirmPasswordInput');
    if (curEl) curEl.value = '';
    if (newEl) newEl.value = '';
    if (confEl) confEl.value = '';
    // Add a class to dim the settings modal
    const settings = document.getElementById('settingsModal');
    if (settings) settings.classList.add('dimmed');
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.classList.add('active');
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

function initSettingsInteractivity() {
    const root = document.getElementById('settingsModal');
    if (!root) {
        console.warn('initSettingsInteractivity: root modal not found');
        return;
    }

    const map = [
        { selectorIndex: 1, handler: () => openPersonalInfoModal(), name: 'Personal Info' },
        { selectorIndex: 2, handler: () => settingsOpenChangeEmailModal(), name: 'Change Email' },
        { selectorIndex: 3, handler: () => settingsOpenChangePhoneModal(), name: 'Change Phone' },
        { selectorIndex: 4, handler: () => settingsOpenChangeUsernameModal(), name: 'Change Username' },
        { selectorIndex: 5, handler: () => settingsOpenChangePasswordModal(), name: 'Change Password' },
        { selectorIndex: 6, handler: () => openTransactionHistoryModal(), name: 'Transaction History' },
    ];

    map.forEach(({ selectorIndex, handler, name }) => {
        const btn = root.querySelector(`.settings-item:nth-of-type(${selectorIndex})`);
        if (btn) {
            if (!btn.__bound) {
                btn.addEventListener('click', (e) => {
                    console.log(`Settings button clicked: ${name}`);
                    e.stopPropagation();
                    e.preventDefault();
                    try {
                        handler(e);
                    } catch (err) {
                        console.error(`Error in ${name} handler:`, err);
                    }
                });
                btn.__bound = true;
                console.log(`Bound ${name} to button ${selectorIndex}`);
            }
        } else {
            console.warn(`Button ${selectorIndex} (${name}) not found in settings modal`);
        }
    });
}

// Ensure all required modals exist in DOM
function ensureAllModalsExist() {
    // Personal Info Modal
    if (!document.getElementById('personalInfoModal')) {
        const pi = document.createElement('div');
        pi.id = 'personalInfoModal';
        pi.className = 'modal-overlay';
        pi.setAttribute('onclick', 'closePersonalInfoModal(event)');
        pi.innerHTML = `
            <div class="modal-popup" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Personal Information</h3>
                    <button class="modal-close-btn" onclick="closePersonalInfoModal()">×</button>
                </div>
                <div class="modal-popup-content">
                    <div class="info-display">
                        <div class="info-item">
                            <span class="info-label">Email</span>
                            <span class="info-value" id="displayEmail">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Username</span>
                            <span class="info-value" id="displayUsername">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Full Name</span>
                            <span class="info-value" id="displayFullName">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone</span>
                            <span class="info-value" id="displayPhone">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Balance</span>
                            <span class="info-value" id="displayBalance" style="color: var(--primary); font-weight: 700;">₫0</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Member Since</span>
                            <span class="info-value" id="displayMemberSince">-</span>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(pi);
    }

    // Transaction History Modal
    if (!document.getElementById('transactionHistoryModal')) {
        const th = document.createElement('div');
        th.id = 'transactionHistoryModal';
        th.className = 'modal-overlay';
        th.setAttribute('onclick', 'closeTransactionHistoryModal(event)');
        th.innerHTML = `
            <div class="modal-popup" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Transaction History</h3>
                    <button class="modal-close-btn" onclick="closeTransactionHistoryModal()">×</button>
                </div>
                <div class="modal-popup-content">
                    <div id="transactionsList" class="transactions-list">
                        <p style="color:#999; text-align:center; padding:20px;">Loading...</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(th);
    }

    // Change Email Modal
    if (!document.getElementById('changeEmailModal')) {
        const ce = document.createElement('div');
        ce.id = 'changeEmailModal';
        ce.className = 'modal-overlay';
        ce.setAttribute('onclick', 'closeChangeEmailModalNew(event)');
        ce.innerHTML = `
            <div class="modal-popup-small" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Change Email</h3>
                    <button class="modal-close-btn" onclick="closeChangeEmailModalNew()">×</button>
                </div>
                <div class="modal-popup-content">
                    <form onsubmit="submitChangeEmailNew(event)">
                        <div class="form-group">
                            <label>Current Email</label>
                            <input type="email" id="currentEmailDisplay" readonly>
                        </div>
                        <div class="form-group">
                            <label>New Email</label>
                            <input type="email" id="newEmailInput" required placeholder="new@email.com">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="emailChangePassword" required placeholder="Enter password">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeChangeEmailModalNew()">Cancel</button>
                            <button type="submit" class="btn-save">Save</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.appendChild(ce);
    }

    // Change Phone Modal
    if (!document.getElementById('changePhoneModal')) {
        const cp = document.createElement('div');
        cp.id = 'changePhoneModal';
        cp.className = 'modal-overlay';
        cp.setAttribute('onclick', 'closeChangePhoneModalNew(event)');
        cp.innerHTML = `
            <div class="modal-popup-small" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Change Phone</h3>
                    <button class="modal-close-btn" onclick="closeChangePhoneModalNew()">×</button>
                </div>
                <div class="modal-popup-content">
                    <form onsubmit="submitChangePhoneNew(event)">
                        <div class="form-group">
                            <label>Current Phone</label>
                            <input type="tel" id="currentPhoneDisplay" readonly>
                        </div>
                        <div class="form-group">
                            <label>New Phone</label>
                            <input type="tel" id="newPhoneInput" required placeholder="0123456789">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="phoneChangePassword" required placeholder="Enter password">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeChangePhoneModalNew()">Cancel</button>
                            <button type="submit" class="btn-save">Save</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.appendChild(cp);
    }

    // Change Username Modal
    if (!document.getElementById('changeUsernameModal')) {
        const cu = document.createElement('div');
        cu.id = 'changeUsernameModal';
        cu.className = 'modal-overlay';
        cu.setAttribute('onclick', 'closeChangeUsernameModalNew(event)');
        cu.innerHTML = `
            <div class="modal-popup-small" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Change Username</h3>
                    <button class="modal-close-btn" onclick="closeChangeUsernameModalNew()">×</button>
                </div>
                <div class="modal-popup-content">
                    <form onsubmit="submitChangeUsernameNew(event)">
                        <div class="form-group">
                            <label>Current Username</label>
                            <input type="text" id="currentUsernameDisplay" readonly>
                        </div>
                        <div class="form-group">
                            <label>New Username</label>
                            <input type="text" id="newUsernameInput" required placeholder="newusername">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="usernameChangePassword" required placeholder="Enter password">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeChangeUsernameModalNew()">Cancel</button>
                            <button type="submit" class="btn-save">Save</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.appendChild(cu);
    }

    // Change Password Modal
    if (!document.getElementById('changePasswordModal')) {
        const cpw = document.createElement('div');
        cpw.id = 'changePasswordModal';
        cpw.className = 'modal-overlay';
        cpw.setAttribute('onclick', 'closeChangePasswordModalNew(event)');
        cpw.innerHTML = `
            <div class="modal-popup-small" onclick="event.stopPropagation()">
                <div class="modal-popup-header">
                    <h3>Change Password</h3>
                    <button class="modal-close-btn" onclick="closeChangePasswordModalNew()">×</button>
                </div>
                <div class="modal-popup-content">
                    <form onsubmit="submitChangePasswordNew(event)">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" id="currentPasswordInput" required placeholder="Current password">
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" id="newPasswordInput" required placeholder="New password">
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" id="confirmPasswordInput" required placeholder="Confirm password">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeChangePasswordModalNew()">Cancel</button>
                            <button type="submit" class="btn-save">Save</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.appendChild(cpw);
    }
}

// Try to bind once on load
try { initSettingsInteractivity(); } catch {}
