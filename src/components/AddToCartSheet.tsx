import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { closeOutline, cartOutline, removeOutline, addOutline } from 'ionicons/icons';
import { Product, formatProductPrice, getProductImageUrl } from '../services/apiService';
import './AddToCartSheet.css';

interface AddToCartSheetProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
  isSubmitting?: boolean;
}

const AddToCartSheet: React.FC<AddToCartSheetProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const maxQty = product?.qty ?? 99;

  const handleDismiss = () => {
    setQuantity(1);
    onClose();
  };

  const imageSrc = product ? getProductImageUrl(product) : null;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleDismiss}
      className="syrn-cart-sheet-modal"
    >
      <IonHeader className="ion-no-border syrn-cart-sheet-header">
        <IonToolbar>
          <IonTitle>Add to cart</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-cart-sheet-content">
        {product && (
          <div className="syrn-cart-sheet-body">
            <div className="syrn-cart-sheet-product">
              {imageSrc ? (
                <img src={imageSrc} alt={product.product_name} className="syrn-cart-sheet-image" />
              ) : (
                <div className="syrn-cart-sheet-image-placeholder">
                  {product.brand?.brand_name?.substring(0, 2).toUpperCase() || 'SN'}
                </div>
              )}
              <div>
                <p className="syrn-cart-sheet-brand">{product.brand?.brand_name}</p>
                <h2 className="syrn-cart-sheet-name">{product.product_name}</h2>
                <p className="syrn-cart-sheet-price">${formatProductPrice(product.price)}</p>
                <p className="syrn-cart-sheet-stock">
                  {maxQty > 0 ? `${maxQty} available` : 'Out of stock'}
                </p>
              </div>
            </div>

            <div className="syrn-cart-sheet-qty">
              <span className="syrn-cart-sheet-qty-label">Quantity</span>
              <div className="syrn-cart-sheet-qty-controls">
                <button
                  type="button"
                  className="syrn-qty-btn"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <IonIcon icon={removeOutline} />
                </button>
                <span className="syrn-qty-value">{quantity}</span>
                <button
                  type="button"
                  className="syrn-qty-btn"
                  disabled={quantity >= maxQty}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                >
                  <IonIcon icon={addOutline} />
                </button>
              </div>
            </div>

            <p className="syrn-cart-sheet-line-total">
              Subtotal: <strong>${(parseFloat(String(product.price)) * quantity).toFixed(2)}</strong>
            </p>

            <button
              type="button"
              className="syrn-btn-primary syrn-cart-sheet-submit"
              disabled={isSubmitting || maxQty === 0}
              onClick={() => onConfirm(quantity)}
            >
              <IonIcon icon={cartOutline} style={{ marginRight: 8 }} />
              {isSubmitting ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default AddToCartSheet;
