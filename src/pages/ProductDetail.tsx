import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonIcon, IonToast, IonModal } from '@ionic/react';
import { arrowBackOutline, heartOutline, heart, star, starOutline, cartOutline } from 'ionicons/icons';
import { ApiService, Product, Review, formatProductPrice, getProductImageUrl, isAuthenticated, initializeAuth } from '../services/apiService';
import AddToCartSheet from '../components/AddToCartSheet';
import { useCart } from '../context/CartContext';
import { useSyrnAlert } from '../context/SyrnAlertContext';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const productId = parseInt(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteId, setFavouriteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { refreshCart, setItemCount } = useCart();
  const { showAlert } = useSyrnAlert();

  // Toast notifications (reviews / favourites)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const fetchProductData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Product Detail
      const apiProd = await ApiService.getProduct(productId);
      setProduct(apiProd);

      if (apiProd) {
        setReviews(apiProd.reviews || []);
      }

      // 2. Fetch Favorites to see if this product is saved
      const favList = await ApiService.getFavourites();
      const matchedFav = favList.find((f) => f.product_id === productId || (f as any).product?.product_id === productId);
      if (matchedFav) {
        setIsFavourite(true);
        setFavouriteId(matchedFav.favourite_id);
      } else {
        setIsFavourite(false);
        setFavouriteId(null);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const openCartSheet = async () => {
    await initializeAuth();
    if (!isAuthenticated()) {
      showAlert({
        type: 'info',
        title: 'Sign in required',
        message: 'Please log in to add items to your cart.',
      });
      setTimeout(() => history.push('/login'), 1600);
      return;
    }
    setShowCartSheet(true);
  };

  const confirmAddToCart = async (quantity: number) => {
    setIsAddingToCart(true);
    const res = await ApiService.addToCart(productId, quantity);
    setIsAddingToCart(false);

    if (res.success) {
      if (res.data?.item_count != null) {
        setItemCount(res.data.item_count);
      }
      await refreshCart();
      setShowCartSheet(false);
      showAlert({
        type: 'success',
        title: 'Added to cart',
        message: `${product?.product_name} × ${quantity} is in your bag.`,
      });
    } else {
      showAlert({
        type: 'error',
        title: 'Could not add',
        message: res.message,
      });
    }
  };

  const toggleFavourite = async () => {
    try {
      if (isFavourite && favouriteId !== null) {
        const res = await ApiService.deleteFavourite(favouriteId);
        if (res.success) {
          setIsFavourite(false);
          setFavouriteId(null);
          setToastColor('success');
          setToastMessage('Removed from favourites');
          setShowToast(true);
        }
      } else {
        const res = await ApiService.addFavourite(productId);
        if (res.success && res.data) {
          setIsFavourite(true);
          setFavouriteId(res.data.favourite_id);
          setToastColor('success');
          setToastMessage('Saved to favourites');
          setShowToast(true);
        } else {
          setToastColor('danger');
          setToastMessage(res.message || 'Failed to save to favourites');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setToastColor('danger');
      setToastMessage('Failed to save or remove from favourites');
      setShowToast(true);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await ApiService.addReview(productId, newRating, newComment);
      if (res.success && res.data) {
        setReviews([res.data, ...reviews]);
        setToastColor('success');
        setToastMessage('Review added successfully!');
        setShowToast(true);
        setShowReviewModal(false);
        setNewComment('');
      } else {
        setToastColor('danger');
        setToastMessage(res.message || 'Failed to add review');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Review creation error:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="syrn-detail-content">
          <div className="syrn-detail-spinner-container">
            <div className="syrn-spinner" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!product) {
    return (
      <IonPage>
        <IonContent className="syrn-detail-content">
          <div className="syrn-detail-error">
            <p>Product not found.</p>
            <button className="syrn-btn-primary" onClick={() => history.goBack()}>
              GO BACK
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="syrn-detail-header ion-no-border">
        <IonToolbar className="syrn-detail-toolbar">
          <IonButtons slot="start">
            <button className="syrn-back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
          </IonButtons>
          <IonButtons slot="end">
            <button className="syrn-favourite-button" onClick={toggleFavourite}>
              <IonIcon icon={isFavourite ? heart : heartOutline} className={isFavourite ? 'active' : ''} />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-detail-content" scrollY={true}>
        <div className="syrn-detail-container">
          {/* Hero Image Section */}
          <div className="syrn-detail-hero">
            {getProductImageUrl(product) ? (
              <img src={getProductImageUrl(product) || ''} alt={product.product_name} className="syrn-detail-image" />
            ) : (
              <div className="syrn-detail-image-placeholder">
                <span className="syrn-placeholder-text">
                  {product.brand?.brand_name ? product.brand.brand_name.substring(0, 2).toUpperCase() : 'SN'}
                </span>
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="syrn-detail-info-card">
            <span className="syrn-detail-brand">{product.brand?.brand_name}</span>
            <h1 className="syrn-detail-name">{product.product_name}</h1>
            <span className="syrn-detail-price">${formatProductPrice(product.price)}</span>
            {product.qty !== undefined && (
              <p className="syrn-detail-stock">{product.qty > 0 ? `${product.qty} in stock` : 'Out of stock'}</p>
            )}

            <button
              type="button"
              className="syrn-btn-primary syrn-add-cart-btn"
              onClick={openCartSheet}
              disabled={product.qty === 0}
            >
              <IonIcon icon={cartOutline} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Add to cart
            </button>

            {/* Product compatibility tags */}
            <div className="syrn-detail-tags">
              {product.skin_type && (
                <span className="syrn-detail-tag skin-type-tag">
                  Skin: {typeof product.skin_type === 'object' ? product.skin_type.name : product.skin_type}
                </span>
              )}
              {product.skin_concern && <span className="syrn-detail-tag concern-tag">{product.skin_concern}</span>}
            </div>

            {/* Description */}
            <div className="syrn-detail-section">
              <h2 className="syrn-detail-section-title">The Details</h2>
              <p className="syrn-detail-description">{product.description || 'No description available.'}</p>
            </div>

            {/* Ingredients block */}
            {product.ingredients && (
              <div className="syrn-detail-section">
                <h2 className="syrn-detail-section-title">Ingredients</h2>
                <div className="syrn-detail-ingredients-box">
                  <p className="syrn-detail-ingredients">{product.ingredients}</p>
                </div>
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          <div className="syrn-reviews-section">
            <div className="syrn-reviews-header">
              <h2 className="syrn-detail-section-title">Reviews ({reviews.length})</h2>
              <button
                type="button"
                className="syrn-add-review-trigger-btn"
                onClick={() => setShowReviewModal(true)}
              >
                Write Review
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="syrn-reviews-empty">
                <p>No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="syrn-reviews-list">
                {reviews.map((rev) => (
                  <div key={rev.review_id} className="syrn-review-item">
                    <div className="syrn-review-meta">
                      <span className="syrn-review-user">{rev.user?.full_name || 'Verified User'}</span>
                      <div className="syrn-review-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <IonIcon
                            key={s}
                            icon={s <= rev.rating ? star : starOutline}
                            className="syrn-star-icon"
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="syrn-review-comment">{rev.comment}</p>}
                    <span className="syrn-review-date">{new Date(rev.review_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Post Review Modal */}
        <IonModal isOpen={showReviewModal} onDidDismiss={() => setShowReviewModal(false)}>
          <div className="syrn-modal-container">
            <h2 className="syrn-modal-title syrn-brand-font">Post a Review</h2>
            <form onSubmit={handlePostReview} className="syrn-modal-form">
              <div className="syrn-modal-stars-selector">
                <label className="syrn-input-label">Your Rating</label>
                <div className="syrn-modal-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="syrn-star-btn"
                      onClick={() => setNewRating(s)}
                    >
                      <IonIcon icon={s <= newRating ? star : starOutline} className="syrn-star-select-icon" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="syrn-input-container">
                <label className="syrn-input-label">Comment</label>
                <textarea
                  className="syrn-textarea-field"
                  placeholder="Share your experience with this product..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="syrn-modal-actions">
                <button
                  type="button"
                  className="syrn-btn-text"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="syrn-btn-primary syrn-modal-submit-btn"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? 'Posting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={toastColor}
          position="bottom"
        />

        <AddToCartSheet
          isOpen={showCartSheet}
          product={product}
          onClose={() => setShowCartSheet(false)}
          onConfirm={confirmAddToCart}
          isSubmitting={isAddingToCart}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProductDetail;
