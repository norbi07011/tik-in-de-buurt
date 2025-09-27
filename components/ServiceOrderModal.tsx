import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceItem } from '../src/types';
import { useStore } from '../src/store';
import { api } from '../src/api';
import { XMarkIcon, PencilIcon, PaperClipIcon, VerifiedIcon, CheckCircleIcon, PaperAirplaneIcon } from './icons/Icons';

interface ServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceCategory: string;
    services: ServiceItem[];
}

const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({ isOpen, onClose, serviceCategory, services }) => {
    const { t } = useTranslation();
    const { user } = useStore();

    const [step, setStep] = useState(1);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [selectedService, setSelectedService] = useState<ServiceItem>(services[0]);
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [files, setFiles] = useState<File[]>([]);
    
    useEffect(() => {
      // Reset form when modal is reopened for a new category
      setStep(1);
      setStatus('idle');
      setSelectedService(services[0]);
      setDescription('');
      setEmail(user?.email || '');
      setFiles([]);
    }, [isOpen, serviceCategory, services, user]);

    const stepsConfig = [
        { titleKey: 'step_1_details', icon: <PencilIcon className="w-6 h-6" /> },
        { titleKey: 'step_2_files', icon: <PaperClipIcon className="w-6 h-6" /> },
        { titleKey: 'step_3_confirm', icon: <VerifiedIcon className="w-6 h-6" /> }
    ];

    const handleSubmit = async () => {
        setStatus('loading');
        try {
            await api.submitServiceOrder({
                serviceName: t(selectedService.nameKey),
                email,
                description,
                fileCount: files.length
            });
            setStatus('success');
        } catch (error) {
            setStatus('error');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: // Details
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="input-label">{t('service')}</label>
                            <select value={selectedService.nameKey} onChange={(e) => setSelectedService(services.find(s => s.nameKey === e.target.value) || services[0])} className="input-field">
                                {services.map(s => <option key={s.nameKey} value={s.nameKey}>{t(s.nameKey)} ({s.price})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">{t('project_description')}</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder={t('describe_your_needs')} className="input-field" required />
                        </div>
                        <div>
                            <label className="input-label">{t('contact_email')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('your_email_placeholder')} className="input-field" required />
                        </div>
                    </div>
                );
            case 2: // Files
                return (
                     <div>
                        <h3 className="text-lg font-semibold mb-2">{t('upload_brief_files')}</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">{t('attach_files_optional')}</p>
                        <input type="file" multiple onChange={handleFileChange} className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-text)] hover:file:bg-opacity-90"/>
                        {files.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-sm">{t('attached_files')}:</h4>
                                <ul className="list-disc list-inside text-sm text-[var(--text-secondary)]">
                                    {files.map(f => <li key={f.name}>{f.name} ({Math.round(f.size/1024)} KB)</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            case 3: // Summary
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('order_summary')}</h3>
                        <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border-color)] space-y-3">
                            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{t('service')}</span><span className="font-semibold">{t(selectedService.nameKey)}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{t('contact_email')}</span><span className="font-semibold">{email}</span></div>
                            <div><p className="text-[var(--text-muted)] mb-1">{t('project_description')}</p><p className="text-sm p-2 bg-[var(--background-alt)] rounded">{description || 'No description provided.'}</p></div>
                            <div><p className="text-[var(--text-muted)] mb-1">{t('attached_files')}</p><p className="text-sm">{files.length > 0 ? files.map(f => f.name).join(', ') : 'No files attached.'}</p></div>
                        </div>
                    </div>
                );
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0c1d2e] border border-purple-800/50 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-slide-up-fast" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center border-b border-[var(--border-color-alt)]">
                    <h2 className="text-xl font-bold text-white">{t('order_service')}: <span className="text-purple-300">{t(serviceCategory)}</span></h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </header>
                
                {status === 'success' ? (
                     <div className="p-8 text-center flex flex-col items-center justify-center flex-1">
                        <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
                        <h3 className="text-2xl font-bold text-white">{t('inquiry_sent_successfully')}</h3>
                        <p className="text-[var(--text-secondary)] mt-2">{t('we_will_contact_you')}</p>
                        <button onClick={onClose} className="btn-primary mt-6">{t('great')}</button>
                    </div>
                ) : (
                <>
                    <div className="p-8">
                         <div className="flex items-start w-full mb-8">
                            {stepsConfig.map((s, index) => {
                                const stepNum = index + 1;
                                const isActive = step >= stepNum;
                                return (
                                <React.Fragment key={stepNum}>
                                    <div className="flex flex-col items-center text-center w-28">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${isActive ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>{s.icon}</div>
                                        <p className={`mt-2 text-xs font-semibold transition-colors duration-300 w-full ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`}>{t(s.titleKey)}</p>
                                    </div>
                                    {index < stepsConfig.length - 1 && <div className={`h-1 flex-grow transition-colors duration-300 mt-5 ${step > stepNum ? 'bg-purple-500' : 'bg-[var(--border-color)]'}`}></div>}
                                </React.Fragment>
                                )
                            })}
                        </div>
                    </div>
                    <div className="px-8 pb-8 flex-1 overflow-y-auto">{renderStepContent()}</div>

                    <footer className="p-4 border-t border-[var(--border-color-alt)] flex justify-between items-center bg-black/30">
                        {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary">{t('back')}</button>}
                        <div className="flex-1"></div> {/* Spacer */}
                        {step < 3 ? (
                            <button onClick={() => setStep(s => s + 1)} className="btn-primary">{t('next')}</button>
                        ) : (
                            <button onClick={handleSubmit} disabled={status === 'loading'} className="btn-primary flex items-center gap-2">
                                {status === 'loading' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        {t('submitting_inquiry')}
                                    </>
                                ) : (
                                    <>{t('confirm_and_submit')}</>
                                )}
                            </button>
                        )}
                    </footer>
                 </>
                )}
            </div>
            <style>{`
                .input-label { font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-size: 0.875rem; }
                .input-field { width: 100%; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 0.375rem; padding: 0.6rem 0.8rem; color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s; }
                .input-field:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent); }
                .btn-primary { padding: 0.6rem 1.2rem; font-size: 0.875rem; font-weight: bold; color: var(--primary-text); background-color: #7c3aed; border-radius: 0.375rem; transition: background-color 0.3s; cursor: pointer; }
                .btn-primary:hover:not(:disabled) { background-color: #6d28d9; }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
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

export default ServiceOrderModal;
