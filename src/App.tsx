
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Page } from './types';
import HomePage from '../pages/HomePage';
import DiscoverPage from '../pages/DiscoverPage';
import DealsPage from '../pages/DealsPage';
import BusinessesPage from '../pages/BusinessesPage';
import RealEstatePage from '../pages/RealEstatePage';
import PropertyListingPage from '../pages/PropertyListingPage';
import BusinessProfilePage from '../pages/BusinessProfilePage';
import AuthPage from '../pages/AuthPage';
import AddAdPage from '../pages/AddAdPage';
import LiveStreamPage from '../pages/LiveStreamPage';
import SettingsPage from '../pages/SettingsPage';
import SavedPage from '../pages/SavedPage';
import JobsPage from '../pages/JobsPage';
import FreelancerProfilePage from '../pages/FreelancerProfilePage';
import WallPage from '../pages/WallPage';
import AccountPage from '../pages/AccountPage';
import SubscriptionSuccessPage from '../pages/SubscriptionSuccessPage';
import DashboardPage from '../pages/DashboardPage';
import ReviewsPage from '../pages/ReviewsPage';
import SupportPage from '../pages/SupportPage';
import NorbsServicePage from '../pages/NorbsServicePage';
import RegistrationSuccessPage from '../pages/RegistrationSuccessPage';
import EditFreelancerCVPage from '../pages/EditFreelancerCVPage';
import BusinessRegistrationPage from '../pages/BusinessRegistrationPage';
import { UserIcon, Bars3Icon, XMarkIcon } from '../components/icons/Icons';
import { useStore } from './store';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import LoadingBar from '../components/common/LoadingBar';
import Toast from '../components/common/Toast';
import ThemeToggle from '../components/ThemeToggle';


const Logo: React.FC = () => (
    <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[var(--primary-text)] font-extrabold text-xl">T</span>
        </div>
        <div>
            <h1 className="text-base sm:text-lg font-bold tracking-wide text-[var(--text-primary)] leading-tight whitespace-nowrap">
              Tik in de buurt
            </h1>
            {/* Subtitle hidden on extra small screens to save space */}
            <p className="text-xs text-[var(--text-secondary)] leading-tight -mt-1 hidden sm:block">Local ads in your city</p>
        </div>
    </div>
);

const NavLink: React.FC<{ page: Page, children: React.ReactNode, className?: string, onClick?: () => void }> = ({ page, children, className = '', onClick }) => {
    const { currentPage, navigate } = useStore();
    const isActive = currentPage === page || 
                     (currentPage === Page.BusinessProfile && page === Page.Businesses) ||
                     (currentPage === Page.FreelancerProfile && page === Page.Jobs) ||
                     (currentPage === Page.PropertyListing && page === Page.RealEstate);
    
    const handleClick = () => {
        navigate(page);
        if (onClick) onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`px-3 py-2 text-sm font-medium transition-colors duration-300 relative whitespace-nowrap ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            } ${className}`}
        >
            {children}
            {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[var(--primary)]"></span>}
        </button>
    );
};

const Header: React.FC<{ onMenuClick: () => void; currentUser: any }> = ({ onMenuClick, currentUser }) => {
  const { t } = useTranslation();
  const { currentPage, navigate } = useStore();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  
  const navItems = [
    { page: Page.Home, label: t('home') },
    { page: Page.Discover, label: t('discover') },
    { page: Page.Wall, label: t('wall') },
    { page: Page.Businesses, label: t('businesses') },
    { page: Page.RealEstate, label: t('real_estate') },
    { page: Page.Jobs, label: t('jobs') },
    { page: Page.Deals, label: t('deals') },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--glass-bg)] backdrop-blur-lg border-b border-[var(--glass-border)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Logo */}
            <div className="flex items-center">
              <Logo />
            </div>
            
            {/* Center Nav (Desktop) */}
            <div className="hidden md:flex flex-grow items-center justify-center">
              <nav className="flex items-center space-x-1 lg:space-x-2">
                {navItems.map(item => (
                  <NavLink key={item.page} page={item.page}>{item.label}</NavLink>
                ))}
              </nav>
            </div>

            {/* Right Side: Controls */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <ThemeToggle />
                <LanguageSwitcher />
                
                {/* Mobile Nav Toggle */}
                <button
                    onClick={() => setMobileNavOpen(!isMobileNavOpen)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label={t('menu')}
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>

                {/* Desktop User Controls */}
                <div className="hidden md:flex items-center">
                  {currentUser ? (
                   <div className="flex items-center gap-2 ml-2">
                     <div className="hidden lg:flex w-8 h-8 rounded-full bg-[var(--border-color)] items-center justify-center text-[var(--primary)] font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                     </div>
                     <button onClick={onMenuClick} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-black/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('menu')}>
                        <Bars3Icon className="w-6 h-6" />
                     </button>
                   </div>
                  ) : (
                    <button
                      onClick={() => navigate(Page.Auth)}
                      className="ml-2 px-4 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('login')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Panel */}
      <div className={`fixed inset-0 z-[100] bg-[var(--background)]/95 backdrop-blur-md md:hidden transition-transform duration-300 ease-in-out ${isMobileNavOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
            <Logo />
            <button onClick={() => setMobileNavOpen(false)} className="p-2" aria-label="Close navigation menu">
                <XMarkIcon className="w-6 h-6 text-[var(--text-secondary)]" />
            </button>
        </div>
        <nav className="flex flex-col items-center justify-center h-full -mt-16">
            {navItems.map(item => (
                <NavLink key={item.page} page={item.page} className="text-2xl font-bold py-4" onClick={() => setMobileNavOpen(false)}>
                    {item.label}
                </NavLink>
            ))}
             <div className="mt-8">
                  {currentUser ? (
                      <button onClick={() => { onMenuClick(); setMobileNavOpen(false); }} className="w-full text-center px-6 py-3 text-lg font-bold bg-[var(--border-color)] text-[var(--text-primary)] rounded-full">
                        {t('my_business')}
                      </button>
                  ) : (
                    <button
                      onClick={() => { navigate(Page.Auth); setMobileNavOpen(false); }}
                      className="px-8 py-3 text-lg font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full flex items-center gap-2"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>{t('login')}</span>
                    </button>
                  )}
                </div>
        </nav>
      </div>
    </>
  );
};

const AppContent: React.FC = () => {
  const { currentPage, activeBusinessId, activePropertyId, activeFreelancerId, user } = useStore();
  const { user: authUser } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const previousPage = React.useRef(currentPage);

  // Use auth user if available, fallback to store user
  const currentUser = authUser || user;

  useEffect(() => {
    if (previousPage.current !== currentPage) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        previousPage.current = currentPage;
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  const renderPage = () => {
    const isBusinessUser = !!user?.businessId;
    const isFreelancerUser = !!user?.freelancerId;


    switch (currentPage) {
        case Page.Home:
            return <HomePage />;
        case Page.Dashboard:
            return (
                <ProtectedRoute requireAuth={true} requireBusiness={true}>
                    <DashboardPage />
                </ProtectedRoute>
            );
        case Page.Discover:
            return <DiscoverPage />;
        case Page.Deals:
            return <DealsPage />;
        case Page.Businesses:
            return <BusinessesPage />;
        case Page.RealEstate:
            return <RealEstatePage />;
        case Page.Jobs:
            return <JobsPage />;
        case Page.Wall:
            return <WallPage />;
        case Page.FreelancerProfile:
            return activeFreelancerId ? <FreelancerProfilePage freelancerId={activeFreelancerId} /> : <JobsPage />;
        case Page.PropertyListing:
             return activePropertyId ? <PropertyListingPage propertyId={activePropertyId} /> : <RealEstatePage />;
        case Page.AddAd:
            return (
                <ProtectedRoute requireAuth={true} requireBusiness={true}>
                    <AddAdPage />
                </ProtectedRoute>
            );
        case Page.BusinessProfile:
            return activeBusinessId ? <BusinessProfilePage businessId={activeBusinessId} /> : <BusinessesPage />;
        case Page.Auth:
            return <AuthPage />;
        case Page.BusinessRegistration:
            return <BusinessRegistrationPage />;
        case Page.RegistrationSuccess:
            return <RegistrationSuccessPage />;
        case Page.LiveStream:
            return (
                <ProtectedRoute requireAuth={true} requireBusiness={true}>
                    <LiveStreamPage />
                </ProtectedRoute>
            );
        case Page.Settings:
            return (
                <ProtectedRoute requireAuth={true}>
                    <SettingsPage />
                </ProtectedRoute>
            );
        case Page.Saved:
            return user ? <SavedPage /> : <AuthPage />;
        case Page.Account:
            return isBusinessUser ? <AccountPage /> : <HomePage />;
        case Page.SubscriptionSuccess:
            return isBusinessUser ? <SubscriptionSuccessPage /> : <HomePage />;
        case Page.Reviews:
            return isBusinessUser ? <ReviewsPage businessId={user.businessId!} /> : <HomePage />;
        case Page.Support:
            return <SupportPage />;
        case Page.MarketingServices:
            return isBusinessUser ? <NorbsServicePage /> : <HomePage />;
        case Page.EditFreelancerCV:
            return isFreelancerUser ? <EditFreelancerCVPage freelancerId={user.freelancerId!} /> : <HomePage />;
        default:
            return <HomePage />;
    }
  };

  return (
    <>
      <div className="animated-dots-bg" />
      <LoadingBar />
      <Toast />
      <div className="min-h-screen flex flex-col bg-transparent relative">
        {currentUser && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        <Header onMenuClick={() => setIsSidebarOpen(true)} currentUser={currentUser} />
        <main className={`flex-grow pt-16 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'main-with-sidebar' : ''} ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {renderPage()}
        </main>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
