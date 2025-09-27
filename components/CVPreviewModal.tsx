import React from 'react';
import { useTranslation } from 'react-i18next';
import { CV, Freelancer, Business } from '../src/types';
import { generateCvHtml } from '../utils/cvGenerator';
import { XMarkIcon } from './icons/Icons';

type CvEntity = (Freelancer | Business) & { cv: NonNullable<(Freelancer | Business)['cv']> };

interface CVPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    cvData: CV;
    entity: Omit<CvEntity, 'cv'>;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({ isOpen, onClose, cvData, entity }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const fullEntity = { ...entity, cv: cvData } as CvEntity;
    const cvHtml = generateCvHtml(fullEntity, t);

    return (
        <div className="fixed inset-0 bg-black/80 z-[101] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-[#0c1d2e] border border-purple-800/50 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[90vh] animate-slide-up-fast"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex justify-between items-center border-b border-[var(--border-color-alt)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{t('preview_cv')}</h2>
                    <button onClick={onClose} aria-label="Close preview"><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </header>

                <main className="p-2 flex-1 bg-gray-200">
                    <iframe
                        srcDoc={cvHtml}
                        title="CV Preview"
                        className="w-full h-full border-0 rounded"
                    />
                </main>
                 <footer className="p-4 border-t border-[var(--border-color-alt)] flex justify-end gap-4 bg-black/30 flex-shrink-0">
                    <button onClick={onClose} className="btn-secondary">{t('close')}</button>
                </footer>
            </div>
             <style>{`
                .btn-secondary { padding: 0.6rem 1.2rem; font-size: 0.875rem; font-weight: bold; color: var(--text-primary); background-color: var(--border-color); border-radius: 0.375rem; transition: background-color 0.3s; cursor: pointer; }
                .btn-secondary:hover { background-color: var(--border-color-alt); }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up-fast { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up-fast { animation: slide-up-fast 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default CVPreviewModal;
