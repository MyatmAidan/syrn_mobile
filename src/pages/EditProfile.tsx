import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonToast,
} from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { ApiService, SkinType, UserProfile, persistAuthSession } from '../services/apiService';
import './EditProfile.css';

const EditProfile: React.FC = () => {
  const history = useHistory();
  const [fullName, setFullName] = useState('');
  const [skinType, setSkinType] = useState('');
  const [skinConcern, setSkinConcern] = useState('');
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const load = async () => {
      const [profile, types] = await Promise.all([
        ApiService.getProfile(),
        ApiService.getSkinTypes(),
      ]);

      if (profile) {
        setFullName(profile.full_name);
        setSkinType(profile.skin_type || '');
        setSkinConcern(profile.skin_concern || '');
      } else {
        const { value: userJson } = await Preferences.get({ key: 'user' });
        if (userJson) {
          const cached: UserProfile = JSON.parse(userJson);
          setFullName(cached.full_name);
          setSkinType(cached.skin_type || '');
          setSkinConcern(cached.skin_concern || '');
        }
      }

      setSkinTypes(types);
      setIsLoading(false);
    };

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setToastColor('danger');
      setToastMessage('Full name is required.');
      setShowToast(true);
      return;
    }

    setIsSaving(true);
    const res = await ApiService.updateProfile({
      full_name: fullName.trim(),
      skin_type: skinType.trim() || null,
      skin_concern: skinConcern.trim() || null,
    });
    setIsSaving(false);

    if (res.success && res.data) {
      const { value: token } = await Preferences.get({ key: 'auth_token' });
      if (token) {
        await persistAuthSession(token, res.data);
      } else {
        await Preferences.set({ key: 'user', value: JSON.stringify(res.data) });
      }
      setToastColor('success');
      setToastMessage('Profile saved.');
      setShowToast(true);
      setTimeout(() => history.replace('/app/profile'), 800);
    } else {
      setToastColor('danger');
      setToastMessage(res.message);
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="syrn-detail-spinner-container">
            <div className="syrn-spinner" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border syrn-edit-profile-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Edit profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="syrn-edit-profile-content">
        <form className="syrn-edit-profile-form" onSubmit={handleSubmit}>
          <label className="syrn-edit-profile-label">
            Full name
            <input
              type="text"
              className="syrn-edit-profile-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={150}
            />
          </label>

          <label className="syrn-edit-profile-label">
            Skin type
            <select
              className="syrn-edit-profile-input"
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
            >
              <option value="">Select skin type</option>
              {skinTypes.map((st) => (
                <option key={st.skin_type_id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </label>

          <label className="syrn-edit-profile-label">
            Skin concerns
            <textarea
              className="syrn-edit-profile-input syrn-edit-profile-textarea"
              value={skinConcern}
              onChange={(e) => setSkinConcern(e.target.value)}
              rows={3}
              maxLength={255}
              placeholder="e.g. dryness, redness"
            />
          </label>

          <button type="submit" className="syrn-btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2500}
          color={toastColor}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;
