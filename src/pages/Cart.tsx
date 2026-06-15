import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  useIonViewWillEnter,
  IonIcon,
} from '@ionic/react';
import { cartOutline } from 'ionicons/icons';
import { ApiService, Cart as CartData, formatProductPrice } from '../services/apiService';
import { useCart } from '../context/CartContext';
import { useSyrnAlert } from '../context/SyrnAlertContext';
import { getProductImageUrl } from '../services/apiService';
import './Cart.css';

const Cart: React.FC = () => {
  const history = useHistory();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshCart } = useCart();
  const { showAlert } = useSyrnAlert();

  const loadCart = async () => {
    setIsLoading(true);
    const data = await ApiService.getCart();
    setCart(data);
    await refreshCart();
    setIsLoading(false);
  };

  useIonViewWillEnter(() => {
    loadCart();
  });

  const updateQty = async (cartItemId: number, quantity: number) => {
    const res = await ApiService.updateCartItem(cartItemId, quantity);
    if (res.success && res.data) {
      setCart(res.data);
      await refreshCart();
    } else {
      showAlert({ type: 'error', title: 'Update failed', message: res.message });
    }
  };

  const removeItem = async (cartItemId: number) => {
    const res = await ApiService.removeCartItem(cartItemId);
    if (res.success && res.data) {
      setCart(res.data);
      await refreshCart();
      showAlert({ type: 'info', title: 'Removed', message: 'Item removed from cart.' });
    }
  };

  return (
    <IonPage>
      <IonHeader className="syrn-cart-header ion-no-border">
        <IonToolbar className="syrn-cart-toolbar">
          <IonTitle className="syrn-brand-font syrn-page-title">Cart</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="syrn-cart-content syrn-page-bg">
        {isLoading ? (
          <div className="syrn-detail-spinner-container"><div className="syrn-spinner" /></div>
        ) : !cart?.items?.length ? (
          <div className="syrn-cart-empty">
            <IonIcon icon={cartOutline} className="syrn-cart-empty-icon" />
            <p>Your cart is empty</p>
            <button type="button" className="syrn-btn-primary" onClick={() => history.push('/app/catalog')}>
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="syrn-cart-list">
              {cart.items.map((item, index) => (
                <div
                  key={item.cart_item_id}
                  className="syrn-cart-item"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {item.product && getProductImageUrl(item.product) && (
                    <img
                      src={getProductImageUrl(item.product) || ''}
                      alt=""
                      className="syrn-cart-item-thumb"
                    />
                  )}
                  <div className="syrn-cart-item-info">
                    <h3>{item.product?.product_name}</h3>
                    <p className="syrn-cart-item-price">${formatProductPrice(item.line_total)}</p>
                    <div className="syrn-cart-item-actions">
                      <button
                        type="button"
                        className="syrn-cart-qty-btn"
                        onClick={() => updateQty(item.cart_item_id, Math.max(1, item.quantity - 1))}
                      >
                        −
                      </button>
                      <span className="syrn-cart-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="syrn-cart-qty-btn"
                        onClick={() => updateQty(item.cart_item_id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button type="button" className="syrn-cart-remove" onClick={() => removeItem(item.cart_item_id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="syrn-cart-footer">
              <p className="syrn-cart-total">
                <span>Subtotal</span>
                <strong>${formatProductPrice(cart.subtotal)}</strong>
              </p>
              <button type="button" className="syrn-btn-primary syrn-cart-checkout-btn" onClick={() => history.push('/app/checkout')}>
                Checkout
              </button>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Cart;
