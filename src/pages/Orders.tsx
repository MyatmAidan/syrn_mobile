import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { ApiService, Order } from '../services/apiService';
import './Orders.css';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  awaiting_verification: 'Awaiting verification',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

const Orders: React.FC = () => {
  const history = useHistory();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.getOrders().then((data) => {
      setOrders(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <IonPage>
      <IonHeader className="syrn-orders-header ion-no-border">
        <IonToolbar className="syrn-orders-toolbar">
          <IonTitle className="syrn-brand-font syrn-page-title">Orders</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="syrn-orders-content syrn-page-bg">
        {isLoading ? (
          <div className="syrn-detail-spinner-container"><div className="syrn-spinner" /></div>
        ) : orders.length === 0 ? (
          <p className="syrn-orders-empty">No orders yet.</p>
        ) : (
          <div className="syrn-orders-list">
            {orders.map((order) => (
              <button
                key={order.order_id}
                type="button"
                className="syrn-order-card"
                onClick={() => history.push(`/app/orders/${order.order_id}`)}
              >
                <div className="syrn-order-card-header">
                  <span>{order.order_number}</span>
                  <span className={`syrn-order-status syrn-order-status-${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <p>${parseFloat(order.total).toFixed(2)} · {new Date(order.created_at).toLocaleDateString()}</p>
                {order.status === 'confirmed' && order.receipt_number && (
                  <button
                    type="button"
                    className="syrn-order-receipt-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      history.push(`/app/orders/${order.order_id}/receipt`);
                    }}
                  >
                    View receipt
                  </button>
                )}
                <span className="syrn-order-pay-hint">View details</span>
              </button>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Orders;
