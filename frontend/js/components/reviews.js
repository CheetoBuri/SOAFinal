// ========== REVIEWS COMPONENT ==========

/**
 * Submit a review for a product
 */
async function submitReview(productId, rating, reviewText = '') {
    const userId = localStorage.getItem('user_id');
    
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
                ${review.user_id === localStorage.getItem('user_id') ? `
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
    
    const userId = localStorage.getItem('user_id');
    
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

// Expose to window
window.submitReview = submitReview;
window.loadProductReviews = loadProductReviews;
window.deleteReview = deleteReview;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.updateStarDisplay = updateStarDisplay;
