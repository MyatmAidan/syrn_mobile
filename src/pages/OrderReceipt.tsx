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
import { arrowBackOutline } from 'ionicons/icons';
import { ApiService, Order } from '../services/apiService';
import OrderReceiptView from '../components/OrderReceiptView';
import '../components/OrderReceiptView.css';
import './OrderDetail.css';

const OrderReceipt: React.FC = () => {
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

  if (!order?.receipt) {
    return (
      <IonPage>
        <IonHeader className="syrn-order-detail-header ion-no-border">
          <IonToolbar className="syrn-order-detail-toolbar">
            <IonButtons slot="start">
              <IonButton onClick={() => history.replace(`/app/orders/${orderId}`)}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Receipt</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="syrn-page-bg">
          <p className="syrn-order-detail-empty">Receipt not available for this order yet.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="syrn-order-detail-header ion-no-border">
        <IonToolbar className="syrn-order-detail-toolbar">
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className="syrn-brand-font syrn-page-title">Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-order-detail-content syrn-page-bg">
        <OrderReceiptView receipt={order.receipt} />
      </IonContent>
    </IonPage>
  );
};

export default OrderReceipt;
