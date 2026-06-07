import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon } from '@ionic/react';
import { logOutOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { ApiService, UserProfile } from '../services/apiService';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { value: userJson } = await Preferences.get({ key: 'user' });
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      // Clear preferences on the client side
      await Preferences.clear();
      setIsLoading(false);
      history.replace('/login');
    }
  };

  const getFirstName = () => {
    if (!user?.full_name) return 'User';
    return user.full_name.split(' ')[0];
  };

  return (
    <IonPage>
      <IonHeader className="syrn-home-header ion-no-border">
        <IonToolbar className="syrn-home-toolbar">
          <IonTitle className="syrn-brand-font syrn-home-title">syrn</IonTitle>
          <IonButtons slot="end">
            <button type="button" className="syrn-logout-button" onClick={handleLogout} title="Log Out">
              <IonIcon icon={logOutOutline} />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-home-content" scrollY={false}>
        {isLoading ? (
          <div className="syrn-home-spinner-container">
            <div className="syrn-spinner" />
          </div>
        ) : (
          <div className="syrn-home-container">
            <div className="syrn-success-icon-wrapper">
              <IonIcon icon={checkmarkCircleOutline} className="syrn-success-icon" />
            </div>
            
            <h1 className="syrn-welcome-title syrn-brand-font">
              Welcome, {getFirstName()}!
            </h1>
            
            <p className="syrn-role-subtitle">
              You are logged in as {user?.role || 'user'}
            </p>

            <button type="button" className="syrn-btn-primary syrn-explore-button">
              EXPLORE SYRN
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
