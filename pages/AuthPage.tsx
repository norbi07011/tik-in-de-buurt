import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { useAuth } from '../src/contexts/AuthContext';
import { Page } from '../src/types';
import './AuthPage.css';

const AuthPage: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, showToast } = useStore();
    const { login, register, requestPasswordReset, isLoading } = useAuth();
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [isSignupLoading, setIsSignupLoading] = useState(false);
    
    // Forgot password state
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoginLoading(true);
        try {
            await login(loginEmail, loginPassword);
            showToast(t('login_successful') || 'Login successful', 'success');
            navigate(Page.Home);
        } catch (error) {
            console.error('Login failed:', error);
            showToast(t('login_failed') || 'Login failed', 'error');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSignupLoading(true);
        try {
            await register(signupName, signupEmail, signupPassword);
            showToast(t('signup_successful') || 'Account created successfully', 'success');
            navigate(Page.Home);
        } catch (error) {
            console.error('Signup failed:', error);
            showToast(t('signup_failed') || 'Signup failed', 'error');
        } finally {
            setIsSignupLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsForgotPasswordLoading(true);
        try {
            await requestPasswordReset?.(forgotPasswordEmail);
            setForgotPasswordMessage('Password reset email sent');
            showToast(t('password_reset_sent') || 'Password reset email sent', 'success');
        } catch (error) {
            console.error('Password reset failed:', error);
            showToast(t('password_reset_failed') || 'Failed to send password reset email', 'error');
        } finally {
            setIsForgotPasswordLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="auth-container">
                <div className="form-container sign-up-container">
                    <form onSubmit={handleSignupSubmit}>
                        <h1>{t('create_account')}</h1>
                        <input
                            id="signup-name"
                            name="name"
                            type="text"
                            placeholder={t('name')}
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                        />
                        <input
                            id="signup-email"
                            name="email"
                            type="email"
                            placeholder={t('email')}
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                        />
                        <input
                            id="signup-password"
                            name="password"
                            type="password"
                            placeholder={t('password')}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={isSignupLoading || isLoading}>
                            {isSignupLoading ? t('creating_account') : t('sign_up')}
                        </button>
                    </form>
                </div>

                <div className="form-container sign-in-container">
                    <form onSubmit={handleLoginSubmit}>
                        <h1>{t('sign_in')}</h1>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            placeholder={t('email')}
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            placeholder={t('password')}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={() => setIsForgotPasswordOpen(true)}
                        >
                            {t('forgot_password')}
                        </button>
                        <button type="submit" disabled={isLoginLoading || isLoading}>
                            {isLoginLoading ? t('signing_in') : t('sign_in')}
                        </button>
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>{t('welcome_back')}</h1>
                            <p className="text-sm font-light leading-5 tracking-wide m-5 max-w-xs">
                                {t('auth_overlay_signin_prompt')}
                            </p>
                            <button
                                className="ghost"
                                id="signIn"
                                onClick={() => setIsRightPanelActive(false)}
                            >
                                {t('sign_in')}
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>{t('hello_friend')}</h1>
                            <p className="text-sm font-light leading-5 tracking-wide m-5 max-w-xs">
                                {t('auth_overlay_register_prompt')}
                            </p>
                            <button
                                className="ghost"
                                id="signUp"
                                onClick={() => setIsRightPanelActive(true)}
                            >
                                {t('sign_up')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Registration Banner */}
            <div className="business-reg-banner">
                <p>
                    {t('are_you_a_business_owner')} 
                    <button 
                        onClick={() => navigate(Page.BusinessRegistration)}
                        className="font-semibold text-blue-300 hover:underline ml-2 transition-colors duration-200"
                    >
                        {t('register_your_business_here')}
                    </button>
                </p>
            </div>
            
            <div className="text-center mt-4">
                <button 
                    onClick={() => navigate(Page.BusinessRegistration)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
                >
                    Advanced Business Registration →
                </button>
            </div>

            {/* Forgot Password Modal */}
            {isForgotPasswordOpen && (
                <div className="modal-overlay" onClick={() => setIsForgotPasswordOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('reset_password')}</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setIsForgotPasswordOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        {forgotPasswordMessage ? (
                            <div className="modal-body">
                                <div className="success-message">
                                    <p>{forgotPasswordMessage}</p>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        className="btn-primary"
                                        onClick={() => {
                                            setIsForgotPasswordOpen(false);
                                            setForgotPasswordMessage('');
                                            setForgotPasswordEmail('');
                                        }}
                                    >
                                        {t('ok')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPasswordSubmit}>
                                <div className="modal-body">
                                    <p className="mb-4">{t('enter_email_for_reset')}</p>
                                    <input
                                        id="forgot-password-email"
                                        name="email"
                                        type="email"
                                        placeholder={t('email')}
                                        value={forgotPasswordEmail}
                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setIsForgotPasswordOpen(false)}
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isForgotPasswordLoading}
                                    >
                                        {isForgotPasswordLoading ? t('sending') : t('send_reset_link')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;