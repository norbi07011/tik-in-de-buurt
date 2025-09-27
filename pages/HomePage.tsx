
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
        <div className="flex-grow flex items-center justify-center text-center relative overflow-hidden">
            <div className="relative z-10 p-8">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br from-white to-gray-400 animate-fade-in-down min-h-[96px] md:min-h-[168px]">
                    {title}
                    <span className="animate-ping">_</span>
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300 animate-fade-in-up">
                    {t('home_hero_subtitle')}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
                    <button onClick={() => navigate(Page.Discover)} className="px-8 py-3 font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                        {t('home_cta_discover')}
                    </button>
                    <button onClick={() => navigate(Page.Businesses)} className="px-8 py-3 font-bold text-[var(--text-primary)] bg-white/20 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-black/50 rounded-full hover:bg-white/30 dark:hover:bg-black/40 transition-all duration-300 transform hover:scale-105">
                        {t('home_cta_businesses')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// FIX: Added default export for the HomePage component.
export default HomePage;
