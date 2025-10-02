
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { Page } from '../src/types';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useStore(state => state.navigate);

    const [title, setTitle] = useState('');
    const fullTitle = t('home_hero_title');

    useEffect(() => {
      let i = 0;
      let isMounted = true;
      const type = () => {
        if (!isMounted) return;
        setTitle(fullTitle.substring(0, i));
        i++;
        if (i <= fullTitle.length) {
          setTimeout(type, 100);
        }
      };
      // Start typing after a short delay
      setTimeout(type, 300);
    
      return () => {
        isMounted = false;
      };
    }, [fullTitle]);

    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-16">
            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] animate-fade-in-down min-h-[60px] md:min-h-[120px] lg:min-h-[168px]">
                    {title}
                    <span className="animate-ping text-[var(--primary)]">_</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-[var(--text-secondary)] animate-fade-in-up">
                    {t('home_hero_subtitle')}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
                    <button onClick={() => navigate(Page.Discover)} className="w-full sm:w-auto px-8 py-3 font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                        {t('home_cta_discover')}
                    </button>
                    <button onClick={() => navigate(Page.Businesses)} className="w-full sm:w-auto px-8 py-3 font-bold text-[var(--text-primary)] bg-[var(--glass-bg)] backdrop-blur-sm border border-[var(--glass-border)] rounded-full hover:bg-[var(--glass-bg)]/80 transition-all duration-300 transform hover:scale-105">
                        {t('home_cta_businesses')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// FIX: Added default export for the HomePage component.
export default HomePage;
