import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../src/api';
import { PostType } from '../src/types';
import { useStore } from '../src/store';
import { ImageIcon, VideoCameraIcon, XMarkIcon } from './icons/Icons';

interface PostCreatorProps {
    businessId: number;
    onPostCreated: () => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ businessId, onPostCreated }) => {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<{ url: string; type: PostType.Photo | PostType.Video } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const type = file.type.startsWith('image/') ? PostType.Photo : PostType.Video;
                setMedia({ url: reader.result as string, type });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const removeMedia = () => {
        setMedia(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await api.createPost({
                businessId,
                type: media ? media.type : PostType.Text,
                content,
                mediaUrl: media ? media.url : undefined,
            });
            setContent('');
            removeMedia();
            onPostCreated();
        } catch (error) {
            console.error("Failed to create post:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const MediaButton: React.FC<{ type: PostType.Photo | PostType.Video, icon: React.ReactNode, label: string }> = ({ type, icon, label }) => (
        <button
            type="button"
            onClick={() => {
                if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('accept', type === PostType.Photo ? 'image/*' : 'video/*');
                    fileInputRef.current.click();
                }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${media?.type === type ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-5">
            <form onSubmit={handleSubmit}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('whats_on_your_mind')}
                    rows={4}
                    className="w-full bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none"
                    required
                />
                
                {media && (
                    <div className="relative mt-4 rounded-lg overflow-hidden border border-[var(--border-color-alt)] max-h-60">
                         {media.type === PostType.Photo ? <img src={media.url} alt="Preview" className="w-full h-full object-cover"/> : <video src={media.url} controls className="w-full h-full"/>}
                         <button
                            type="button"
                            onClick={removeMedia}
                            className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
                            aria-label={t('remove_media')}
                         >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-[var(--border-color-alt)]">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <MediaButton type={PostType.Photo} icon={<ImageIcon className="w-5 h-5"/>} label={t('add_photo')} />
                           <MediaButton type={PostType.Video} icon={<VideoCameraIcon className="w-5 h-5"/>} label={t('add_video')} />
                           <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                        </div>
                        <button type="submit" disabled={isSubmitting || !content.trim()} className="px-6 py-2 text-sm font-bold text-[var(--primary-text)] bg-[var(--primary)] rounded-full hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? t('loading') : t('post')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostCreator;
