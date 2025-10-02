import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../src/types/user';
import { 
    XMarkIcon, 
    CameraIcon, 
    UserIcon,
    MapPinIcon,
    GlobeAltIcon,
    CalendarDaysIcon,
    HashtagIcon,
    LanguageIcon,
    EyeIcon,
    EyeSlashIcon
} from './icons/Icons';
import { api } from '../src/api';

interface EditProfileModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onUserUpdate: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
    user, 
    isOpen, 
    onClose, 
    onUserUpdate 
}) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({
        name: user.name,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        birthday: user.birthday,
        gender: user.gender,
        interests: user.interests || [],
        languages: user.languages || [],
        socialLinks: {
            facebook: user.socialLinks?.facebook || '',
            instagram: user.socialLinks?.instagram || '',
            twitter: user.socialLinks?.twitter || '',
            linkedin: user.socialLinks?.linkedin || '',
            tiktok: user.socialLinks?.tiktok || '',
            youtube: user.socialLinks?.youtube || ''
        },
        preferences: {
            privacy: {
                showEmail: user.preferences?.privacy?.showEmail ?? true,
                showPhone: user.preferences?.privacy?.showPhone ?? false,
                showLocation: user.preferences?.privacy?.showLocation ?? true,
                showBirthday: user.preferences?.privacy?.showBirthday ?? false
            }
        }
    });
    const [newInterest, setNewInterest] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleInputChange = (field: string, value: any, nested?: string) => {
        if (nested) {
            setFormData(prev => ({
                ...prev,
                [nested]: {
                    ...(prev[nested as keyof typeof prev] as object),
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSocialLinkChange = (platform: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
    };

    const handlePrivacyChange = (setting: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                privacy: {
                    ...prev.preferences?.privacy,
                    [setting]: value
                }
            }
        }));
    };

    const handleAddInterest = () => {
        if (newInterest.trim() && !formData.interests?.includes(newInterest.trim())) {
            setFormData(prev => ({
                ...prev,
                interests: [...(prev.interests || []), newInterest.trim()]
            }));
            setNewInterest('');
        }
    };

    const handleRemoveInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests?.filter(i => i !== interest) || []
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Upload images first if they were changed
            let avatarUrl = user.avatar;
            let coverUrl = user.coverImage;

            if (avatarFile) {
                const avatarFormData = new FormData();
                avatarFormData.append('avatar', avatarFile);
                avatarFormData.append('userId', user._id);
                
                const avatarResponse = await fetch('/api/upload/avatar', {
                    method: 'POST',
                    body: avatarFormData,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                const avatarResult = await avatarResponse.json();
                if (avatarResult.success) {
                    avatarUrl = avatarResult.file.path;
                }
            }

            if (coverFile) {
                const coverFormData = new FormData();
                coverFormData.append('cover', coverFile);
                coverFormData.append('userId', user._id);
                coverFormData.append('entityType', 'user');
                
                const coverResponse = await fetch('/api/upload/cover', {
                    method: 'POST',
                    body: coverFormData,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                const coverResult = await coverResponse.json();
                if (coverResult.success) {
                    coverUrl = coverResult.file.path;
                }
            }

            // Update profile data
            const updateData = {
                ...formData,
                avatar: avatarUrl,
                coverImage: coverUrl
            };

            const updatedUser = await api.updateUserProfile(updateData);
            onUserUpdate({ ...user, ...updatedUser.user });
            onClose();
        } catch (error) {
            console.error('Profile update failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--background-alt)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[var(--background-alt)] border-b border-[var(--border-color)] p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Edytuj profil</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Zamknij"
                        aria-label="Zamknij modal edycji profilu"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Cover Image Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Zdjęcie okładki</h3>
                        <div className="relative h-32 md:h-48 rounded-lg overflow-hidden border border-[var(--border-color)]">
                            <img 
                                src={coverPreview || user.coverImage || '/default-cover.jpg'} 
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                 onClick={() => coverInputRef.current?.click()}>
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                            title="Wybierz zdjęcie okładki"
                            aria-label="Wybierz zdjęcie okładki"
                        />
                    </div>

                    {/* Avatar Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Zdjęcie profilowe</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full overflow-hidden border border-[var(--border-color)]">
                                    {avatarPreview || user.avatar ? (
                                        <img 
                                            src={avatarPreview || user.avatar} 
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <UserIcon className="w-10 h-10 text-white" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 bg-[var(--primary)] text-[var(--primary-text)] rounded-full p-1.5 hover:opacity-90 transition-opacity"
                                    title="Zmień zdjęcie profilowe"
                                    aria-label="Zmień zdjęcie profilowe"
                                >
                                    <CameraIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">Kliknij aby zmienić zdjęcie profilowe</p>
                                <p className="text-xs text-[var(--text-muted)]">Zalecany rozmiar: 200x200px</p>
                            </div>
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                            title="Wybierz zdjęcie profilowe"
                            aria-label="Wybierz zdjęcie profilowe"
                        />
                    </div>

                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Podstawowe informacje</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nazwa użytkownika</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    title="Wprowadź nazwę użytkownika"
                                    aria-label="Nazwa użytkownika"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Imię</label>
                                <input
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    title="Wprowadź imię"
                                    aria-label="Imię"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nazwisko</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    title="Wprowadź nazwisko"
                                    aria-label="Nazwisko"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Płeć</label>
                                <select
                                    value={formData.gender || ''}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                    title="Wybierz płeć"
                                    aria-label="Płeć"
                                >
                                    <option value="">Nie wybrano</option>
                                    <option value="male">Mężczyzna</option>
                                    <option value="female">Kobieta</option>
                                    <option value="other">Inna</option>
                                    <option value="prefer_not_to_say">Wolę nie mówić</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Opis</label>
                        <textarea
                            value={formData.bio || ''}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            maxLength={500}
                            className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                            placeholder="Opowiedz o sobie..."
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">{(formData.bio || '').length}/500 znaków</p>
                    </div>

                    {/* Location & Website */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                <MapPinIcon className="w-4 h-4 inline mr-1" />
                                Lokalizacja
                            </label>
                            <input
                                type="text"
                                value={formData.location || ''}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="np. Warszawa, Polska"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                <GlobeAltIcon className="w-4 h-4 inline mr-1" />
                                Strona internetowa
                            </label>
                            <input
                                type="url"
                                value={formData.website || ''}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>

                    {/* Birthday */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                            Data urodzenia
                        </label>
                        <input
                            type="date"
                            value={formData.birthday ? new Date(formData.birthday).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleInputChange('birthday', e.target.value ? new Date(e.target.value) : undefined)}
                            className="bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            title="Wybierz datę urodzenia"
                            aria-label="Data urodzenia"
                        />
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            <HashtagIcon className="w-4 h-4 inline mr-1" />
                            Zainteresowania
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.interests?.map((interest, index) => (
                                <span 
                                    key={index}
                                    className="bg-[var(--primary)] text-[var(--primary-text)] px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                    {interest}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveInterest(interest)}
                                        className="hover:opacity-70"
                                        title={`Usuń ${interest}`}
                                        aria-label={`Usuń zainteresowanie ${interest}`}
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                                className="flex-grow bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="Dodaj zainteresowanie..."
                            />
                            <button
                                type="button"
                                onClick={handleAddInterest}
                                className="bg-[var(--primary)] text-[var(--primary-text)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Dodaj
                            </button>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Media społecznościowe</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(formData.socialLinks || {}).map(([platform, url]) => (
                                <div key={platform}>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 capitalize">
                                        {platform}
                                    </label>
                                    <input
                                        type="url"
                                        value={url || ''}
                                        onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                        placeholder={`https://${platform}.com/username`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Ustawienia prywatności</h3>
                        <div className="space-y-3">
                            {Object.entries({
                                showEmail: 'Pokaż adres email',
                                showPhone: 'Pokaż numer telefonu',
                                showLocation: 'Pokaż lokalizację',
                                showBirthday: 'Pokaż datę urodzenia'
                            }).map(([key, label]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-[var(--text-primary)]">{label}</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePrivacyChange(key, !formData.preferences?.privacy?.[key as keyof typeof formData.preferences.privacy])}
                                        className={`p-1 rounded-full transition-colors ${
                                            formData.preferences?.privacy?.[key as keyof typeof formData.preferences.privacy]
                                                ? 'text-[var(--primary)]'
                                                : 'text-[var(--text-muted)]'
                                        }`}
                                    >
                                        {formData.preferences?.privacy?.[key as keyof typeof formData.preferences.privacy] ? (
                                            <EyeIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeSlashIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border-color)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[var(--primary)] text-[var(--primary-text)] px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;