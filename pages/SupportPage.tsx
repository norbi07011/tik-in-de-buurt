import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { FetchStatus } from '../src/types';
import { LifebuoyIcon, PaperClipIcon, ChevronDownIcon, CheckCircleIcon } from '../components/icons/Icons';

const faqCategories = [
    {
        titleKey: 'faq_category_account_billing',
        items: [
            { q: 'faq_account_q1', a: 'faq_account_a1' },
            { q: 'faq_account_q2', a: 'faq_account_a2' },
            { q: 'faq_account_q3', a: 'faq_account_a3' },
            { q: 'faq_account_q4', a: 'faq_account_a4' },
            { q: 'faq_account_q5', a: 'faq_account_a5' },
        ]
    },
    {
        titleKey: 'faq_category_profile_ads',
        items: [
            { q: 'faq_profile_q1', a: 'faq_profile_a1' },
            { q: 'faq_profile_q2', a: 'faq_profile_a2' },
            { q: 'faq_profile_q3', a: 'faq_profile_a3' },
            { q: 'faq_profile_q4', a: 'faq_profile_a4' },
            { q: 'faq_profile_q5', a: 'faq_profile_a5' },
        ]
    },
    {
        titleKey: 'faq_category_features',
        items: [
            { q: 'faq_features_q1', a: 'faq_features_a1' },
            { q: 'faq_features_q2', a: 'faq_features_a2' },
            { q: 'faq_features_q3', a: 'faq_features_a3' },
            { q: 'faq_features_q4', a: 'faq_features_a4' },
            { q: 'faq_features_q5', a: 'faq_features_a5' },
        ]
    },
    {
        titleKey: 'faq_category_other',
        items: [
            { q: 'faq_other_q1', a: 'faq_other_a1' },
            { q: 'faq_other_q2', a: 'faq_other_a2' },
            { q: 'faq_other_q3', a: 'faq_other_a3' },
        ]
    }
];

const SupportPage: React.FC = () => {
    const { t } = useTranslation();
    const [formState, setFormState] = useState({
        category: 'support_category_billing',
        subject: '',
        message: '',
        attachment: null as File | null,
    });
    const [formErrors, setFormErrors] = useState({
        subject: '',
        message: '',
    });
    const [status, setStatus] = useState<FetchStatus>(FetchStatus.Idle);
    const [activeFaq, setActiveFaq] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateForm = (): boolean => {
        const errors = { subject: '', message: '' };
        let isValid = true;
        if (!formState.subject.trim()) {
            errors.subject = 'error_subject_required';
            isValid = false;
        }
        if (!formState.message.trim()) {
            errors.message = 'error_message_required';
            isValid = false;
        }
        setFormErrors(errors);
        return isValid;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormState(prev => ({ ...prev, attachment: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setStatus(FetchStatus.Loading);
        try {
            await api.submitSupportTicket({
                ...formState,
                attachment: formState.attachment || undefined
            });
            setStatus(FetchStatus.Success);
            setFormState({ category: 'support_category_billing', subject: '', message: '', attachment: null });
            setFormErrors({ subject: '', message: '' });
        } catch (error) {
            setStatus(FetchStatus.Error);
        }
    };

    const toggleFaq = (key: string) => {
        setActiveFaq(activeFaq === key ? null : key);
    };
    
    const supportCategories = [
        'support_category_billing',
        'support_category_profile',
        'support_category_ads',
        'support_category_livestream',
        'support_category_wall',
        'support_category_technical',
        'support_category_feedback',
        'support_category_other',
    ];

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <style>{`
                .input-field { width: 100%; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 0.75rem 1rem; color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s; }
                .input-field:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent); }
                .input-field.error { border-color: #ef4444; }
                .input-field.error:focus { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4); }
                .btn-primary { padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: bold; color: var(--primary-text); background-color: var(--primary); border-radius: 9999px; transition: opacity 0.3s; }
                .btn-primary:hover:not(:disabled) { opacity: 0.9; }
                .disabled\\:opacity-50:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-[var(--text-primary)]">{t('support_center_title')}</h1>
                <p className="text-[var(--text-secondary)] mt-2">{t('support_center_subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Contact Form */}
                <div className="lg:col-span-3 glass-card-style p-8">
                    {status === FetchStatus.Success ? (
                         <div className="text-center py-12 flex flex-col items-center">
                            <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('ticket_submitted_success')}</h3>
                            <p className="text-[var(--text-secondary)] mt-2">We'll get back to you as soon as possible.</p>
                            <button onClick={() => setStatus(FetchStatus.Idle)} className="mt-6 text-sm font-semibold text-[var(--primary)] hover:underline">Submit another ticket</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('contact_support')}</h2>
                            <div>
                                <label htmlFor="category" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('support_category')}</label>
                                <select id="category" name="category" value={formState.category} onChange={handleInputChange} className="input-field">
                                    {supportCategories.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('title')}</label>
                                <input type="text" id="subject" name="subject" value={formState.subject} onChange={handleInputChange} className={`input-field ${formErrors.subject ? 'error' : ''}`} />
                                {formErrors.subject && <p className="text-red-500 text-sm mt-1">{t(formErrors.subject)}</p>}
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('description')}</label>
                                <textarea id="message" name="message" value={formState.message} onChange={handleInputChange} rows={6} className={`input-field ${formErrors.message ? 'error' : ''}`}></textarea>
                                {formErrors.message && <p className="text-red-500 text-sm mt-1">{t(formErrors.message)}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('attachment')}</label>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-[var(--border-color)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--border-color-alt)]">
                                        <PaperClipIcon className="w-4 h-4" />
                                        {t('choose_file')}
                                    </button>
                                    <span className="text-sm text-[var(--text-muted)]">{formState.attachment?.name || t('no_file_chosen')}</span>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-label={t('choose_file')} />
                            </div>
                            <div>
                                <button type="submit" disabled={status === FetchStatus.Loading} className="w-full btn-primary py-3 disabled:opacity-50">
                                    {status === FetchStatus.Loading ? t('loading') : t('submit_ticket')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* FAQ */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('faq_title')}</h2>
                     {faqCategories.map((category, catIndex) => (
                        <div key={catIndex} className="mb-6">
                            <h3 className="text-xl font-semibold text-[var(--primary)] mb-3">{t(category.titleKey)}</h3>
                            <div className="space-y-2">
                                {category.items.map((faq, itemIndex) => {
                                    const faqKey = `${catIndex}-${itemIndex}`;
                                    const isOpen = activeFaq === faqKey;
                                    return (
                                        <div key={faqKey} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                            <button onClick={() => toggleFaq(faqKey)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-[var(--text-primary)] hover:bg-white/5">
                                                <span>{t(faq.q)}</span>
                                                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                                                <div className="p-4 pt-0 text-sm text-[var(--text-secondary)]">
                                                    <p>{t(faq.a)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
