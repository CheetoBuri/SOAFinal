// ========== UI UTILITIES ========== v2.1

// Show/hide elements
export function showElement(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        if (elementId === 'authScreen') {
            el.style.display = 'flex';
        } else {
            el.style.display = 'block';
        }
    }
}

export function hideElement(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.style.display = 'none';
    }
}

// Alert messages
export function showSuccess(message) {
    alert(`✅ ${message}`);
}

export function showError(message) {
    alert(`❌ ${message}`);
}

// Error message display in forms
export function displayError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    }
}

export function displaySuccess(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.innerHTML = `<div class="success-message">✅ ${message}</div>`;
    }
}

export function clearError(elementId) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.innerHTML = '';
    }
}

// Format currency
export function formatCurrency(amount) {
    return `${amount.toLocaleString('vi-VN')} ₫`;
}

// Format date
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add/remove active class
export function setActive(selector, element) {
    document.querySelectorAll(selector).forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
}

// Modal utilities
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Add click listener to close modal when clicking backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Toggle password visibility
export function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field?.parentElement?.querySelector('.password-toggle');
    
    if (field && button) {
        const isPassword = field.type === 'password';
        field.type = isPassword ? 'text' : 'password';
        
        // Update icon based on state
        if (isPassword) {
            // Password is now visible - show "eye" icon
            button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>`;
        } else {
            // Password is now hidden - show "eye-off" icon with slash
            button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>`;
        }
    }
}

// Clear form
export function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}

// Loading state
export function setLoading(buttonElement, isLoading) {
    if (!buttonElement) return;
    
    if (isLoading) {
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.textContent;
        buttonElement.textContent = 'Loading...';
    } else {
        buttonElement.disabled = false;
        buttonElement.textContent = buttonElement.dataset.originalText || 'Submit';
    }
}
