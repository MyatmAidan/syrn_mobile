import React, { createContext, useCallback, useContext, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle, informationCircle } from 'ionicons/icons';
import './SyrnAlertContext.css';

export type SyrnAlertType = 'success' | 'error' | 'info';

export interface SyrnAlertOptions {
  type?: SyrnAlertType;
  title: string;
  message?: string;
  duration?: number;
}

interface AlertState extends SyrnAlertOptions {
  id: number;
  visible: boolean;
}

interface SyrnAlertContextValue {
  showAlert: (options: SyrnAlertOptions) => void;
}

const SyrnAlertContext = createContext<SyrnAlertContextValue | undefined>(undefined);

const ICONS = {
  success: checkmarkCircle,
  error: closeCircle,
  info: informationCircle,
};

export const SyrnAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  const showAlert = useCallback((options: SyrnAlertOptions) => {
    const id = Date.now();
    const alert: AlertState = {
      id,
      visible: true,
      type: options.type ?? 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 3200,
    };

    setAlerts((prev) => [...prev, alert]);

    window.setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, alert.duration);
  }, []);

  return (
    <SyrnAlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="syrn-alert-stack" aria-live="polite">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`syrn-alert syrn-alert-${alert.type} syrn-alert-enter`}
            role="alert"
          >
            <IonIcon icon={ICONS[alert.type ?? 'info']} className="syrn-alert-icon" />
            <div className="syrn-alert-body">
              <strong className="syrn-alert-title">{alert.title}</strong>
              {alert.message && <p className="syrn-alert-message">{alert.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </SyrnAlertContext.Provider>
  );
};

export function useSyrnAlert() {
  const ctx = useContext(SyrnAlertContext);
  if (!ctx) {
    throw new Error('useSyrnAlert must be used within SyrnAlertProvider');
  }
  return ctx;
}
