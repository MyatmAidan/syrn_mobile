import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { mailOutline, lockClosedOutline, warningOutline } from 'ionicons/icons';
import SyrnBrandPainter from '../components/SyrnBrandPainter';
import SoftSparkles from '../components/SoftSparkles';
import { ApiService, persistAuthSession } from '../services/apiService';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const validate = () => {
    let isValid = true;
    
    if (!email) {
      setEmailError('Email required');
      isValid = false;
    } else if (!email.includes('@')) {
      setEmailError('Enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrorMessage('');
    setAttemptsLeft(null);

    try {
      const response = await ApiService.login(email.trim(), password);

      if (response.success && response.data) {
        await persistAuthSession(response.data.token, response.data.user);
        history.replace('/app/catalog');
      } else {
        setErrorMessage(response.message || 'Login failed.');
        if (response.errors) {
          const errorsStr = Object.values(response.errors).flat().join(' ');
          setErrorMessage(errorsStr || response.message);
        }
        
        // Set attempts left if returned by the response
        if (response.attempts_left !== undefined) {
          setAttemptsLeft(response.attempts_left);
        } else if ((response as any).data?.attempts_left !== undefined) {
          setAttemptsLeft((response as any).data.attempts_left);
        }
      }
    } catch (error) {
      console.error('Login action error:', error);
      setErrorMessage('Network error. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="syrn-login-content syrn-page-bg" scrollY={true}>
        <div className="syrn-login-container">
          <SoftSparkles count={8} />
          <div className="syrn-login-orb syrn-login-orb-1" />
          <div className="syrn-login-orb syrn-login-orb-2" />
          <form className="syrn-login-form" onSubmit={handleLogin} noValidate>
            
            {/* Elegant brand mark (simplified version) */}
            <div className="syrn-login-brand-wrapper">
              <SyrnBrandPainter size={80} simplified={true} />
            </div>

            <h1 className="syrn-login-title syrn-brand-font syrn-animate-gradient-text">syrn</h1>
            <p className="syrn-login-subtitle">SIGN IN</p>

            <div className="syrn-form-fields-container">
              {/* Email Input Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">Email</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={mailOutline} />
                  </span>
                  <input
                    type="email"
                    className="syrn-input-field"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {emailError && <div className="syrn-validation-error">{emailError}</div>}
              </div>

              {/* Password Input Field */}
              <div className="syrn-input-container">
                <label className="syrn-input-label">Password</label>
                <div className="syrn-input-wrapper">
                  <span className="syrn-input-icon">
                    <IonIcon icon={lockClosedOutline} />
                  </span>
                  <input
                    type="password"
                    className="syrn-input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {passwordError && <div className="syrn-validation-error">{passwordError}</div>}
              </div>
            </div>

            {/* Attempts Left Notification */}
            {attemptsLeft !== null && (
              <div className="syrn-warning-container">
                <IonIcon icon={warningOutline} className="syrn-warning-icon" />
                <span className="syrn-warning-text">
                  Invalid password. {attemptsLeft} attempt(s) left.
                </span>
              </div>
            )}

            {/* Login Submission Button or Loading Spinner */}
            <div className="syrn-login-actions">
              {isLoading ? (
                <div className="syrn-spinner-container">
                  <div className="syrn-spinner" />
                </div>
              ) : (
                <button type="submit" className="syrn-btn-primary">
                  LOGIN
                </button>
              )}
            </div>

            {/* Error Message Notification */}
            {errorMessage && (
              <div className="syrn-error-banner">
                {errorMessage}
              </div>
            )}

            {/* Section Divider */}
            <div className="syrn-divider-container">
              <div className="syrn-divider-line" />
              <span className="syrn-divider-text">NEW HERE?</span>
              <div className="syrn-divider-line" />
            </div>

            {/* Create Account Link */}
            <button
              type="button"
              className="syrn-btn-text"
              onClick={() => history.push('/signup')}
            >
              CREATE AN ACCOUNT
            </button>

          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
