import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { initializeAuth, isAuthenticated } from '../services/apiService';
import { useCart } from '../context/CartContext';

interface AuthGateProps {
  children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const history = useHistory();
  const { refreshCart } = useCart();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      await initializeAuth();
      if (!isAuthenticated()) {
        history.replace('/login');
        return;
      }
      await refreshCart();
      setReady(true);
    };
    check();
  }, [history, refreshCart]);

  if (!ready) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="syrn-spinner" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
