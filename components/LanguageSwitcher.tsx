
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../src/constants';
import type { Language } from '../src/types';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n, i18n.language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang.code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 dark:bg-black/20 border border-[var(--border-color)] rounded-lg hover:bg-white/20 dark:hover:bg-black/30 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-50"
      >
        <span className="font-semibold uppercase text-sm tracking-wider text-[var(--text-primary)]">{currentLanguage.code}</span>
        <svg className={`w-4 h-4 transition-transform duration-300 text-[var(--text-secondary)] ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--background-alt)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in-down">
          <ul>
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => changeLanguage(lang)}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)] transition-colors duration-200"
                >
                  <lang.flag className="w-5 h-5 rounded-sm" />
                  <span>{lang.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
