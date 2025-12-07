// ========== REVIEWS COMPONENT ==========
import { loadOrderHistory } from './orders.js';

/**
 * Submit a review for a product
 */
async function submitReview(productId, rating, reviewText = '') {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        alert('Please log in to submit a review');
        return false;
    }
    
    if (rating < 1 || rating > 5) {
        alert('Please select a rating');
        return false;
    }
    
    try {
        const response = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId,
                rating: parseInt(rating),
                review_text: reviewText.trim()
            })
        });
        
        if (response.ok) {
            alert('Thank you for your review!');
            closeReviewModal();
            loadProductReviews(productId);  // Refresh reviews
            return true;
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
            return false;
        }
    } catch (error) {
        console.error('Review submission error:', error);
        alert('Failed to submit review');
        return false;
    }
}

/**
 * Load and display reviews for a product
 */
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/reviews/product/${productId}?limit=10`);
        const data = await response.json();
        
        displayReviews(data);
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

/**
 * Display reviews on product card
 */
function displayReviews(reviewData) {
    const avgRating = reviewData.average_rating || 0;
    const totalReviews = reviewData.total_reviews || 0;
    
    // Update product card
    const ratingElement = document.querySelector(`[data-rating="${reviewData.product_id}"]`);
    if (ratingElement) {
        ratingElement.innerHTML = `
            <div class="product-rating">
                <span class="stars">${renderStars(avgRating)}</span>
                <span class="rating-value">${avgRating.toFixed(1)}</span>
                <span class="review-count">(${totalReviews})</span>
            </div>
        `;
    }
    
    // Display individual reviews
    const reviewsContainer = document.querySelector(`[data-reviews="${reviewData.product_id}"]`);
    if (reviewsContainer) {
        reviewsContainer.innerHTML = reviewData.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="stars">${renderStars(review.rating)}</span>
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div class="review-text">${review.review_text || '(No comment)'}</div>
                ${review.user_id === localStorage.getItem('userId') ? `
                    <button class="btn-delete-review" onclick="deleteReview(${review.id})">Delete</button>
                ` : ''}
            </div>
        `).join('');
    }
}

/**
 * Render star display
 */
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalf) stars += '✦';
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return stars;
}

/**
 * Delete a review
 */
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch(`/api/reviews/${reviewId}?user_id=${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Review deleted');
            location.reload();  // Refresh
        } else {
            const error = await response.json();
            alert('Error: ' + error.detail);
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
    }
}

/**
 * Open review modal
 */
function openReviewModal(productId) {
    document.getElementById('reviewModal').classList.add('active');
    document.getElementById('reviewProductId').value = productId;
    document.getElementById('reviewRating').value = 5;
    document.getElementById('reviewText').value = '';
    updateStarDisplay(5);  // Show 5 stars initially
}

/**
 * Close review modal
 */
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

/**
 * Update star display when selecting rating
 */
function updateStarDisplay(rating) {
    const buttons = document.querySelectorAll('.stars-input button.star');
    buttons.forEach((btn, idx) => {
        if (idx < rating) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Open order review modal (for product + service review)
 */
function openOrderReviewModal(orderId, orderItems) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        // User not logged in - this shouldn't happen as review button only shows when logged in
        // But just in case, silently return
        console.warn('User must be logged in to review');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'orderReviewModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; backdrop-filter:blur(2px);';
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeOrderReviewModal();
        }
    });
    
    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            window.closeOrderReviewModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Build items list for review
    const itemsHTML = orderItems.map((item, idx) => {
        const productName = item.product_name || item.name || 'Product';
        const itemSize = item.size && item.size !== 'M' ? ` (${item.size})` : '';
        
        return `
        <div class="review-item-section" data-item-index="${idx}" style="background:white; padding:16px; border-radius:12px; margin-bottom:12px; border:1.5px solid #e5e7eb;">
            <h4 style="margin:0 0 12px; color:#1a1a1a; font-size:14px; font-weight:600;">
                ${productName}${itemSize}
            </h4>
            
            <!-- Product Rating -->
            <div class="rating-group" style="margin-bottom:12px;">
                <label style="display:block; margin-bottom:8px; color:#4b5563; font-size:13px; font-weight:500;">
                    Product Quality Rating *
                </label>
                <div class="stars-input" data-stars-for="${idx}" style="display:flex; gap:4px; margin-bottom:8px;">
                    ${[1,2,3,4,5].map(rating => `
                        <button type="button" class="star product-star" 
                            onclick="window.updateProductRating(${idx}, ${rating})"
                            data-rating="${rating}"
                            style="background:none; border:none; font-size:28px; cursor:pointer; padding:0; color:#e5e7eb; transition:all 0.2s;">
                            ★
                        </button>
                    `).join('')}
                </div>
                <input type="hidden" id="productRating_${idx}" value="">
            </div>
            
            <!-- Product Review Text -->
            <div class="form-group">
                <label style="display:block; margin-bottom:6px; color:#6b7280; font-size:12px;">
                    Your Review (Optional)
                </label>
                <textarea id="productReviewText_${idx}" 
                    placeholder="Share your experience with this product..."
                    style="width:100%; padding:10px 12px; border:1.5px solid #e5e7eb; border-radius:8px; resize:vertical; min-height:70px; font-size:13px; font-family:inherit; transition:border-color 0.2s;"
                    onfocus="this.style.borderColor='#d1d5db'"
                    onblur="this.style.borderColor='#e5e7eb'"></textarea>
            </div>
        </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()" style="background:white; max-width:540px; width:100%; max-height:88vh; display:flex; flex-direction:column; border-radius:16px; box-shadow:0 8px 32px rgba(0,0,0,0.15); overflow:hidden;">
            <div class="modal-header" style="background:white; padding:20px 24px 16px; flex-shrink:0; position:relative; border-bottom:1px solid #e5e7eb;">
                <h2 style="margin:0; font-size:18px; font-weight:600; color:#1a1a1a; padding-right:36px;">Rate and review</h2>
                <p style="margin:4px 0 0; font-size:13px; color:#666;">Order #${orderId}</p>
                <button onclick="window.closeOrderReviewModal()" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:#666; font-size:26px; cursor:pointer; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all 0.2s; line-height:1; font-weight:300;" onmouseover="this.style.background='#f5f5f5'; this.style.color='#333'" onmouseout="this.style.background='transparent'; this.style.color='#666'">×</button>
            </div>
            <div style="padding:20px 24px; background:#fafafa; overflow-y:auto; flex:1;">
                <div style="margin-bottom:20px;">
                    <div style="color:#333; margin:0 0 12px; font-size:14px; font-weight:600;">Products</div>
                    ${itemsHTML}
                </div>
                
                <div style="background:#f8f9fa; padding:16px; border-radius:8px; border:1px solid #e0e0e0;">
                    <div style="color:#202124; margin:0 0 10px; font-size:14px; font-weight:500;">Delivery Service</div>
                    
                    <!-- Service Rating -->
                    <div class="rating-group" style="margin-bottom:12px;">
                        <label style="display:block; margin-bottom:8px; color:#4b5563; font-size:13px; font-weight:500;">
                            Service Rating (Optional)
                        </label>
                        <div class="stars-input" style="display:flex; gap:4px; margin-bottom:8px;">
                            ${[1,2,3,4,5].map(rating => `
                                <button type="button" class="star service-star" 
                                    onclick="updateServiceRating(${rating})"
                                    style="background:none; border:none; font-size:28px; cursor:pointer; padding:0; color:#e5e7eb; transition:all 0.2s;">
                                    ★
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="serviceRating" value="">
                        <p style="color:#9ca3af; font-size:11px; margin:0;">
                            Rate delivery speed, packaging quality, and shipper professionalism
                        </p>
                    </div>
                    
                    <!-- Service Review Text -->
                    <div class="form-group">
                        <label style="display:block; margin-bottom:6px; color:#6b7280; font-size:12px;">
                            Your Feedback (Optional)
                        </label>
                        <textarea id="serviceReviewText" 
                            placeholder="Share your delivery experience..."
                            style="width:100%; padding:10px 12px; border:1.5px solid #e5e7eb; border-radius:8px; resize:vertical; min-height:70px; font-size:13px; font-family:inherit; transition:border-color 0.2s;"
                            onfocus="this.style.borderColor='#d1d5db'"
                            onblur="this.style.borderColor='#e5e7eb'"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-buttons" style="padding:16px 24px; background:white; border-top:1px solid #e5e7eb; display:flex; gap:10px; justify-content:flex-end; flex-shrink:0;">
                <button type="button" class="btn-cancel" onclick="window.closeOrderReviewModal()"
                    style="padding:10px 20px; background:white; border:1.5px solid #ddd; color:#555; border-radius:8px; font-size:14px; cursor:pointer; font-weight:500; transition:all 0.2s;"
                    onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#bbb'"
                    onmouseout="this.style.background='white'; this.style.borderColor='#ddd'">
                    Cancel
                </button>
                <button type="button" class="btn-submit" onclick="window.submitOrderReviews('${orderId}', ${JSON.stringify(orderItems).replace(/"/g, '&quot;')})"
                    style="padding:10px 24px; background:#333; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer; font-weight:500; transition:all 0.2s; box-shadow:0 2px 6px rgba(0,0,0,0.15);"
                    onmouseover="this.style.background='#000'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'"
                    onmouseout="this.style.background='#333'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'">
                    Submit Review
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add CSS for active stars with modern styling
    const style = document.createElement('style');
    style.innerHTML = `
        .product-star.active,
        .service-star.active { 
            color: #fbbf24 !important; 
            transform: scale(1.1);
            filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
        }
        .product-star:hover,
        .service-star:hover { 
            color: #fde68a !important; 
            transform: scale(1.15);
        }
        .product-star:active,
        .service-star:active {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Update product rating for specific item
 */
function updateProductRating(itemIndex, rating) {
    document.getElementById(`productRating_${itemIndex}`).value = rating;
    
    // Update star display for this item using data attribute
    const starsContainer = document.querySelector(`[data-stars-for="${itemIndex}"]`);
    if (starsContainer) {
        const stars = starsContainer.querySelectorAll('.product-star');
        stars.forEach((star, idx) => {
            if (idx < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
}

/**
 * Update service rating
 */
function updateServiceRating(rating) {
    document.getElementById('serviceRating').value = rating;
    
    // Update star display
    const stars = document.querySelectorAll('.service-star');
    stars.forEach((star, idx) => {
        if (idx < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

/**
 * Submit all reviews for order (products + service)
 */
async function submitOrderReviews(orderId, orderItems) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please log in to submit reviews');
        return;
    }
    
    console.log('=== Submit Reviews Debug ===');
    console.log('Order ID:', orderId);
    console.log('Order Items:', orderItems);
    console.log('User ID:', userId);
    
    // Collect service review
    const serviceRating = document.getElementById('serviceRating').value;
    const serviceReviewText = document.getElementById('serviceReviewText').value.trim();
    
    try {
        // Submit review for each product
        for (let i = 0; i < orderItems.length; i++) {
            const item = orderItems[i];
            console.log(`Item ${i}:`, item);
            
            const productRating = document.getElementById(`productRating_${i}`).value;
            const productReviewText = document.getElementById(`productReviewText_${i}`).value.trim();
            
            // Validate product rating
            if (!productRating || productRating === '' || parseInt(productRating) < 1) {
                alert(`Please rate ${item.product_name || item.name || 'product'} before submitting!`);
                return;
            }
            
            // Get correct product_id - items from order have 'id' field which is the product ID
            const productId = item.id || item.product_id;
            console.log(`Product ID for item ${i}:`, productId);
            
            if (!productId) {
                console.error('Missing product_id for item:', item);
                alert('Error: Unable to identify product. Please try again.');
                return;
            }
            
            const reviewData = {
                user_id: userId,
                product_id: productId,
                rating: parseInt(productRating),
                review_text: productReviewText || null,
                service_rating: serviceRating ? parseInt(serviceRating) : null,
                service_review_text: serviceReviewText || null,
                order_id: orderId
            };
            
            console.log('Submitting review:', reviewData);
            
            const response = await fetch('/api/reviews/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                console.error('Review API error:', error);
                throw new Error(error.detail || JSON.stringify(error));
            }
        }
        
        // Success!
        alert('✅ Thank you for your reviews!');
        closeOrderReviewModal();
        
        // Reload order history to update UI and show View Review button
        await loadOrderHistory();
        
    } catch (error) {
        console.error('Review submission error:', error);
        alert('❌ Failed to submit reviews: ' + error.message);
    }
}

/**
 * Close order review modal
 */
function closeOrderReviewModal() {
    const modal = document.getElementById('orderReviewModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Open modal to view submitted reviews with provided data
 */
window.openViewReviewModalDirect = function(orderId, reviews) {
    if (!reviews || reviews.length === 0) {
        alert('ℹ️ No reviews found for this order');
        return;
    }
    
    // Get service rating from first review (since it's the same for all items in order)
    const serviceRating = reviews[0].service_rating;
    const serviceReviewText = reviews[0].service_review_text;
    const reviewDate = new Date(reviews[0].created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create modal HTML with click outside to close
    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'viewReviewModal';
    modalWrapper.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.3); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(2px);';
    
    // Close on click outside
    modalWrapper.addEventListener('click', (e) => {
        if (e.target === modalWrapper) {
            window.closeViewReviewModal();
        }
    });
    
    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            window.closeViewReviewModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    let modalHTML = `
        <div onclick="event.stopPropagation()" style="background:white; border-radius:16px; max-width:540px; width:100%; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 8px 32px rgba(0,0,0,0.15); overflow:hidden;">
            <div style="background:white; border-bottom:1px solid #e5e7eb; padding:20px 24px 16px; flex-shrink:0; position:relative;">
                <h2 style="margin:0; font-size:18px; font-weight:600; color:#1a1a1a; padding-right:36px;">Your review</h2>
                <p style="margin:4px 0 0; font-size:13px; color:#666;">Order #${orderId} • ${reviewDate}</p>
                <button onclick="window.closeViewReviewModal()" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:#666; font-size:26px; cursor:pointer; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all 0.2s; line-height:1; font-weight:300;" onmouseover="this.style.background='#f5f5f5'; this.style.color='#333'" onmouseout="this.style.background='transparent'; this.style.color='#666'">×</button>
            </div>
            <div style="padding:20px 24px 24px; background:#fafafa; overflow-y:auto; flex:1;">
                <div style="margin-bottom:16px;">
                    <div style="color:#333; font-size:14px; font-weight:600; margin:0 0 12px 0;">Products</div>
    `;
    
    // Add each product review
    for (const review of reviews) {
        modalHTML += `
            <div style="background:white; border-radius:12px; padding:16px; margin-bottom:12px; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="color:#1a1a1a; font-size:14px; font-weight:600; margin-bottom:8px;">
                    ${escapeHTML(review.product_name)}
                </div>
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                    ${generateStarsHTML(review.rating, false)}
                    <span style="color:#666; font-size:13px; font-weight:500;">${review.rating}/5</span>
                </div>
                ${review.review_text ? `
                    <div style="color:#333; font-size:13px; line-height:1.5;">
                        ${escapeHTML(review.review_text)}
                    </div>
                ` : '<div style="color:#999; font-size:12px; font-style:italic;">No review text</div>'}
            </div>
        `;
    }
    
    // Add service rating section (only once for the entire order)
    modalHTML += `
                    </div>
                    
                    ${serviceRating ? `
                        <div style="background:white; border-radius:12px; padding:16px; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <div style="color:#333; font-size:14px; font-weight:600; margin:0 0 10px 0;">Delivery Service</div>
                            <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                                ${generateStarsHTML(serviceRating, false)}
                                <span style="color:#666; font-size:13px; font-weight:500;">${serviceRating}/5</span>
                            </div>
                            ${serviceReviewText ? `
                                <div style="color:#333; font-size:13px; line-height:1.5;">
                                    ${escapeHTML(serviceReviewText)}
                                </div>
                            ` : '<div style="color:#999; font-size:12px; font-style:italic;">No feedback</div>'}
                        </div>
                    ` : ''}
            </div>
    `;
    
    modalHTML += `
        </div>
    `;
    
    // Set modal content and add to page
    modalWrapper.innerHTML = modalHTML;
    document.body.appendChild(modalWrapper);
}

/**
 * Generate star HTML for display (non-interactive)
 */
function generateStarsHTML(rating, interactive = false) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating;
        starsHTML += `
            <span style="color:${filled ? '#fbbf24' : '#e5e7eb'}; font-size:18px;">★</span>
        `;
    }
    return starsHTML;
}

/**
 * Helper to escape HTML
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Close view review modal
 */
function closeViewReviewModal() {
    const modal = document.getElementById('viewReviewModal');
    if (modal) {
        modal.remove();
    }
}

// Expose to window
window.submitReview = submitReview;
window.loadProductReviews = loadProductReviews;
window.deleteReview = deleteReview;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.updateStarDisplay = updateStarDisplay;
window.openOrderReviewModal = openOrderReviewModal;
window.updateProductRating = updateProductRating;
window.updateServiceRating = updateServiceRating;
window.submitOrderReviews = submitOrderReviews;
window.closeOrderReviewModal = closeOrderReviewModal;
window.closeViewReviewModal = closeViewReviewModal;
// openViewReviewModalDirect is already exposed in its definition
