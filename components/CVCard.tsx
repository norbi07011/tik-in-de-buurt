import React from 'react';
import { useTranslation } from 'react-i18next';
import { Freelancer, Business, CV } from '../src/types';
import { DocumentArrowDownIcon, UserIcon } from './icons/Icons';
import { generateCvHtml } from '../utils/cvGenerator';

interface CVCardProps {
    entity: (Freelancer | Business) & { cv: NonNullable<(Freelancer | Business)['cv']> };
}

const CVCard: React.FC<CVCardProps> = ({ entity }) => {
    const { t } = useTranslation();
    const { nameKey, cv } = entity;
    const specializationKey = 'specializationKey' in entity ? entity.specializationKey : undefined;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleDownload = () => {
        const translatedName = t(nameKey);
        // Ensure the entity passed to generateCvHtml has the correct CV type.
        // The CV object from the form uses plain strings, which is what the generator expects now.
        const entityWithCv: (Freelancer | Business) & { cv: CV } = { ...entity, cv: cv };

        const cvHtml = generateCvHtml(entityWithCv, t);
        const blob = new Blob([cvHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${translatedName.replace(/\s/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="cv-card">
            <div className="cv-card-inner">
                <div className="cv-card-front">
                    <div className="absolute top-4 left-4">
                        <h2 className="text-4xl font-bold">{getInitials(t(nameKey))}</h2>
                        {specializationKey && <p className="text-sm -mt-1">{t(specializationKey)}</p>}
                    </div>
                    <div className="absolute bottom-0 right-0 w-24 h-full">
                       <UserIcon className="w-full h-full text-white/80" />
                    </div>
                </div>
                <div className="cv-card-back">
                    <button onClick={handleDownload} className="cv-download-button">
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>{t('download_cv')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CVCard;
