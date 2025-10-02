import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { Page, ServiceItem } from '../src/types';
import ServiceOrderModal from '../components/ServiceOrderModal';
import { SparklesIcon } from '../components/icons/Icons';

const RegistrationSuccessPage: React.FC = () => {
    const { t } = useTranslation();
    const { navigate } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const starterPackService: ServiceItem = {
        nameKey: 'starter_pack_title',
        price: '€99',
        descriptionKey: 'starter_pack_desc'
    };

    const handleOrderPack = () => {
        setIsModalOpen(true);
    };

    const handleSkip = () => {
        navigate(Page.Dashboard);
    };

    return (
        <div className="flex-grow flex items-center justify-center p-4">
            <div className="parent w-full max-w-lg">
                <div className="card">
                    <div className="logo">
                        <span className="circle circle1"></span>
                        <span className="circle circle2"></span>
                        <span className="circle circle3"></span>
                    </div>
                    <div className="glass"></div>
                    <div className="content text-center translate-z-50">
                         <div className="w-20 h-20 bg-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-[var(--primary-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white mb-2">{t('registration_successful')}</h1>
                        <p className="text-md text-gray-400">{t('welcome_to_platform')}</p>
                    </div>

                    <div className="bottom p-0 translate-z-50">
                        <div className="bg-black/40 border border-gray-800/70 rounded-lg p-6 w-full mt-4">
                            <SparklesIcon className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                            <h2 className="text-lg font-bold text-yellow-400 mb-1">{t('starter_pack_offer')}</h2>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('starter_pack_title')}</h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">{t('starter_pack_desc')}</p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button
                                    onClick={handleOrderPack}
                                    className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transform hover:scale-105 transition-all duration-300"
                                >
                                    {t('get_starter_pack')}
                                </button>
                                <button
                                    onClick={handleSkip}
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    {t('skip_to_dashboard')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ServiceOrderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    serviceCategory={starterPackService.nameKey}
                    services={[starterPackService]}
                />
            )}
        </div>
    );
};

export default RegistrationSuccessPage;
