import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { api } from '../src/api';
import './VideoUploader.css';

interface VideoUploaderProps {
    onUploadSuccess?: (videoData: { id: string; videoUrl: string }) => void;
    className?: string;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
    onUploadSuccess,
    className = ''
}) => {
    const { t } = useTranslation();
    const { showToast } = useStore();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith('video/')) {
            showToast(t('error_invalid_video_type') || 'Please select a valid video file', 'error');
            return;
        }

        // Check file size (limit to 200MB)
        const maxSize = 200 * 1024 * 1024; // 200MB in bytes
        if (file.size > maxSize) {
            showToast(t('error_file_too_large') || 'File size must be less than 200MB', 'error');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
            formData.append('tags', JSON.stringify(['uploaded']));

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 200);

            const result = await api.uploadVideo(formData);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            showToast(t('video_upload_success') || 'Video uploaded successfully!', 'success');
            
            if (onUploadSuccess) {
                onUploadSuccess(result);
            }

        } catch (error) {
            console.error('Video upload failed:', error);
            showToast(
                t('video_upload_failed') || 
                `Upload failed: ${(error as Error).message}`, 
                'error'
            );
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
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
            handleFileUpload(files[0]);
        }
    };

    return (
        <div className={`video-uploader ${className}`}>
            <label 
                className={`cursor-pointer group h-32 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDrop={handleDrop}
            >
                <div className="text-center">
                    {isUploading ? (
                        <div className="upload-progress">
                            <div className="spinner mb-2">📹</div>
                            <p className="font-semibold text-blue-600">
                                {t('uploading_video') || 'Uploading video...'}
                            </p>
                            <div className="progress-bar mt-2 w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="progress-fill h-full bg-blue-500 transition-all duration-300"
                                    style={{ '--upload-progress': `${uploadProgress}%` } as React.CSSProperties} /* eslint-disable-line */
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                        </div>
                    ) : (
                        <>
                            <div className="upload-icon mb-2 text-4xl">🎥</div>
                            <p className="font-semibold text-gray-700">
                                {t('click_to_upload_video') || 'Click to upload video'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('or_drag_and_drop_video') || 'or drag and drop video file'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {t('max_file_size_200mb') || 'Max file size: 200MB'}
                            </p>
                        </>
                    )}
                </div>
                <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="hidden"
                    disabled={isUploading}
                />
            </label>
        </div>
    );
};

export default VideoUploader;