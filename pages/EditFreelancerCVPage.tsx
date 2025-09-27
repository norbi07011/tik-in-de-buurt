import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { FetchStatus, Freelancer, CV, Page } from '../src/types';
import BusinessProfileSkeleton from '../components/skeletons/BusinessProfileSkeleton';
import CvWizard from '../components/cv/CvWizard';

const EditFreelancerCVPage: React.FC<{ freelancerId: number }> = ({ freelancerId }) => {
    const { t } = useTranslation();
    const { navigate } = useStore();
    const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
    const [status, setStatus] = useState<FetchStatus>(FetchStatus.Idle);
    
    const fetchData = useCallback(async () => {
        setStatus(FetchStatus.Loading);
        try {
            const data = await api.fetchFreelancerById(freelancerId);
            setFreelancer(data);
            setStatus(FetchStatus.Success);
        } catch (error) {
            setStatus(FetchStatus.Error);
        }
    }, [freelancerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (updatedCvData: CV) => {
        if (!freelancer) return false;
        try {
            const updatedFreelancer = { ...freelancer, cv: updatedCvData };
            await api.updateFreelancer(updatedFreelancer);
            // On final save, navigate away
            navigate(Page.FreelancerProfile, freelancer.id);
            return true;
        } catch (error) {
            console.error("Failed to save CV", error);
            return false;
        }
    };
    
    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return <BusinessProfileSkeleton />;
    }
    
    if (status === FetchStatus.Error || !freelancer) {
        return <div className="flex-grow flex items-center justify-center text-red-500">{t('error_loading_data')}</div>;
    }

    return (
        <CvWizard freelancer={freelancer} onSave={handleSave} />
    );
};

export default EditFreelancerCVPage;
