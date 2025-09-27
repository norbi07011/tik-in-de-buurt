
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MediaUploaderProps {
    onUpload: (urls: string[]) => void;
    currentMedia: string[];
    multiple?: boolean;
    accept: string;
    children: React.ReactNode;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onUpload, currentMedia, multiple = false, accept, children }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    
    const handleFileChange = (files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            const urls: string[] = [];
            let filesProcessed = 0;

            fileArray.forEach(file => {
                const reader = new FileReader();
                reader.onload = () => {
                    urls.push(reader.result as string);
                    filesProcessed++;
                    if (filesProcessed === fileArray.length) {
                        onUpload(urls);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileChange(files);
        }
    };

    return (
        <div>
            <label 
                className={`cursor-pointer group h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-[var(--text-secondary)] transition-colors ${isDragging ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border-color)] hover:border-[var(--primary)] hover:text-[var(--text-primary)]'}`}
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDrop={handleDrop}
            >
                <div className="text-center">
                    <p className="font-semibold">{children}</p>
                    <p className="text-sm mt-1">{t('or_drag_and_drop')}</p>
                </div>
                <input
                    type="file"
                    multiple={multiple}
                    accept={accept}
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="hidden"
                />
            </label>
            {currentMedia.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {currentMedia.map((url, index) => (
                        <div key={index} className="relative aspect-square">
                            <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MediaUploader;
    
