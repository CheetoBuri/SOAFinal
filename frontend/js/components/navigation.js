// ========== NAVIGATION COMPONENT ==========
import * as ui from '../utils/ui.js';
import { state, setCurrentView } from '../utils/state.js';
import { loadOrderHistory, loadOrderStatus } from './orders.js';
import { loadFavoritesView } from './menu.js';
import { loadProfileData, loadTransactionHistory } from './profile.js';

export function switchView(view) {
    const shopControls = document.getElementById('shopControls');
    const cartSidebar = document.querySelector('.cart-sidebar');
    
    // Handle profile as modal (don't change view)
    if (view === 'profile') {
        ui.openModal('profileModal');
        loadProfileData();
        loadTransactionHistory();
        return; // Don't change the current view
    }
    
    // For other views, proceed normally
    ui.setActive('.view', null);
    setCurrentView(view);
    
    if (view === 'shop') {
        document.getElementById('shopView')?.classList.add('active');
        if (shopControls) shopControls.style.display = 'block';
        if (cartSidebar) cartSidebar.style.display = 'block';
    } else if (view === 'orderStatus') {
        document.getElementById('orderStatusView')?.classList.add('active');
        if (shopControls) shopControls.style.display = 'none';
        if (cartSidebar) cartSidebar.style.display = 'none';
        loadOrderStatus();
    } else if (view === 'history') {
        document.getElementById('historyView')?.classList.add('active');
        if (shopControls) shopControls.style.display = 'none';
        if (cartSidebar) cartSidebar.style.display = 'none';
        loadOrderHistory();
    } else if (view === 'favorites') {
        document.getElementById('favoritesView')?.classList.add('active');
        if (shopControls) shopControls.style.display = 'block';
        if (cartSidebar) cartSidebar.style.display = 'block';
        loadFavoritesView();
    }
}
