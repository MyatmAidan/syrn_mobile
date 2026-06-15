import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import {
  arrowBackOutline,
  receiptOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { ApiService, Order, formatProductPrice, resolveStorageUrl } from '../services/apiService';
import '../components/OrderReceiptView.css';
import './OrderDetail.css';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  awaiting_verification: 'Awaiting verification',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id, 10);
  const history = useHistory();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.getOrder(orderId).then((data) => {
      setOrder(data);
      setIsLoading(false);
    });
  }, [orderId]);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="syrn-page-bg">
          <div className="syrn-detail-spinner-container">
            <div className="syrn-spinner" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!order) {
    return (
      <IonPage>
        <IonHeader className="syrn-order-detail-header ion-no-border">
          <IonToolbar className="syrn-order-detail-toolbar">
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Order</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="syrn-page-bg">
          <p className="syrn-order-detail-empty">Order not found.</p>
        </IonContent>
      </IonPage>
    );
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const receipt = order.receipt;
  const slipUrl = order.payment?.slip_image_url
    ? resolveStorageUrl(order.payment.slip_image_url)
    : null;

  return (
    <IonPage>
      <IonHeader className="syrn-order-detail-header ion-no-border">
        <IonToolbar className="syrn-order-detail-toolbar">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className="syrn-brand-font syrn-page-title">{order.order_number}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-order-detail-content syrn-page-bg">
        <section className="syrn-order-detail-section syrn-animate-in">
          <div className="syrn-order-detail-row">
            <span className="syrn-order-detail-label">Status</span>
            <span className={`syrn-order-status syrn-order-status-${order.status}`}>
              {statusLabel}
            </span>
          </div>
          <div className="syrn-order-detail-row">
            <span className="syrn-order-detail-label">Placed</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
          <div className="syrn-order-detail-row">
            <span className="syrn-order-detail-label">Total</span>
            <span className="syrn-order-detail-total">${formatProductPrice(order.total)}</span>
          </div>
        </section>

        {receipt && (
          <button
            type="button"
            className="syrn-order-receipt-preview syrn-animate-in"
            onClick={() => history.push(`/app/orders/${order.order_id}/receipt`)}
          >
            <div className="syrn-order-receipt-preview-left">
              <div className="syrn-order-receipt-preview-icon">
                <IonIcon icon={receiptOutline} />
              </div>
              <div>
                <p className="syrn-order-receipt-preview-title">View official receipt</p>
                <p className="syrn-order-receipt-preview-sub">
                  {receipt.receipt_number} · Verified
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 14, verticalAlign: 'middle', marginLeft: 4, color: '#5a9e7a' }} />
                </p>
              </div>
            </div>
            <IonIcon icon={chevronForwardOutline} className="syrn-order-receipt-preview-chevron" />
          </button>
        )}

        <section className="syrn-order-detail-section syrn-animate-in">
          <h3 className="syrn-order-detail-heading">Shipping</h3>
          <p className="syrn-order-detail-text">{order.shipping_name}</p>
          <p className="syrn-order-detail-text">{order.shipping_phone}</p>
          <p className="syrn-order-detail-text">{order.shipping_address}</p>
          {order.customer_note && (
            <p className="syrn-order-detail-note">
              <strong>Note:</strong> {order.customer_note}
            </p>
          )}
        </section>

        <section className="syrn-order-detail-section syrn-animate-in">
          <h3 className="syrn-order-detail-heading">Items</h3>
          {(order.items || []).map((item) => (
            <div key={item.order_item_id} className="syrn-order-detail-item">
              <span>{item.product_name}</span>
              <span>
                {item.quantity} × ${formatProductPrice(item.unit_price)} = $
                {formatProductPrice(item.line_total)}
              </span>
            </div>
          ))}
          <div className="syrn-order-detail-subtotal">
            <span>Subtotal</span>
            <span>${formatProductPrice(order.subtotal)}</span>
          </div>
        </section>

        {order.payment && (
          <section className="syrn-order-detail-section syrn-animate-in">
            <h3 className="syrn-order-detail-heading">Payment slip</h3>
            {order.payment.payment_bank && (
              <p className="syrn-order-detail-text">
                {order.payment.payment_bank.bank_name} · {order.payment.payment_bank.account_number}
              </p>
            )}
            <p className="syrn-order-detail-text">
              Status: {order.payment.status.replace(/_/g, ' ')}
            </p>
            {slipUrl && (
              <img src={slipUrl} alt="Payment slip" className="syrn-order-detail-slip" />
            )}
          </section>
        )}

        {order.status === 'pending_payment' && (
          <button
            type="button"
            className="syrn-btn-primary syrn-order-detail-pay-btn"
            onClick={() => history.push(`/app/orders/${order.order_id}/pay`)}
          >
            Complete payment
          </button>
        )}
      </IonContent>
    </IonPage>
  );
};

export default OrderDetail;
