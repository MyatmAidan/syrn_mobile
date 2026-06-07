import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonToast } from '@ionic/react';
import { ApiService, Order, PaymentBank } from '../services/apiService';
import './OrderPayment.css';

const OrderPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id, 10);
  const history = useHistory();
  const [order, setOrder] = useState<Order | null>(null);
  const [banks, setBanks] = useState<PaymentBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const load = async () => {
      const [orderData, bankList] = await Promise.all([
        ApiService.getOrder(orderId),
        ApiService.getPaymentBanks(),
      ]);
      setOrder(orderData);
      setBanks(bankList);
      if (bankList.length > 0) {
        setSelectedBankId(bankList[0].payment_bank_id);
      }
      setIsLoading(false);
    };
    load();
  }, [orderId]);

  const selectedBank = banks.find((b) => b.payment_bank_id === selectedBankId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankId || !slipFile) {
      setToastColor('danger');
      setToastMessage('Select a bank and upload your payment slip.');
      setShowToast(true);
      return;
    }
    setIsSubmitting(true);
    const res = await ApiService.submitOrderPayment(orderId, selectedBankId, slipFile);
    setIsSubmitting(false);

    if (res.success) {
      setToastColor('success');
      setToastMessage('Payment submitted! We will verify your slip soon.');
      setShowToast(true);
      setTimeout(() => history.replace('/app/orders'), 1500);
    } else {
      setToastColor('danger');
      setToastMessage(res.message);
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent><div className="syrn-detail-spinner-container"><div className="syrn-spinner" /></div></IonContent>
      </IonPage>
    );
  }

  if (!order) {
    return (
      <IonPage>
        <IonContent><p style={{ padding: 24 }}>Order not found.</p></IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Pay {order.order_number}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="syrn-payment-content">
        <p className="syrn-payment-total">Amount due: <strong>${parseFloat(order.total).toFixed(2)}</strong></p>

        <form onSubmit={handleSubmit} className="syrn-payment-form">
          <label className="syrn-input-label">Payment method</label>
          <select
            className="syrn-input-field"
            value={selectedBankId ?? ''}
            onChange={(e) => setSelectedBankId(Number(e.target.value))}
          >
            {banks.map((b) => (
              <option key={b.payment_bank_id} value={b.payment_bank_id}>{b.bank_name}</option>
            ))}
          </select>

          {selectedBank && (
            <div className="syrn-bank-details">
              <p><strong>{selectedBank.account_name}</strong></p>
              <p>{selectedBank.account_number}</p>
              {selectedBank.qr_image_url && (
                <img src={selectedBank.qr_image_url} alt="QR code" className="syrn-qr-image" />
              )}
            </div>
          )}

          <label className="syrn-input-label">Upload payment slip</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="syrn-file-input"
            onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
            required
          />

          <button type="submit" className="syrn-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit payment'}
          </button>
        </form>

        <IonToast isOpen={showToast} message={toastMessage} color={toastColor} duration={2500} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default OrderPayment;
