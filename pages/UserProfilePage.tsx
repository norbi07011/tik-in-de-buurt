import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Page, FetchStatus } from '../src/types';
import type { IUser, PostWithBusiness } from '../src/types';
import { 
    ArrowLeftIcon, 
    UserIcon, 
    CameraIcon, 
    GlobeAltIcon,
    MapPinIcon,
    CalendarDaysIcon,
    ShareIcon,
    PauseIcon, // Changed from PlusIcon since PlusIcon doesn't exist
    PhotoIcon,
    VideoCameraIcon,
    SparklesIcon
} from '../components/icons/Icons';
import { api } from '../src/api';
import { useStore } from '../src/store';
import { useDataFetcher } from '../hooks/useDataFetcher';
import EditProfileModal from '../components/EditProfileModal';

interface UserProfilePageProps {
    userId: string;
}

interface UserProfileData {
    user: IUser;
    posts: PostWithBusiness[];
    photos: string[];
    videos: string[];
    isOwnProfile: boolean;
}

// Komponent do wyświetlania avatara z możliwością edycji
const ProfileAvatar: React.FC<{ 
    user: IUser; 
    isOwnProfile: boolean; 
    onAvatarUpdate: (newAvatar: string) => void;
}> = ({ user, isOwnProfile, onAvatarUpdate }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        if (isOwnProfile && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('userId', user._id.toString());

            const response = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            if (result.success) {
                onAvatarUpdate(result.file.path);
            }
        } catch (error) {
            console.error('Avatar upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative group">
            <div 
                className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl ${isOwnProfile ? 'cursor-pointer' : ''}`}
                onClick={handleAvatarClick}
            >
                {user.avatar ? (
                    <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <UserIcon className="w-16 h-16 text-white" />
                    </div>
                )}
            </div>

            {isOwnProfile && (
                <>
                    <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploading ? 'opacity-100' : ''}`}>
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        ) : (
                            <CameraIcon className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        title="Zmień zdjęcie profilowe"
                        aria-label="Wybierz nowy awatar"
                    />
                </>
            )}
        </div>
    );
};

// Komponent do wyświetlania cover image z możliwością edycji
const ProfileCover: React.FC<{ 
    user: IUser; 
    isOwnProfile: boolean; 
    onCoverUpdate: (newCover: string) => void;
}> = ({ user, isOwnProfile, onCoverUpdate }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCoverClick = () => {
        if (isOwnProfile && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('cover', file);
            formData.append('userId', user._id.toString());
            formData.append('entityType', 'user');

            const response = await fetch('/api/upload/cover', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            if (result.success) {
                onCoverUpdate(result.file.path);
            }
        } catch (error) {
            console.error('Cover upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative h-64 md:h-80 overflow-hidden">
            {user.coverImage ? (
                <img 
                    src={user.coverImage} 
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
            )}

            {isOwnProfile && (
                <>
                    <div 
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer ${isUploading ? 'opacity-100' : ''}`}
                        onClick={handleCoverClick}
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        ) : (
                            <div className="text-center text-white">
                                <CameraIcon className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm font-medium">Zmień zdjęcie okładki</p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                        title="Zmień zdjęcie okładki"
                        aria-label="Wybierz nowe zdjęcie okładki"
                    />
                </>
            )}
        </div>
    );
};

// Komponent do wyświetlania informacji profilu
const ProfileInfo: React.FC<{ 
    user: IUser; 
    isOwnProfile: boolean; 
    onEdit: () => void;
}> = ({ user, isOwnProfile, onEdit }) => {
    const { t } = useTranslation();

    return (
        <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{user.name}</h1>
                    {user.bio && (
                        <p className="text-[var(--text-secondary)] mt-2">{user.bio}</p>
                    )}
                </div>
                {isOwnProfile && (
                    <button
                        onClick={onEdit}
                        className="bg-[var(--primary)] text-[var(--primary-text)] px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                        Edytuj profil
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                {user.location && (
                    <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{user.location}</span>
                    </div>
                )}
                {user.website && (
                    <div className="flex items-center gap-1">
                        <GlobeAltIcon className="w-4 h-4" />
                        <a 
                            href={user.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[var(--primary)] hover:underline"
                        >
                            {user.website}
                        </a>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>Dołączył w {new Date(user.createdAt).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {user.interests && user.interests.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Zainteresowania</h3>
                    <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest, index) => (
                            <span 
                                key={index}
                                className="bg-[var(--background-alt)] text-[var(--text-primary)] px-3 py-1 rounded-full text-sm border border-[var(--border-color)]"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {user.socialLinks && Object.keys(user.socialLinks).some(key => user.socialLinks![key as keyof typeof user.socialLinks]) && (
                <div className="mt-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Media społecznościowe</h3>
                    <div className="flex gap-2">
                        {user.socialLinks.facebook && (
                            <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                                Facebook
                            </a>
                        )}
                        {user.socialLinks.instagram && (
                            <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                                Instagram
                            </a>
                        )}
                        {user.socialLinks.twitter && (
                            <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                                Twitter
                            </a>
                        )}
                        {user.socialLinks.linkedin && (
                            <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                                LinkedIn
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Główny komponent strony profilu użytkownika
const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId }) => {
    const { t } = useTranslation();
    const { navigate, user: currentUser } = useStore();
    const [activeTab, setActiveTab] = useState<'posts' | 'photos' | 'videos'>('posts');
    const [userProfile, setUserProfile] = useState<IUser | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetcher = useCallback(async (): Promise<UserProfileData> => {
        const userResponse = await api.fetchUserProfile(userId);
        const postsResponse = await api.fetchUserPosts(userId);
        const photosResponse = await api.fetchUserPhotos(userId);
        const videosResponse = await api.fetchUserVideos(userId);

        return {
            user: userResponse,
            posts: postsResponse,
            photos: photosResponse,
            videos: videosResponse,
            isOwnProfile: currentUser?.id.toString() === userId
        };
    }, [userId, currentUser]);

    const { data, status, error, refetch } = useDataFetcher(fetcher);

    const handleAvatarUpdate = (newAvatar: string) => {
        if (data) {
            setUserProfile({ ...data.user, avatar: newAvatar });
        }
    };

    const handleCoverUpdate = (newCover: string) => {
        if (data) {
            setUserProfile({ ...data.user, coverImage: newCover });
        }
    };

    const handleUserUpdate = (updatedUser: IUser) => {
        setUserProfile(updatedUser);
        setIsEditModalOpen(false);
    };

    const handleEditProfile = () => {
        setIsEditModalOpen(true);
    };

    if (status === FetchStatus.Loading || status === FetchStatus.Idle) {
        return (
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-64 bg-gray-800 rounded-lg mb-[-60px]"></div>
                        <div className="bg-[var(--background-alt)] rounded-lg p-6 border border-[var(--border-color)]">
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-32 bg-gray-700 rounded-full"></div>
                                <div className="flex-grow">
                                    <div className="h-8 bg-gray-700 rounded mb-2 w-48"></div>
                                    <div className="h-4 bg-gray-700 rounded mb-2 w-32"></div>
                                    <div className="h-4 bg-gray-700 rounded w-64"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === FetchStatus.Error || !data) {
        return (
            <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Profil nie został znaleziony</h1>
                    <p className="text-[var(--text-secondary)] mb-6">Użytkownik którego szukasz nie istnieje lub został usunięty.</p>
                    <button
                        onClick={() => navigate(Page.Home)}
                        className="bg-[var(--primary)] text-[var(--primary-text)] px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                        Wróć do strony głównej
                    </button>
                </div>
            </div>
        );
    }

    const { user: profileUser, posts, photos, videos, isOwnProfile } = data;
    const displayUser = userProfile || profileUser;

    const tabs = [
        { id: 'posts' as const, label: 'Posty', count: posts.length },
        { id: 'photos' as const, label: 'Zdjęcia', count: photos.length },
        { id: 'videos' as const, label: 'Filmy', count: videos.length },
    ];

    return (
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Przycisk powrotu */}
                <button 
                    onClick={() => navigate(Page.Home)} 
                    className="mb-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-2"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Wróć</span>
                </button>

                {/* Cover Image */}
                <div className="rounded-lg overflow-hidden mb-[-60px] relative">
                    <ProfileCover 
                        user={displayUser}
                        isOwnProfile={isOwnProfile}
                        onCoverUpdate={handleCoverUpdate}
                    />
                </div>

                {/* Profile Card */}
                <div className="bg-[var(--background-alt)] rounded-lg border border-[var(--border-color)] relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6">
                        {/* Avatar */}
                        <div className="-mt-16 md:-mt-20">
                            <ProfileAvatar 
                                user={displayUser}
                                isOwnProfile={isOwnProfile}
                                onAvatarUpdate={handleAvatarUpdate}
                            />
                        </div>

                        {/* Profile Info */}
                        <div className="flex-grow text-center md:text-left">
                            <ProfileInfo 
                                user={displayUser}
                                isOwnProfile={isOwnProfile}
                                onEdit={handleEditProfile}
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mt-6 border-b border-[var(--border-color)]">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-[var(--primary)] text-[var(--primary)]'
                                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-alt)]'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'posts' && (
                        <div className="space-y-6">
                            {isOwnProfile && (
                                <div className="bg-[var(--background-alt)] rounded-lg border border-[var(--border-color)] p-6">
                                    <div className="flex items-center gap-4">
                                        <img 
                                            src={displayUser.avatar || '/default-avatar.png'} 
                                            alt={displayUser.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <button className="flex-grow text-left bg-[var(--background)] border border-[var(--border-color)] rounded-full px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--border-color)] transition-colors">
                                            Co słychać, {displayUser.name}?
                                        </button>
                                        <div className="flex gap-2">
                                            <button 
                                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                                                title="Dodaj zdjęcie"
                                                aria-label="Dodaj zdjęcie do posta"
                                            >
                                                <PhotoIcon className="w-6 h-6" />
                                            </button>
                                            <button 
                                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                                                title="Dodaj wideo"
                                                aria-label="Dodaj wideo do posta"
                                            >
                                                <VideoCameraIcon className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {posts.length === 0 ? (
                                <div className="text-center py-12">
                                    <SparklesIcon className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                                        {isOwnProfile ? 'Nie masz jeszcze żadnych postów' : 'Ten użytkownik nie ma jeszcze postów'}
                                    </h3>
                                    <p className="text-[var(--text-secondary)]">
                                        {isOwnProfile ? 'Opublikuj swój pierwszy post i podziel się z innymi!' : 'Wróć później, może coś się pojawi.'}
                                    </p>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id} className="bg-[var(--background-alt)] rounded-lg border border-[var(--border-color)] p-6">
                                        {/* Post content would go here */}
                                        <p>Post #{post.id}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'photos' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <PhotoIcon className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Brak zdjęć</h3>
                                    <p className="text-[var(--text-secondary)]">
                                        {isOwnProfile ? 'Dodaj swoje pierwsze zdjęcie!' : 'Ten użytkownik nie ma jeszcze zdjęć.'}
                                    </p>
                                </div>
                            ) : (
                                photos.map((photo, index) => (
                                    <div key={index} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                                        <img src={photo} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'videos' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <VideoCameraIcon className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Brak filmów</h3>
                                    <p className="text-[var(--text-secondary)]">
                                        {isOwnProfile ? 'Prześlij swój pierwszy film!' : 'Ten użytkownik nie ma jeszcze filmów.'}
                                    </p>
                                </div>
                            ) : (
                                videos.map((video, index) => (
                                    <div key={index} className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                                        <video src={video} className="w-full h-full object-cover" controls />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                user={displayUser}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUserUpdate={handleUserUpdate}
            />
        </div>
    );
};

export default UserProfilePage;