import React from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline, cardOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { OrderReceipt, formatProductPrice } from '../services/apiService';
import './OrderReceiptView.css';

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

interface OrderReceiptViewProps {
  receipt: OrderReceipt;
}

const OrderReceiptView: React.FC<OrderReceiptViewProps> = ({ receipt }) => (
  <div className="syrn-order-receipt-view">
    <div className="syrn-order-receipt-success-banner">
      <IonIcon icon={checkmarkCircleOutline} className="syrn-order-receipt-success-icon" />
      <div>
        <p className="syrn-order-receipt-success-title">Payment confirmed</p>
        <p className="syrn-order-receipt-success-sub">Your official Syrn receipt</p>
      </div>
    </div>

    <div className="syrn-order-receipt-card">
      <div className="syrn-order-receipt-brand">
        <span className="syrn-order-receipt-brand-name syrn-brand-font">syrn</span>
        <span className="syrn-order-receipt-brand-sub">Official receipt</span>
      </div>

      <div className="syrn-order-receipt-meta">
        <div>
          <span className="syrn-order-receipt-meta-label">Receipt #</span>
          <span className="syrn-order-receipt-meta-value">{receipt.receipt_number}</span>
        </div>
        <div className="syrn-order-receipt-meta-right">
          <span className="syrn-order-receipt-meta-label">Order #</span>
          <span className="syrn-order-receipt-meta-value">{receipt.order_number}</span>
        </div>
      </div>

      <div className="syrn-order-receipt-meta syrn-order-receipt-meta--second">
        <div>
          <span className="syrn-order-receipt-meta-label">Issued</span>
          <span className="syrn-order-receipt-meta-value">
            <IonIcon icon={calendarOutline} className="syrn-order-receipt-inline-icon" />
            {formatDateTime(receipt.issued_at)}
          </span>
        </div>
        {receipt.payment.verified_by && (
          <div className="syrn-order-receipt-meta-right">
            <span className="syrn-order-receipt-meta-label">Verified by</span>
            <span className="syrn-order-receipt-meta-value">{receipt.payment.verified_by}</span>
          </div>
        )}
      </div>

      <div className="syrn-order-receipt-divider" />

      <div className="syrn-order-receipt-customer">
        <span className="syrn-order-receipt-meta-label">Customer</span>
        <p className="syrn-order-receipt-customer-name">{receipt.customer.name}</p>
        {receipt.customer.email && (
          <p className="syrn-order-receipt-customer-detail">{receipt.customer.email}</p>
        )}
        <p className="syrn-order-receipt-customer-detail">{receipt.customer.phone}</p>
      </div>

      <div className="syrn-order-receipt-customer">
        <span className="syrn-order-receipt-meta-label">Ship to</span>
        <p className="syrn-order-receipt-customer-detail">{receipt.shipping.address}</p>
      </div>

      <div className="syrn-order-receipt-divider" />

      <div className="syrn-order-receipt-items">
        {receipt.items.map((item, index) => (
          <div key={index} className="syrn-order-receipt-item">
            <div className="syrn-order-receipt-item-info">
              <span className="syrn-order-receipt-item-name">{item.product_name}</span>
              <span className="syrn-order-receipt-item-qty">
                {item.quantity} × ${formatProductPrice(item.unit_price)}
              </span>
            </div>
            <span className="syrn-order-receipt-item-total">
              ${formatProductPrice(item.line_total)}
            </span>
          </div>
        ))}
      </div>

      <div className="syrn-order-receipt-totals">
        <div className="syrn-order-receipt-total-row">
          <span>Subtotal</span>
          <span>${formatProductPrice(receipt.subtotal)}</span>
        </div>
        <div className="syrn-order-receipt-total-row syrn-order-receipt-total-row--grand">
          <span>Total paid</span>
          <span>${formatProductPrice(receipt.total)}</span>
        </div>
      </div>

      <div className="syrn-order-receipt-payment">
        <IonIcon icon={cardOutline} className="syrn-order-receipt-payment-icon" />
        <div>
          <span className="syrn-order-receipt-payment-bank">{receipt.payment.bank_name}</span>
          <span className="syrn-order-receipt-payment-account">{receipt.payment.account_number}</span>
        </div>
      </div>

      {receipt.payment.admin_note && (
        <p className="syrn-order-receipt-note">
          <strong>Note:</strong> {receipt.payment.admin_note}
        </p>
      )}

      {receipt.customer_note && (
        <p className="syrn-order-receipt-note">
          <strong>Your note:</strong> {receipt.customer_note}
        </p>
      )}

      <p className="syrn-order-receipt-footer">Thank you for shopping with Syrn</p>
    </div>
  </div>
);

export default OrderReceiptView;
