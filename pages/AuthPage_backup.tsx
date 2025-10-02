import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/api';
import { Page } from '../src/types';
import { CATEGORIES } from '../src/constants';
import { UserIcon, EnvelopeIcon, LockClosedIcon, CheckCircleIcon, ArrowLeftIcon, BuildingStorefrontIcon, MapPinIcon, ShareIcon, BanknotesIcon, SparklesIcon } from '../components/icons/Icons';
import './AuthPage.css';


const BusinessRegistrationForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    const { login: loginAction, navigate, showToast } = useStore();
    const { registerBusiness } = useAuth();
    
    // State for form data
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        businessName: '', category: '', businessDescription: '',
        companyMotto: '', establishedYear: '', teamSize: '', spokenLanguages: '', paymentMethods: '', certifications: '', sustainabilityInfo: '',
        kvkNumber: '', btwNumber: '', iban: '',
        street: '', postalCode: '', city: 'Den Haag', phone: '', website: '', googleMapsUrl: '', otherLocations: [],
        instagram: '', facebook: '', twitter: '', linkedin: '', tiktokUrl: '', otherLinkUrl: ''
    });

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const goToNextStep = () => {
        if (step >= 6) return;
        setStep(s => s + 1);
    };

    const goToPrevStep = () => {
        if (step <= 1) return;
        setStep(s => s - 1);
    };
    
    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // Use AuthContext registerBusiness instead of direct API call
            await registerBusiness(formData);
            showToast(t('business_registration_success') || 'Business registered successfully', 'success');
            navigate(Page.Dashboard);
        } catch (err: any) {
            const errorMessage = t((err as Error).message) || t('error_registration_failed') || 'Registration failed';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            setIsLoading(false);
        }
    };
    
    const stepsContent = [
        { title: t('reg_step_1_title'), icon: UserIcon },
        { title: t('reg_step_2_title'), icon: BuildingStorefrontIcon },
        { title: t('reg_step_3_title'), icon: SparklesIcon },
        { title: t('reg_step_4_title'), icon: BanknotesIcon },
        { title: t('reg_step_5_title'), icon: MapPinIcon },
        { title: t('reg_step_6_title'), icon: ShareIcon }
    ];

    const StepIndicator: React.FC<{ currentStep: number; steps: { title: string; icon: React.FC<any> }[] }> = ({ currentStep, steps }) => (
        <div className="step-indicator">
            {steps.map((stepItem, index) => {
                const stepNum = index + 1;
                const isCompleted = currentStep > stepNum;
                const isActive = currentStep === stepNum;

                return (
                    <React.Fragment key={stepNum}>
                        <div className="step-item">
                            <div className={`step-circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                {isCompleted ? <CheckCircleIcon className="w-7 h-7" /> : <stepItem.icon className="w-6 h-6" />}
                            </div>
                            <p className={`step-text ${isActive ? 'active' : ''}`}>{stepItem.title}</p>
                        </div>
                        {index < steps.length - 1 && <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>}
                    </React.Fragment>
                )
            })}
        </div>
    );

    const renderStepContent = (stepToRender: number) => {
        const commonBackButton = <button type="button" onClick={goToPrevStep} className="btn-secondary">{t('back')}</button>;
        const commonContinueButton = <button type="button" onClick={goToNextStep} className="btn-primary">{t('continue')}</button>;

        switch (stepToRender) {
            case 1: return <div className="form">
                <h3 className="title">{stepsContent[0].title}</h3>
                <div className="input-group"><label className="input-label" htmlFor="name">{t('name')}</label><input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="email">{t('email_address')}</label><input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="password">{t('password')}</label><input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className="input-field" /></div>
                <div className="mt-auto flex justify-end"><button type="button" onClick={goToNextStep} className="btn-primary w-full mt-2">{t('continue')}</button></div>
            </div>;
            case 2: return <div className="form">
                <h3 className="title">{stepsContent[1].title}</h3>
                <div className="input-group"><label className="input-label" htmlFor="businessName">{t('business_name')}</label><input id="businessName" name="businessName" type="text" value={formData.businessName} onChange={handleChange} required className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="category">{t('business_category')}</label><select id="category" name="category" value={formData.category} onChange={handleChange} required className="input-field"><option value="">{t('all_categories')}</option>{CATEGORIES.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}</select></div>
                <div className="input-group"><label className="input-label" htmlFor="businessDescription">{t('business_description')}</label><textarea id="businessDescription" name="businessDescription" value={formData.businessDescription} onChange={handleChange} required rows={3} className="input-field"></textarea></div>
                <div className="mt-auto flex justify-between">{commonBackButton}{commonContinueButton}</div>
            </div>;
            case 3: return <div className="form">
                 <h3 className="title">{stepsContent[2].title}</h3>
                 <div className="input-group"><label className="input-label" htmlFor="companyMotto">{t('company_motto')}</label><input id="companyMotto" name="companyMotto" type="text" value={formData.companyMotto} onChange={handleChange} className="input-field" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="input-group"><label className="input-label" htmlFor="establishedYear">{t('established_in')}</label><input id="establishedYear" name="establishedYear" type="number" value={formData.establishedYear} onChange={handleChange} className="input-field" /></div>
                    <div className="input-group"><label className="input-label" htmlFor="teamSize">{t('team_size')}</label><input id="teamSize" name="teamSize" type="text" value={formData.teamSize} onChange={handleChange} placeholder="e.g., 1-5" className="input-field"/></div>
                </div>
                <div className="input-group"><label className="input-label" htmlFor="spokenLanguages">{t('spoken_languages')}</label><input id="spokenLanguages" name="spokenLanguages" type="text" value={formData.spokenLanguages} onChange={handleChange} placeholder="e.g., Dutch, English" className="input-field"/></div>
                <div className="input-group"><label className="input-label" htmlFor="paymentMethods">{t('payment_methods')}</label><input id="paymentMethods" name="paymentMethods" type="text" value={formData.paymentMethods} onChange={handleChange} placeholder="e.g., PIN, Credit Card" className="input-field"/></div>
                <div className="mt-auto flex justify-between">{commonBackButton}{commonContinueButton}</div>
            </div>;
            case 4: return <div className="form">
                <h3 className="title">{stepsContent[3].title}</h3>
                <div className="input-group"><label className="input-label" htmlFor="kvkNumber">{t('kvk_number')}</label><input id="kvkNumber" name="kvkNumber" type="text" value={formData.kvkNumber} onChange={handleChange} required className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="btwNumber">{t('btw_number')}</label><input id="btwNumber" name="btwNumber" type="text" value={formData.btwNumber} onChange={handleChange} required className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="iban">{t('iban')}</label><input id="iban" name="iban" type="text" value={formData.iban} onChange={handleChange} required className="input-field" /></div>
                <div className="mt-auto flex justify-between">{commonBackButton}{commonContinueButton}</div>
            </div>;
            case 5: return <div className="form">
                <h3 className="title">{stepsContent[4].title}</h3>
                <div className="input-group"><label className="input-label" htmlFor="street">{t('street_address')}</label><input id="street" name="street" type="text" value={formData.street} onChange={handleChange} required className="input-field" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group"><label className="input-label" htmlFor="postalCode">{t('postal_code')}</label><input id="postalCode" name="postalCode" type="text" value={formData.postalCode} onChange={handleChange} required className="input-field" /></div>
                  <div className="input-group"><label className="input-label" htmlFor="city">{t('city')}</label><input id="city" name="city" type="text" value={formData.city} onChange={handleChange} required className="input-field" /></div>
                </div>
                <div className="input-group"><label className="input-label" htmlFor="phone">{t('phone_number')}</label><input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="website">{t('website_url')}</label><input id="website" name="website" type="url" value={formData.website} onChange={handleChange} className="input-field" /></div>
                <div className="mt-auto flex justify-between">{commonBackButton}{commonContinueButton}</div>
            </div>;
            case 6: return <form onSubmit={handleFinalSubmit} className="form">
                <h3 className="title">{stepsContent[5].title}</h3>
                <div className="input-group"><label className="input-label" htmlFor="instagram">{t('instagram_url')}</label><input id="instagram" name="instagram" type="url" value={formData.instagram} onChange={handleChange} className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="facebook">{t('facebook_url')}</label><input id="facebook" name="facebook" type="url" value={formData.facebook} onChange={handleChange} className="input-field" /></div>
                <div className="input-group"><label className="input-label" htmlFor="tiktokUrl">{t('tiktok_url')}</label><input id="tiktokUrl" name="tiktokUrl" type="url" value={formData.tiktokUrl} onChange={handleChange} className="input-field" /></div>
                {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}
                <div className="mt-auto flex justify-between">{commonBackButton}<button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50">{isLoading ? t('creating_your_profile') : t('complete_registration')}</button></div>
            </form>;
            default: return null;
        }
    };

    const rotation = -(step - 1) * 60; // 60 degrees per step for a hexagon
    const cardAngle = 60;
    const translateZ = 330;

    return (
        <div className="business-reg-content">
             <button onClick={onBack} className="mb-4 text-sm text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2">
                <ArrowLeftIcon className="h-4 w-4" />
                <span>{t('back')}</span>
            </button>
            <header className="business-reg-header">
                <h1>{t('register_your_business_title')}</h1>
                <p>{t('register_your_business_subtitle')}</p>
            </header>
            <StepIndicator currentStep={step} steps={stepsContent}/>

            <div className="carousel-scene">
                <div 
                    className="carousel-container"
                    data-rotation={`${rotation}deg`}
                >
                    {stepsContent.map((_, index) => {
                        const stepNum = index + 1;
                        const cardRotation = index * cardAngle;
                        return (
                             <div 
                                key={stepNum}
                                className="carousel-card"
                                data-card-rotation={`${cardRotation}deg`}
                                data-card-translate-z={`${translateZ}px`}
                             >
                                 {renderStepContent(stepNum)}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const AuthPage: React.FC = () => {
    const { t } = useTranslation();
    const { navigate, showToast } = useStore();
    const { login, register, isLoading } = useAuth();
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [isBusinessRegOpen, setIsBusinessRegOpen] = useState(false);

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
            showToast(t('login_success') || 'Login successful', 'success');
            navigate(Page.Dashboard);
        } catch (err: any) {
            const errorMessage = (err as Error).message;
            showToast(t(errorMessage) || t('login_error') || 'Login failed', 'error');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSignupLoading(true);
        try {
            await register(signupName, signupEmail, signupPassword);
            showToast(t('registration_success') || 'Registration successful', 'success');
            navigate(Page.Dashboard);
        } catch (err: any) {
            const errorMessage = (err as Error).message;
            showToast(t(errorMessage) || t('registration_error') || 'Registration failed', 'error');
        } finally {
            setIsSignupLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) {
            showToast('Please enter your email address', 'error');
            return;
        }
        
        setIsForgotPasswordLoading(true);
        try {
            const response = await api.forgotPassword(forgotPasswordEmail);
            setForgotPasswordMessage(response.message);
            showToast('Password reset instructions sent to your email', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to send reset email', 'error');
        } finally {
            setIsForgotPasswordLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className={`auth-wrapper ${isRightPanelActive ? 'right-panel-active' : ''}`}>
                <div className="form-container register-container">
                    <form onSubmit={handleSignupSubmit} className="auth-form">
                        <h1>{t('sign_up')}</h1>
                        <div className="auth-input-wrapper">
                            <input id="signup-username" type="text" value={signupName} onChange={e => setSignupName(e.target.value)} required className="auth-input" placeholder=" "/>
                            <label htmlFor="signup-username">{t('username')}</label>
                            <UserIcon className="w-5 h-5" />
                        </div>
                         <div className="auth-input-wrapper">
                            <input id="signup-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="auth-input" placeholder=" "/>
                            <label htmlFor="signup-email">{t('email_address')}</label>
                            <EnvelopeIcon className="w-5 h-5" />
                        </div>
                         <div className="auth-input-wrapper">
                            <input id="signup-password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="auth-input" placeholder=" "/>
                            <label htmlFor="signup-password">{t('password')}</label>
                            <LockClosedIcon className="w-5 h-5" />
                        </div>
                        <button type="submit" disabled={isSignupLoading} className="submit-button mt-4">{t('sign_up')}</button>
                        <div className="auth-form-link-wrapper md:hidden">
                            <span>{t('already_have_account')} </span>
                            <button type="button" onClick={() => setIsRightPanelActive(false)} className="auth-form-link">{t('login')}</button>
                        </div>
                    </form>
                </div>
                <div className="form-container login-container">
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                        <h1>{t('login')}</h1>
                         <div className="auth-input-wrapper">
                            <input id="login-username" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="auth-input" placeholder=" "/>
                            <label htmlFor="login-username">{t('username')}</label>
                            <UserIcon className="w-5 h-5" />
                        </div>
                         <div className="auth-input-wrapper">
                            <input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="auth-input" placeholder=" "/>
                            <label htmlFor="login-password">{t('password')}</label>
                            <LockClosedIcon className="w-5 h-5" />
                        </div>
                        <button type="submit" disabled={isLoginLoading} className="submit-button mt-4">{t('login')}</button>
                        
                        {/* Forgot Password Link */}
                        <div className="text-center mt-3">
                            <button 
                                type="button" 
                                onClick={() => setIsForgotPasswordOpen(true)}
                                className="text-sm text-blue-400 hover:text-blue-300 underline bg-transparent border-none cursor-pointer"
                            >
                                {t('forgot_password') || 'Forgot Password?'}
                            </button>
                        </div>
                        
                        <div className="auth-form-link-wrapper md:hidden">
                            <span>{t('dont_have_account')} </span>
                            <button type="button" onClick={() => setIsRightPanelActive(true)} className="auth-form-link">{t('sign_up')}</button>
                        </div>
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1 className="text-4xl font-extrabold m-0 tracking-tight">{t('auth_welcome_back')}</h1>
                            <p className="text-sm font-light leading-5 tracking-wide m-5 max-w-xs">{t('auth_overlay_login_prompt')}</p>
                            <button className="submit-button ghost-button" onClick={() => setIsRightPanelActive(false)}>{t('login')}</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                             <h1 className="text-4xl font-extrabold m-0 tracking-tight">{t('auth_welcome')}</h1>
                            <p className="text-sm font-light leading-5 tracking-wide m-5 max-w-xs">{t('auth_overlay_register_prompt')}</p>
                            <button className="submit-button ghost-button" onClick={() => setIsRightPanelActive(true)}>{t('sign_up')}</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="business-reg-banner">
                <p>{t('are_you_a_business_owner')} 
                    <button 
                        onClick={() => navigate(Page.BusinessRegistration)}
                        className="font-semibold text-blue-300 hover:underline ml-2"
                    >
                        {t('register_your_business_here')}
                    </button>
                </p>
            </div>
            
            <div className="text-center mt-4">
                <button 
                    onClick={() => navigate(Page.BusinessRegistration)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                    Advanced Business Registration →
                </button>
            </div>

            {/* Forgot Password Modal */}
            {isForgotPasswordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {t('forgot_password') || 'Reset Password'}
                            </h2>
                            <button 
                                onClick={() => {
                                    setIsForgotPasswordOpen(false);
                                    setForgotPasswordEmail('');
                                    setForgotPasswordMessage('');
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        {forgotPasswordMessage ? (
                            <div className="text-center">
                                <div className="text-green-600 mb-4 p-3 bg-green-50 rounded-lg">
                                    {forgotPasswordMessage}
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsForgotPasswordOpen(false);
                                        setForgotPasswordEmail('');
                                        setForgotPasswordMessage('');
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {t('close') || 'Close'}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword}>
                                <p className="text-gray-600 mb-4">
                                    {t('forgot_password_instruction') || 'Enter your email address and we\'ll send you instructions to reset your password.'}
                                </p>
                                
                                <div className="auth-input-wrapper mb-4">
                                    <input 
                                        type="email" 
                                        value={forgotPasswordEmail} 
                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        required 
                                        className="auth-input" 
                                        placeholder={t('email_address') || 'Email Address'}
                                        aria-label={t('email_address') || 'Email Address'}
                                    />
                                    <label>{t('email_address') || 'Email Address'}</label>
                                    <EnvelopeIcon className="w-5 h-5" />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPasswordOpen(false);
                                            setForgotPasswordEmail('');
                                            setForgotPasswordMessage('');
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        {t('cancel') || 'Cancel'}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isForgotPasswordLoading}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isForgotPasswordLoading ? (t('sending') || 'Sending...') : (t('send_reset_link') || 'Send Reset Link')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuthPage;
