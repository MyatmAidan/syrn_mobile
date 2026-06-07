import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonIcon, IonToast } from '@ionic/react';
import { arrowBackOutline, personOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { ApiService, persistAuthSession } from '../services/apiService';
import './Signup.css';

const Signup: React.FC = () => {
  const history = useHistory();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password required';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await ApiService.register(
        firstName.trim(),
        lastName.trim(),
        email.trim(),
        password
      );

      if (response.success && response.data?.token && response.data?.user) {
        await persistAuthSession(response.data.token, response.data.user);
        setToastColor('success');
        setToastMessage('Account created successfully');
        setShowToast(true);
        setTimeout(() => {
          history.replace('/app/catalog');
        }, 800);
      } else if (response.success) {
        setToastColor('success');
        setToastMessage('Account created. Please log in.');
        setShowToast(true);
        setTimeout(() => history.push('/login'), 1500);
      } else {
        setToastColor('danger');
        let errMsg = response.message || 'Registration failed';
        if (response.errors) {
          const errorsStr = Object.values(response.errors).flat().join(' ');
          errMsg = errorsStr || errMsg;
        }
        setToastMessage(errMsg);
        setShowToast(true);
      }
    } catch (error) {
      console.error('Registration processing error:', error);
      setToastColor('danger');
      setToastMessage('Network error. Check your connection.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="syrn-signup-header ion-no-border">
        <IonToolbar className="syrn-signup-toolbar">
          <IonButtons slot="start">
            <button type="button" className="syrn-back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="syrn-signup-content" scrollY={true}>
        <div className="syrn-signup-container">
          <form className="syrn-signup-form" onSubmit={handleSignup} noValidate>
            
            <h1 className="syrn-signup-title syrn-brand-font">syrn</h1>
            <p className="syrn-signup-subtitle">CREATE ACCOUNT</p>

            <div className="syrn-form-fields-container">
              {/* First Name Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">First Name</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={personOutline} />
                  </span>
                  <input
                    type="text"
                    className="syrn-input-field"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                {errors.firstName && <div className="syrn-validation-error">{errors.firstName}</div>}
              </div>

              {/* Last Name Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">Last Name</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={personOutline} />
                  </span>
                  <input
                    type="text"
                    className="syrn-input-field"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                {errors.lastName && <div className="syrn-validation-error">{errors.lastName}</div>}
              </div>

              {/* Email Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">Email</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={mailOutline} />
                  </span>
                  <input
                    type="email"
                    className="syrn-input-field"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <div className="syrn-validation-error">{errors.email}</div>}
              </div>

              {/* Password Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">Password</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={lockClosedOutline} />
                  </span>
                  <input
                    type="password"
                    className="syrn-input-field"
                    placeholder="Enter password (min 8 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {errors.password && <div className="syrn-validation-error">{errors.password}</div>}
              </div>

              {/* Confirm Password Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">Confirm Password</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={lockClosedOutline} />
                  </span>
                  <input
                    type="password"
                    className="syrn-input-field"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {errors.confirmPassword && <div className="syrn-validation-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="syrn-signup-actions">
              {isLoading ? (
                <div className="syrn-spinner-container">
                  <div className="syrn-spinner" />
                </div>
              ) : (
                <button type="submit" className="syrn-btn-primary">
                  CREATE ACCOUNT
                </button>
              )}
            </div>

            {/* Back to Sign In Link */}
            <div className="syrn-signin-link-container">
              <span className="syrn-signin-text">Already have an account? </span>
              <button
                type="button"
                className="syrn-signin-action"
                onClick={() => history.push('/login')}
              >
                SIGN IN
              </button>
            </div>

          </form>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2500}
        color={toastColor}
        position="bottom"
      />
    </IonPage>
  );
};

export default Signup;
