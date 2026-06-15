import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { initializeAuth } from '../services/apiService';
import SyrnBrandPainter from '../components/SyrnBrandPainter';
import SoftSparkles from '../components/SoftSparkles';
import './Splash.css';

const Splash: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const token = await initializeAuth();
      history.replace(token ? '/app/catalog' : '/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [history]);

  return (
    <IonPage>
      <IonContent className="syrn-splash-content" scrollY={false}>
        <div className="syrn-splash-container">
          <SoftSparkles count={10} />
          <div className="syrn-splash-orb syrn-splash-orb-1" />
          <div className="syrn-splash-orb syrn-splash-orb-2" />
          <div className="syrn-splash-orb syrn-splash-orb-3" />

          <div className="syrn-branding-cluster">
            <div className="syrn-brand-painter-wrapper">
              <SyrnBrandPainter size={120} />
            </div>
            <h1 className="syrn-brand-title syrn-brand-font syrn-animate-gradient-text">syrn</h1>
            <p className="syrn-brand-subtitle">Skincare Intelligence</p>
          </div>

          <div className="syrn-progress-track">
            <div className="syrn-progress-bar" />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
