
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon, GlobeAltIcon, SparklesIcon, VideoCameraIcon } from '../components/icons/Icons';
import { ServiceItem, SubscriptionPackage } from '../src/types';
import ServiceOrderModal from '../components/ServiceOrderModal';

interface ServiceCardProps {
    icon: React.ReactNode;
    titleKey: string;
    services: ServiceItem[];
    onOrder: (titleKey: string, services: ServiceItem[]) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, titleKey, services, onOrder }) => {
    const { t } = useTranslation();

    return (
        <div className="parent">
            <div className="card">
                <div className="logo">
                    <span className="circle circle1"></span>
                    <span className="circle circle2"></span>
                    <span className="circle circle3"></span>
                    <span className="circle circle4"></span>
                    <span className="circle circle5">{icon}</span>
                </div>
                <div className="glass"></div>
                <div className="content">
                    <h2 className="title !text-2xl">{t(titleKey)}</h2>
                    <ul className="space-y-4 mt-4">
                        {services.map(service => (
                            <li key={service.nameKey} className="flex justify-between items-start text-sm border-b border-[var(--border-color-alt)] pb-3 last:border-b-0">
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">{t(service.nameKey)}</p>
                                    {service.descriptionKey && <p className="text-[var(--text-muted)] text-xs">{t(service.descriptionKey)}</p>}
                                </div>
                                <p className="font-mono text-right text-[var(--text-primary)] font-bold whitespace-nowrap pl-4">{service.price}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bottom">
                    <div className="social-buttons-container"></div>
                    <button 
                        onClick={() => onOrder(titleKey, services)}
                        className="view-more-button !bg-purple-600 !text-white px-6 py-2 rounded-full hover:!bg-purple-500 transition-colors"
                    >
                        {t('order_this_service')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const SubscriptionCard: React.FC<{
    pkg: SubscriptionPackage;
    onOrder: (titleKey: string, services: ServiceItem[]) => void;
}> = ({ pkg, onOrder }) => {
    const { t } = useTranslation();
    const serviceItem: ServiceItem = { nameKey: pkg.titleKey, price: pkg.price };

    return (
         <div className="parent">
            <div className="card">
                 <div className="logo">
                    <span className="circle circle1"></span>
                    <span className="circle circle2"></span>
                    <span className="circle circle3"></span>
                </div>
                <div className="glass"></div>
                <div className="content text-center">
                    <h3 className="title">{t(pkg.titleKey)}</h3>
                    <p className="text !h-auto !text-purple-300 font-semibold text-sm">{t(pkg.intervalKey)}</p>
                    <p className="text-4xl font-extrabold text-white my-6">{pkg.price}</p>
                    <p className="text !h-auto text-sm text-[var(--text-secondary)] mb-8 flex-grow">{t(pkg.descriptionKey)}</p>
                </div>
                 <div className="bottom justify-center">
                    <button
                        onClick={() => onOrder(pkg.titleKey, [serviceItem])}
                        className="view-more-button !bg-purple-600 !text-white px-8 py-3 rounded-full hover:!bg-purple-500 transition-colors"
                    >
                        {t('order_this_service')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const NorbsServicePage: React.FC = () => {
    const { t } = useTranslation();
    const [modalData, setModalData] = useState<{ titleKey: string; services: ServiceItem[] } | null>(null);
    const isModalOpen = modalData !== null;

    const handleOrderClick = (titleKey: string, services: ServiceItem[]) => {
        setModalData({ titleKey, services });
    };

    const handleCloseModal = () => {
        setModalData(null);
    };

    const servicesData = {
        graphics: [
            { nameKey: 'logo_design', price: '€50' },
            { nameKey: 'business_cards', price: '€65' },
            { nameKey: 'posters', price: '€55' },
            { nameKey: 'banners', price: '€55' },
        ],
        photography: [
            { nameKey: 'photo_session_day', price: '€250', descriptionKey: 'photo_session_products' },
        ],
        websites: [
            { nameKey: 'simple_website', price: 'od €200' },
            { nameKey: 'corporate_website', price: '€1.100' },
            { nameKey: 'online_store', price: '€1.500-€3.000' },
            { nameKey: 'administration', price: '€50/rok' },
        ],
        video: [
            { nameKey: 'promo_films', price: '€500-€1.000' },
            { nameKey: 'short_clips', price: '€500-€1.500' },
        ],
    };

    const subscriptionPackages: SubscriptionPackage[] = [
        {
            id: 'social',
            titleKey: 'social_media_package',
            descriptionKey: 'social_media_package_desc',
            price: '€450',
            intervalKey: 'monthly_fee',
            isPopular: true,
        },
        {
            id: 'branding',
            titleKey: 'branding_package',
            descriptionKey: 'branding_package_desc',
            price: '€350',
            intervalKey: 'one_time_package',
        }
    ];

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">{t('norbs_service_title')}</h1>
                <p className="text-purple-300 mt-2 max-w-2xl mx-auto">{t('norbs_service_subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ServiceCard icon={<SparklesIcon className="w-8 h-8"/>} titleKey="graphic_design" services={servicesData.graphics} onOrder={handleOrderClick} />
                <ServiceCard icon={<CameraIcon className="w-8 h-8"/>} titleKey="photography" services={servicesData.photography} onOrder={handleOrderClick} />
                <ServiceCard icon={<GlobeAltIcon className="w-8 h-8"/>} titleKey="websites" services={servicesData.websites} onOrder={handleOrderClick} />
                <ServiceCard icon={<VideoCameraIcon className="w-8 h-8"/>} titleKey="video_marketing" services={servicesData.video} onOrder={handleOrderClick} />
            </div>

            <div className="mt-16">
                <div className="relative mb-12">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-purple-800/50" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-background px-4 text-2xl font-bold text-white">{t('packages_and_subscriptions')}</span>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {subscriptionPackages.map(pkg => (
                        <SubscriptionCard key={pkg.id} pkg={pkg} onOrder={handleOrderClick} />
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <ServiceOrderModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    serviceCategory={modalData.titleKey}
                    services={modalData.services}
                />
            )}
        </div>
    );
};

export default NorbsServicePage;
