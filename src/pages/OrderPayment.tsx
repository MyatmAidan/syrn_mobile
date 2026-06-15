import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonToast,
  IonIcon,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import {
  checkmarkCircle,
  cardOutline,
  walletOutline,
  cloudUploadOutline,
  imageOutline,
  copyOutline,
  informationCircleOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { ApiService, Order, PaymentBank } from '../services/apiService';
import { useSyrnAlert } from '../context/SyrnAlertContext';
import './OrderPayment.css';

const getBankInitials = (name: string) => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const OrderPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id, 10);
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useSyrnAlert();

  const [order, setOrder] = useState<Order | null>(null);
  const [banks, setBanks] = useState<PaymentBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
    };
  }, [slipPreview]);

  const selectedBank = banks.find((b) => b.payment_bank_id === selectedBankId);

  const handleSlipChange = (file: File | null) => {
    if (slipPreview) URL.revokeObjectURL(slipPreview);
    setSlipFile(file);
    setSlipPreview(file ? URL.createObjectURL(file) : null);
  };

  const copyAccountNumber = async () => {
    if (!selectedBank?.account_number) return;
    try {
      await navigator.clipboard.writeText(selectedBank.account_number);
      showAlert({ type: 'success', title: 'Copied!', message: 'Account number copied to clipboard.' });
    } catch {
      showAlert({ type: 'error', title: 'Copy failed', message: 'Could not copy account number.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankId) {
      setToastColor('danger');
      setToastMessage('Please tap a payment method below.');
      setShowToast(true);
      return;
    }
    if (!slipFile) {
      setToastColor('danger');
      setToastMessage('Please upload your payment slip photo.');
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
        <IonContent className="syrn-page-bg">
          <div className="syrn-detail-spinner-container"><div className="syrn-spinner" /></div>
        </IonContent>
      </IonPage>
    );
  }

  if (!order) {
    return (
      <IonPage>
        <IonContent className="syrn-page-bg"><p className="syrn-payment-not-found">Order not found.</p></IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="syrn-payment-header ion-no-border">
        <IonToolbar className="syrn-payment-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/orders" text="" color="dark" />
          </IonButtons>
          <IonTitle className="syrn-brand-font syrn-page-title">Payment</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-payment-content syrn-page-bg">
        <div className="syrn-payment-hero syrn-animate-in">
          <div className="syrn-payment-hero-icon">
            <IonIcon icon={walletOutline} />
          </div>
          <div>
            <p className="syrn-payment-order-ref">Order {order.order_number}</p>
            <p className="syrn-payment-total">
              Amount due <strong>${parseFloat(order.total).toFixed(2)}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="syrn-payment-form">
          {/* Step 1 — Payment method */}
          <section className="syrn-payment-section syrn-animate-in" style={{ animationDelay: '0.08s' }}>
            <div className="syrn-payment-section-header">
              <span className="syrn-payment-step">1</span>
              <div>
                <h2 className="syrn-payment-section-title">Choose payment method</h2>
                <p className="syrn-payment-section-hint">
                  <IonIcon icon={informationCircleOutline} />
                  Tap a bank below to select how you will pay
                </p>
              </div>
            </div>

            {banks.length === 0 ? (
              <div className="syrn-payment-empty-banks">
                No payment methods available. Please contact support.
              </div>
            ) : (
              <div className="syrn-payment-method-list" role="radiogroup" aria-label="Payment method">
                {banks.map((bank) => {
                  const isSelected = selectedBankId === bank.payment_bank_id;
                  return (
                    <button
                      key={bank.payment_bank_id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`syrn-payment-method-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedBankId(bank.payment_bank_id)}
                    >
                      <div className="syrn-payment-method-left">
                        <div className="syrn-payment-bank-avatar">
                          {getBankInitials(bank.bank_name)}
                        </div>
                        <div className="syrn-payment-method-info">
                          <span className="syrn-payment-bank-name">{bank.bank_name}</span>
                          <span className="syrn-payment-bank-account">{bank.account_name}</span>
                        </div>
                      </div>
                      <div className="syrn-payment-method-right">
                        {isSelected ? (
                          <IonIcon icon={checkmarkCircle} className="syrn-payment-check-icon" />
                        ) : (
                          <IonIcon icon={chevronForwardOutline} className="syrn-payment-chevron" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Step 2 — Transfer details */}
          {selectedBank && (
            <section className="syrn-payment-section syrn-animate-in" style={{ animationDelay: '0.14s' }}>
              <div className="syrn-payment-section-header">
                <span className="syrn-payment-step">2</span>
                <div>
                  <h2 className="syrn-payment-section-title">Transfer to this account</h2>
                  <p className="syrn-payment-section-hint">
                    Send exactly <strong>${parseFloat(order.total).toFixed(2)}</strong> to the account below
                  </p>
                </div>
              </div>

              <div className="syrn-bank-details">
                <div className="syrn-bank-details-row">
                  <span className="syrn-bank-details-label">Bank</span>
                  <span className="syrn-bank-details-value">{selectedBank.bank_name}</span>
                </div>
                <div className="syrn-bank-details-row">
                  <span className="syrn-bank-details-label">Account name</span>
                  <span className="syrn-bank-details-value">{selectedBank.account_name}</span>
                </div>
                <div className="syrn-bank-details-row syrn-bank-details-row--highlight">
                  <span className="syrn-bank-details-label">Account number</span>
                  <div className="syrn-bank-account-copy">
                    <span className="syrn-bank-details-value syrn-bank-account-number">
                      {selectedBank.account_number}
                    </span>
                    <button type="button" className="syrn-copy-btn" onClick={copyAccountNumber} aria-label="Copy account number">
                      <IonIcon icon={copyOutline} />
                      Copy
                    </button>
                  </div>
                </div>

                {selectedBank.qr_image_url && (
                  <div className="syrn-qr-section">
                    <p className="syrn-qr-label">
                      <IonIcon icon={cardOutline} /> Scan QR to pay
                    </p>
                    <img src={selectedBank.qr_image_url} alt="Payment QR code" className="syrn-qr-image" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Step 3 — Upload slip */}
          <section className="syrn-payment-section syrn-animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="syrn-payment-section-header">
              <span className="syrn-payment-step">3</span>
              <div>
                <h2 className="syrn-payment-section-title">Upload payment slip</h2>
                <p className="syrn-payment-section-hint">
                  Take a photo or choose from your gallery after transferring
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="syrn-file-input-hidden"
              onChange={(e) => handleSlipChange(e.target.files?.[0] ?? null)}
            />

            {slipPreview ? (
              <div className="syrn-slip-preview">
                <img src={slipPreview} alt="Payment slip preview" className="syrn-slip-preview-image" />
                <button
                  type="button"
                  className="syrn-slip-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="syrn-slip-upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="syrn-slip-upload-icon">
                  <IonIcon icon={cloudUploadOutline} />
                </div>
                <span className="syrn-slip-upload-title">Tap to upload slip</span>
                <span className="syrn-slip-upload-sub">JPG, PNG · or use camera</span>
                <span className="syrn-slip-upload-cta">
                  <IonIcon icon={imageOutline} />
                  Choose photo
                </span>
              </button>
            )}
          </section>

          <button
            type="submit"
            className="syrn-btn-primary syrn-payment-submit"
            disabled={isSubmitting || !selectedBankId || !slipFile}
          >
            {isSubmitting ? 'Submitting…' : 'Submit payment'}
          </button>
        </form>

        <IonToast isOpen={showToast} message={toastMessage} color={toastColor} duration={2500} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default OrderPayment;
