import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cvSchema } from '../../utils/zodSchemas';
import type { CV, Freelancer } from '../../src/types';
import { api } from '../../src/api';
import LivePreview from './LivePreview';

// A simple debounce hook
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    return (...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

const STEPS = [
    { id: 'summary', titleKey: 'cv_step_summary' },
    { id: 'experience', titleKey: 'cv_step_experience' },
    { id: 'education', titleKey: 'cv_step_education' },
    { id: 'projects', titleKey: 'cv_step_projects' },
    { id: 'certifications', titleKey: 'cv_step_certifications' },
    { id: 'skills', titleKey: 'cv_step_skills' },
    { id: 'languages', titleKey: 'cv_step_languages' },
];

const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
    const { t } = useTranslation();
    const progress = ((currentStep + 1) / totalSteps) * 100;
    return (
        <div className="mb-8">
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-[var(--primary)]">{t(STEPS[currentStep].titleKey)}</span>
                <span className="text-sm font-medium text-[var(--primary)]">{currentStep + 1} / {totalSteps}</span>
            </div>
            <div className="w-full bg-[var(--border-color)] rounded-full h-2.5">
                {/* eslint-disable-next-line no-inline-styles */}
                <div className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-500 ease-in-out" style={{width: `${progress}%`}}></div>
            </div>
        </div>
    );
};

const AutosaveIndicator: React.FC<{ freelancerId: number, cvData: CV}> = ({ freelancerId, cvData }) => {
    const { t } = useTranslation();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [timeAgo, setTimeAgo] = useState('');

    const debouncedSave = useDebounce(async (data: CV) => {
        setSaveStatus('saving');
        localStorage.setItem(`cv_draft_${freelancerId}`, JSON.stringify(data));
        await api.saveCvDraft(freelancerId, data);
        setSaveStatus('saved');
        setLastSaved(new Date());
    }, 1000);
    
    useEffect(() => {
        debouncedSave(cvData);
    }, [cvData, debouncedSave]);
    
    useEffect(() => {
        if (lastSaved) {
            const interval = setInterval(() => {
                const seconds = Math.round((new Date().getTime() - lastSaved.getTime()) / 1000);
                setTimeAgo(t('cv_saved_ago', { seconds }));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lastSaved, t]);

    if (saveStatus === 'idle') return null;
    
    return (
        <div className="text-sm text-[var(--text-muted)] text-right">
            {saveStatus === 'saving' && `${t('saving')}...`}
            {saveStatus === 'saved' && timeAgo}
        </div>
    );
};


const StepContent: React.FC<{ step: number }> = ({ step }) => {
    const { register, formState: { errors } } = useFormContext<CV>();
    const { t } = useTranslation();

    switch(STEPS[step].id) {
        case 'summary':
            return (
                <div>
                    <label htmlFor="summary" className="input-label">{t('cv_summary')}</label>
                    <textarea
                        id="summary"
                        {...register('summary')}
                        rows={10}
                        className="input-field"
                        placeholder={t('cv_description_hint')}
                    />
                    {errors.summary && <p className="error-message">{errors.summary.message}</p>}
                </div>
            );
        // ... Other steps would be implemented here
        default:
            return <div className="text-center p-10 bg-[var(--background-alt)] rounded-lg">
                <h3 className="font-bold text-lg">{t(STEPS[step].titleKey)}</h3>
                <p>{t('cv_step_wip')}</p>
            </div>
    }
}


interface CvWizardProps {
    freelancer: Freelancer;
    onSave: (cvData: CV) => Promise<boolean>;
}

const CvWizard: React.FC<CvWizardProps> = ({ freelancer, onSave }) => {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const methods = useForm<CV>({
        resolver: zodResolver(cvSchema),
        defaultValues: freelancer.cv || {
            summary: '', experience: [], education: [], projects: [], skills: [], languages: [], certifications: []
        },
    });
    
    const watchedData = methods.watch();

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const handleFinalSave = async (data: CV) => {
        setIsSubmitting(true);
        const success = await onSave(data);
        if (success) {
             localStorage.removeItem(`cv_draft_${freelancer.id}`);
        }
        setIsSubmitting(false);
    };

    return (
        <FormProvider {...methods}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Column */}
                <div className="flex flex-col">
                    <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />
                    <AutosaveIndicator freelancerId={freelancer.id} cvData={watchedData} />

                    <div className="flex-grow mt-4 overflow-y-auto pr-2">
                       <StepContent step={currentStep} />
                    </div>
                    
                    {/* Sticky Footer */}
                    <div className="sticky bottom-0 bg-[var(--background)] py-4 mt-auto border-t border-[var(--border-color)]">
                         <div className="flex justify-between items-center">
                            <div>
                                <button type="button" onClick={handleBack} disabled={currentStep === 0} className="btn-secondary disabled:opacity-50">{t('back')}</button>
                            </div>
                            <div>
                                {currentStep < STEPS.length - 1 ? (
                                    <button type="button" onClick={handleNext} className="btn-primary">{t('next')}</button>
                                ) : (
                                    <button type="button" onClick={methods.handleSubmit(handleFinalSave)} disabled={isSubmitting} className="btn-primary disabled:opacity-50">
                                        {isSubmitting ? t('saving') : t('save_cv')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="hidden lg:block sticky top-20 h-[calc(100vh-6rem)]">
                    <LivePreview freelancer={freelancer} />
                </div>
            </div>
             <style>{`
                .input-label { font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-size: 0.875rem; }
                .input-field { width: 100%; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.6rem 0.8rem; color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s; }
                .input-field:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent); }
                .btn-primary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--primary-text); background-color: var(--primary); border-radius: 9999px; transition: opacity 0.3s; }
                .btn-secondary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--text-primary); background-color: var(--border-color); border-radius: 9999px; transition: background-color 0.3s; }
                .error-message { color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem; }
            `}</style>
        </FormProvider>
    );
};

export default CvWizard;
