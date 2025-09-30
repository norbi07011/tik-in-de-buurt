import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdWithBusiness } from '../src/types';
import AdCard from './AdCard';

const ScrollAnimationWrapper: React.FC<{ children: React.ReactNode, delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: '0px', threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, []);

    return (
        <div ref={ref} className={`scroll-animate ${isVisible ? 'is-visible' : ''}`} data-delay={delay}>
            {children}
        </div>
    );
};

const BusinessAds: React.FC<{ ads: AdWithBusiness[] }> = ({ ads }) => {
    if (ads.length === 0) {
        return <div className="col-span-full text-center text-[var(--text-secondary)] py-10">This business has not posted any ads yet.</div>;
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad, index) => (
                <ScrollAnimationWrapper key={ad.id} delay={index * 100}>
                    <AdCard ad={ad} />
                </ScrollAnimationWrapper>
            ))}
        </div>
    );
};

export default BusinessAds;
