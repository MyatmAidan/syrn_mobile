import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonToast } from '@ionic/react';
import { ApiService } from '../services/apiService';
import './Checkout.css';

const Checkout: React.FC = () => {
  const history = useHistory();
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await ApiService.checkout({
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: shippingAddress,
      customer_note: customerNote || undefined,
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      history.replace(`/app/orders/${res.data.order_id}/pay`);
    } else {
      setToastColor('danger');
      setToastMessage(res.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="syrn-checkout-content">
        <form className="syrn-checkout-form" onSubmit={handleSubmit}>
          <label className="syrn-input-label">Full name</label>
          <input className="syrn-input-field" value={shippingName} onChange={(e) => setShippingName(e.target.value)} required />

          <label className="syrn-input-label">Phone</label>
          <input className="syrn-input-field" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} required />

          <label className="syrn-input-label">Shipping address</label>
          <textarea className="syrn-textarea-field" rows={3} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required />

          <label className="syrn-input-label">Order note (optional)</label>
          <textarea className="syrn-textarea-field" rows={2} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />

          <button type="submit" className="syrn-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>
        <IonToast isOpen={showToast} message={toastMessage} color={toastColor} duration={2500} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Checkout;
