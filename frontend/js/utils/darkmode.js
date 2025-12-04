// ========== DARK MODE UTILITIES ==========

export function initDarkMode() {
    // Check if user has a saved preference
    const savedMode = localStorage.getItem('darkMode');
    const toggle = document.getElementById('darkModeToggle');
    
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (toggle) toggle.checked = true;
    }
}

export function toggleDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    
    if (toggle && toggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
}
