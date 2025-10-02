import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from './icons/Icons';

const Lightbox: React.FC<{ images: string[], selectedIndex: number, onClose: () => void, onNavigate: (index: number) => void }> = ({ images, selectedIndex, onClose, onNavigate }) => {
    const { t } = useTranslation();
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNavigate((selectedIndex + 1) % images.length);
            if (e.key === 'ArrowLeft') onNavigate((selectedIndex - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, images.length, onClose, onNavigate]);

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-[110]" aria-label="Close gallery">
                <XMarkIcon className="w-10 h-10" />
            </button>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onNavigate((selectedIndex - 1 + images.length) % images.length); }}
                className="absolute left-4 p-3 bg-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all z-[110]"
                aria-label={t('previous')}
            >
                <ArrowLeftIcon className="w-7 h-7" />
            </button>

            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img src={images[selectedIndex]} alt={`Gallery view ${selectedIndex + 1}`} className="max-w-full max-h-full object-contain" />
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onNavigate((selectedIndex + 1) % images.length); }}
                className="absolute right-4 p-3 bg-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all z-[110]"
                aria-label={t('next')}
            >
                <ArrowRightIcon className="w-7 h-7" />
            </button>
            
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

const BusinessGallery: React.FC<{ images: string[] }> = ({ images }) => {
    const { t } = useTranslation();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (images.length === 0) {
        return <div className="col-span-full text-center text-[var(--text-secondary)] py-10 glass-card-style">{t('gallery_no_images_found')}</div>;
    }
    
    return (
        <div className="glass-card-style p-4">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                     <div key={index} className="aspect-square rounded-lg overflow-hidden cursor-pointer group" onClick={() => setLightboxIndex(index)}>
                        <img src={img} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                ))}
            </div>
            {lightboxIndex !== null && (
                <Lightbox 
                    images={images}
                    selectedIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </div>
    );
};

export default BusinessGallery;
