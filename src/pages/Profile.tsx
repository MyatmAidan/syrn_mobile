import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
} from '@ionic/react';
import { logOutOutline, personOutline, mailOutline, shieldHalfOutline, sparklesOutline, createOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { ApiService, UserProfile } from '../services/apiService';
import './Profile.css';

const Profile: React.FC = () => {
  const history = useHistory();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await ApiService.getProfile();
        if (profile) {
          setUser(profile);
          await Preferences.set({ key: 'user', value: JSON.stringify(profile) });
        } else {
          const { value: userJson } = await Preferences.get({ key: 'user' });
          if (userJson) {
            setUser(JSON.parse(userJson));
          }
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
      await Preferences.clear();
      setIsLoading(false);
      history.replace('/login');
    }
  };

  return (
    <IonPage>
      <IonHeader className="syrn-profile-header ion-no-border">
        <IonToolbar className="syrn-profile-toolbar">
          <IonTitle className="syrn-brand-font syrn-page-title">Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-profile-content syrn-page-bg" scrollY={true}>
        {isLoading ? (
          <div className="syrn-profile-spinner-container">
            <div className="syrn-spinner" />
          </div>
        ) : (
          <div className="syrn-profile-container">
            <div className="syrn-profile-card">
              <div className="syrn-profile-avatar-container">
                <div className="syrn-profile-avatar-ring" />
                <div className="syrn-profile-avatar">
                  <IonIcon icon={personOutline} />
                </div>
              </div>
              <h2 className="syrn-profile-name syrn-brand-font">{user?.full_name || 'Syrn User'}</h2>
              <span className="syrn-profile-role-badge">{user?.role || 'skincare client'}</span>
            </div>

            <div className="syrn-profile-details">
              <div className="syrn-profile-detail-item">
                <div className="syrn-detail-item-icon-wrap">
                  <IonIcon icon={mailOutline} className="syrn-detail-item-icon" />
                </div>
                <div className="syrn-detail-item-text">
                  <span className="syrn-detail-item-label">Email</span>
                  <span className="syrn-detail-item-value">{user?.email || 'No email registered'}</span>
                </div>
              </div>

              <div className="syrn-profile-detail-item">
                <div className="syrn-detail-item-icon-wrap">
                  <IonIcon icon={sparklesOutline} className="syrn-detail-item-icon" />
                </div>
                <div className="syrn-detail-item-text">
                  <span className="syrn-detail-item-label">Skin Type</span>
                  <span className="syrn-detail-item-value">{user?.skin_type || 'Not set'}</span>
                </div>
              </div>

              <div className="syrn-profile-detail-item">
                <div className="syrn-detail-item-icon-wrap">
                  <IonIcon icon={shieldHalfOutline} className="syrn-detail-item-icon" />
                </div>
                <div className="syrn-detail-item-text">
                  <span className="syrn-detail-item-label">Skin Concerns</span>
                  <span className="syrn-detail-item-value">{user?.skin_concern || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="syrn-profile-actions">
              <button
                type="button"
                className="syrn-btn-secondary syrn-profile-edit-btn"
                onClick={() => history.push('/app/profile/edit')}
              >
                <IonIcon icon={createOutline} className="syrn-logout-btn-icon" />
                Edit Profile
              </button>

              <button type="button" className="syrn-btn-primary syrn-logout-action-btn" onClick={handleLogout}>
                <IonIcon icon={logOutOutline} className="syrn-logout-btn-icon" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
