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
    if (field) {
        field.type = field.type === 'password' ? 'text' : 'password';
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
