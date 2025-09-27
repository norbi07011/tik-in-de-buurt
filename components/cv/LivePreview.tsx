import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import type { CV, Freelancer } from '../../src/types';
import { generateCvHtml } from '../../utils/cvGenerator';

interface LivePreviewProps {
    freelancer: Freelancer;
}

const LivePreview: React.FC<LivePreviewProps> = ({ freelancer }) => {
    const { t } = useTranslation();
    const { watch } = useFormContext<CV>();
    const cvData = watch();
    const [template, setTemplate] = useState<'classic' | 'modern' | 'ats'>('classic');

    const htmlDoc = generateCvHtml({ ...freelancer, cv: cvData }, t, template);

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold text-center mb-4 text-white">{t('live_preview')}</h2>
            <div className="bg-[var(--background-alt)] p-2 rounded-t-lg border border-b-0 border-[var(--border-color)]">
                <div className="flex justify-center gap-2">
                    {(['classic', 'modern', 'ats'] as const).map(style => (
                        <button
                            key={style}
                            onClick={() => setTemplate(style)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${template === style ? 'bg-[var(--primary)] text-[var(--primary-text)]' : 'bg-[var(--border-color-alt)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'}`}
                        >
                            {t(`cv_style_${style}`)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow bg-gray-200 rounded-b-lg overflow-hidden border border-[var(--border-color)]">
                <iframe
                    srcDoc={htmlDoc}
                    title="CV Live Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts" // Be cautious with scripts in generated content
                />
            </div>
        </div>
    );
};

export default LivePreview;
