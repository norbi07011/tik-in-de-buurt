import { create } from 'zustand';
import { Page } from './types';
import { User } from './types/user';

interface AppState {
    // Navigation
    currentPage: Page;
    activeBusinessId: number | null;
    activePropertyId: number | null;
    activeFreelancerId: number | null;
    activeUserId: string | null;
    navigate: (page: Page, id?: number | null, userId?: string | null) => void;

    // Auth
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => Promise<void>;
    
    // User Content
    savedAdIds: number[];
    toggleSaveAd: (adId: number) => void;
    savedBusinessIds: number[];
    toggleSaveBusiness: (businessId: number) => void;
    savedPropertyIds: number[];
    toggleSaveProperty: (propertyId: number) => void;

    // Subscription Flow
    pendingPlanId: string | null;
    setPendingPlanId: (planId: string | null) => void;

    // Theme
    theme: 'light' | 'dark';
    toggleTheme: () => void;

    // Global UI State
    fetchCount: number;
    isFetching: boolean;
    startFetching: () => void;
    stopFetching: () => void;
    
    toast: { message: string; type: 'success' | 'error' } | null;
    showToast: (message: string, type: 'success' | 'error') => void;
    hideToast: () => void;
}

// Helper to get initial state from localStorage
const getInitialState = () => {
    try {
        const token = localStorage.getItem('authToken');
        const userJson = localStorage.getItem('authUser');
        const savedAdsJson = localStorage.getItem('savedAdIds');
        const savedBusinessesJson = localStorage.getItem('savedBusinessIds');
        const savedPropertiesJson = localStorage.getItem('savedPropertyIds');
        const themeValue = localStorage.getItem('theme');
        const theme: 'light' | 'dark' = (themeValue === 'light' || themeValue === 'dark') ? themeValue : 'dark';
        
        const authState = (token && userJson) ? { token, user: JSON.parse(userJson) } : { token: null, user: null };
        const savedAdsState = savedAdsJson ? { savedAdIds: JSON.parse(savedAdsJson) } : { savedAdIds: [] };
        const savedBusinessesState = savedBusinessesJson ? { savedBusinessIds: JSON.parse(savedBusinessesJson) } : { savedBusinessIds: [] };
        const savedPropertiesState = savedPropertiesJson ? { savedPropertyIds: JSON.parse(savedPropertiesJson) } : { savedPropertyIds: [] };

        return { ...authState, ...savedAdsState, ...savedBusinessesState, ...savedPropertiesState, theme };

    } catch (error) {
        console.error("Failed to parse state from localStorage", error);
    }
    return { token: null, user: null, savedAdIds: [], savedBusinessIds: [], savedPropertyIds: [], theme: 'dark' as const };
};


export const useStore = create<AppState>((set, get) => ({
    // Initial state
    currentPage: Page.Home,
    activeBusinessId: null,
    activePropertyId: null,
    activeFreelancerId: null,
    activeUserId: null,
    ...getInitialState(),
    pendingPlanId: null,
    fetchCount: 0,
    isFetching: false,
    toast: null,

    // Actions
    navigate: (page, id = null, userId = null) => {
        window.scrollTo(0, 0);
        
        // Update URL hash to match the page
        const pageToHashMap: Record<Page, string> = {
            [Page.Home]: 'home',
            [Page.Discover]: 'discover',
            [Page.Deals]: 'deals',
            [Page.Businesses]: 'businesses',
            [Page.RealEstate]: 'real_estate',
            [Page.Jobs]: 'jobs',
            [Page.Wall]: 'wall',
            [Page.FreelancerProfile]: 'freelancer_profile',
            [Page.PropertyListing]: 'property_listing',
            [Page.AddAd]: 'add_ad',
            [Page.BusinessProfile]: 'business_profile',
            [Page.UserProfile]: 'user_profile',
            [Page.Auth]: 'auth',
            [Page.ResetPassword]: 'reset_password',
            [Page.LiveStream]: 'live_stream',
            [Page.Settings]: 'settings',
            [Page.Saved]: 'saved',
            [Page.Account]: 'account',
            [Page.SubscriptionSuccess]: 'subscription_success',
            [Page.Dashboard]: 'dashboard',
            [Page.Reviews]: 'reviews',
            [Page.Support]: 'support',
            [Page.MarketingServices]: 'marketing_services',
            [Page.RegistrationSuccess]: 'registration_success',
            [Page.EditFreelancerCV]: 'edit_freelancer_cv',
            [Page.BusinessRegistration]: 'business_registration',
            [Page.OpenStreetMapDemo]: 'openstreetmap-demo',
            [Page.AdvancedFeaturesDemo]: 'advanced-features',
            [Page.Search]: 'search',
            [Page.Payment]: 'payment',
            [Page.Geolocation]: 'geolocation',
        };
        
        const hash = pageToHashMap[page];
        if (hash) {
            window.location.hash = hash;
        }
        
        const newState: Partial<AppState> = { 
            currentPage: page, 
            activeBusinessId: null, 
            activePropertyId: null, 
            activeFreelancerId: null,
            activeUserId: null
        };
        if (page === Page.BusinessProfile && typeof id === 'number') {
            newState.activeBusinessId = id;
        }
        if (page === Page.UserProfile && typeof userId === 'string') {
            newState.activeUserId = userId;
        }
        if (page === Page.PropertyListing && typeof id === 'number') {
            newState.activePropertyId = id;
        }
        if (page === Page.FreelancerProfile && typeof id === 'number') {
            newState.activeFreelancerId = id;
        }
        if (page === Page.Wall) {
            // No specific ID needed for the main wall
        }
        set(newState);
    },
    
    login: (user, token) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(user));
        const destination = user.businessId ? Page.Dashboard : (user.freelancerId ? Page.Jobs : Page.Discover);
        set({ user, token, currentPage: destination });
    },
    
    logout: async () => {
        try {
            // Import api dynamically to avoid circular dependency
            const { api } = await import('./api');
            await api.logout();
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('savedAdIds');
        localStorage.removeItem('savedBusinessIds');
        localStorage.removeItem('savedPropertyIds');
        set({ user: null, token: null, currentPage: Page.Home, savedAdIds: [], savedBusinessIds: [], savedPropertyIds: [], pendingPlanId: null });
    },
    
    toggleSaveAd: (adId: number) => {
        const currentSavedIds = get().savedAdIds;
        const isSaved = currentSavedIds.includes(adId);
        const newSavedIds = isSaved 
            ? currentSavedIds.filter(id => id !== adId)
            : [...currentSavedIds, adId];
            
        localStorage.setItem('savedAdIds', JSON.stringify(newSavedIds));
        set({ savedAdIds: newSavedIds });
    },

    toggleSaveBusiness: (businessId: number) => {
        const currentSavedIds = get().savedBusinessIds;
        const isSaved = currentSavedIds.includes(businessId);
        const newSavedIds = isSaved 
            ? currentSavedIds.filter(id => id !== businessId)
            : [...currentSavedIds, businessId];
            
        localStorage.setItem('savedBusinessIds', JSON.stringify(newSavedIds));
        set({ savedBusinessIds: newSavedIds });
    },

    toggleSaveProperty: (propertyId: number) => {
        const currentSavedIds = get().savedPropertyIds;
        const isSaved = currentSavedIds.includes(propertyId);
        const newSavedIds = isSaved 
            ? currentSavedIds.filter(id => id !== propertyId)
            : [...currentSavedIds, propertyId];
            
        localStorage.setItem('savedPropertyIds', JSON.stringify(newSavedIds));
        set({ savedPropertyIds: newSavedIds });
    },

    setPendingPlanId: (planId) => set({ pendingPlanId: planId }),

    toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        if (newTheme === 'light') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
        
        localStorage.setItem('theme', newTheme);
        set({ theme: newTheme });
    },

    startFetching: () => {
        const fetchCount = get().fetchCount + 1;
        set({ fetchCount, isFetching: true });
    },
    stopFetching: () => {
        const fetchCount = Math.max(0, get().fetchCount - 1);
        set({ fetchCount, isFetching: fetchCount > 0 });
    },

    showToast: (message, type) => set({ toast: { message, type } }),
    hideToast: () => set({ toast: null }),
}));