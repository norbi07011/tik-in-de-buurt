import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { useAuth } from '../src/contexts/AuthContext';
import { Page } from '../src/types';
import {
  HomeModernIcon as HomeIcon,
  SparklesIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  LifebuoyIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  BookmarkIcon,
  VideoCameraIcon,
  PencilSquareIcon,
} from './icons/Icons';

const SidebarLink: React.FC<{
  page: Page;
  id?: number;
  icon: React.ReactNode;
  text: string;
  isExpanded: boolean;
}> = ({ page, id, icon, text, isExpanded }) => {
  const { currentPage, activeBusinessId, navigate } = useStore();
  const isActive = currentPage === page && (!id || activeBusinessId === id);

  return (
    <button
      onClick={() => navigate(page, id)}
      className={`sidebar-link ${isActive ? 'active' : ''}`}
      title={isExpanded ? '' : text}
    >
      <span className="w-6 h-6 flex-shrink-0">{icon}</span>
      <span className="sidebar-link-text">{text}</span>
    </button>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { navigate, showToast } = useStore();
  const { logout, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sidebarRef.current;
    if (!node) return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    
    const handleMouseEnter = () => {
      if (mediaQuery.matches) setIsExpanded(true);
    };
    const handleMouseLeave = () => {
      if (mediaQuery.matches) setIsExpanded(false);
    };

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!user) return null;

  // If user is a business owner
  if (user.businessId) {
    const mainLinks = [
        { page: Page.Dashboard, icon: <HomeIcon />, text: t('dashboard') },
        { page: Page.BusinessProfile, id: user.businessId, icon: <BuildingStorefrontIcon />, text: t('my_business') },
        { page: Page.LiveStream, icon: <VideoCameraIcon />, text: t('live_stream_title') },
        { page: Page.Reviews, icon: <ChatBubbleOvalLeftEllipsisIcon />, text: t('manage_reviews') },
        { page: Page.MarketingServices, icon: <SparklesIcon />, text: t('marketing_services') },
    ];
    const bottomLinks = [
        { page: Page.Settings, icon: <Cog6ToothIcon />, text: t('settings') },
        { page: Page.Account, icon: <CreditCardIcon />, text: t('account') },
        { page: Page.Support, icon: <LifebuoyIcon />, text: t('support') },
    ];
    return (
        <>
        <div
            ref={sidebarRef}
            className={`sidebar ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}
        >
            <div className="flex-grow flex flex-col pt-20">
            <nav className="flex-grow flex flex-col gap-2">
                {mainLinks.map((link) => (
                <SidebarLink key={`${link.page}-${link.id || ''}`} {...link} isExpanded={isExpanded} />
                ))}
            </nav>
            <div className="pb-4">
                <div className="flex flex-col gap-2">
                    {bottomLinks.map((link) => (
                        <SidebarLink key={link.page} {...link} isExpanded={isExpanded} />
                    ))}
                </div>
                <button
                onClick={async () => {
                  await logout();
                  showToast(t('logout_success') || 'Logged out successfully', 'success');
                  navigate(Page.Home);
                  onClose();
                }}
                className="sidebar-link mt-4"
                title={isExpanded ? '' : t('logout')}
                >
                <span className="w-6 h-6 flex-shrink-0"><ArrowLeftOnRectangleIcon /></span>
                <span className="sidebar-link-text">{t('logout')}</span>
                </button>
            </div>
            </div>
        </div>
        <div
            className={`sidebar-overlay lg:hidden ${isOpen ? 'active' : ''}`}
            onClick={onClose}
        />
        </>
    );
  }

  // If user is a freelancer
  if (user.freelancerId) {
     const freelancerLinks = [
        { page: Page.FreelancerProfile, id: user.freelancerId, icon: <BuildingStorefrontIcon />, text: t('my_profile') },
        { page: Page.EditFreelancerCV, icon: <PencilSquareIcon />, text: t('edit_cv') },
        { page: Page.Saved, icon: <BookmarkIcon />, text: t('saved') },
        { page: Page.Support, icon: <LifebuoyIcon />, text: t('support') },
    ];
     return (
        <>
      <div
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="flex-grow flex flex-col pt-20">
          <div className="flex flex-col items-center mb-6 px-4">
              <div className="w-16 h-16 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[var(--primary)] text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
              </div>
              <p className={`mt-2 font-semibold text-lg text-[var(--text-primary)] transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{user.name}</p>
          </div>
          <nav className="flex-grow flex flex-col gap-2">
            {freelancerLinks.map((link) => (
              <SidebarLink key={link.page} {...link} isExpanded={isExpanded} />
            ))}
          </nav>
          <div className="pb-4">
            <button
              onClick={logout}
              className="sidebar-link mt-4"
              title={isExpanded ? '' : t('logout')}
            >
              <span className="w-6 h-6 flex-shrink-0"><ArrowLeftOnRectangleIcon /></span>
              <span className="sidebar-link-text">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
      <div
        className={`sidebar-overlay lg:hidden ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
    </>
    );
  }


  // If user is a regular user
  const regularUserLinks = [
    { page: Page.Saved, icon: <BookmarkIcon />, text: t('saved') },
    { page: Page.Support, icon: <LifebuoyIcon />, text: t('support') },
  ];

  return (
    <>
      <div
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="flex-grow flex flex-col pt-20">
          <div className="flex flex-col items-center mb-6 px-4">
              <div className="w-16 h-16 rounded-full bg-[var(--border-color)] flex items-center justify-center text-[var(--primary)] text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
              </div>
              <p className={`mt-2 font-semibold text-lg text-[var(--text-primary)] transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{user.name}</p>
          </div>
          <nav className="flex-grow flex flex-col gap-2">
            {regularUserLinks.map((link) => (
              <SidebarLink key={link.page} {...link} isExpanded={isExpanded} />
            ))}
          </nav>
          <div className="pb-4">
            <button
              onClick={logout}
              className="sidebar-link mt-4"
              title={isExpanded ? '' : t('logout')}
            >
              <span className="w-6 h-6 flex-shrink-0"><ArrowLeftOnRectangleIcon /></span>
              <span className="sidebar-link-text">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
      <div
        className={`sidebar-overlay lg:hidden ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
    </>
  );
};

export default Sidebar;
