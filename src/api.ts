import { MOCK_ADS, MOCK_BUSINESSES, MOCK_REVIEWS, MOCK_GALLERY_IMAGES, MOCK_COMMENTS, MOCK_PROPERTY_LISTINGS, MOCK_FREELANCERS, JOB_CATEGORIES, MOCK_POSTS, MOCK_PLANS, MOCK_INVOICES, MOCK_AD_ANALYTICS } from './constants';
import type { Ad, AdWithBusiness, Business, Category, Review, Comment, PropertyListing, PropertyStatus, PropertyType, Freelancer, Post, PostType, PostWithBusiness, Plan, Invoice, DashboardStats, AdAnalyticsData, CV } from './types';
import type { User } from './types/user';
import { normalizeUser } from './utils/normalize';
import i18n from 'i18next';
import { useStore } from './store';
import token from './utils/token';

const BUILDID = 'AU-2025-10-02-VER-2';
console.log('[BUILDID]', BUILDID, 'api.ts');

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'; // Default to false for development

// API URL Helper - ensures /api prefix
const apiUrl = (path: string): string => {
  const normalized = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : '/' + path}`;
  const fullUrl = `${API_BASE_URL}${normalized}`;
  console.log('[API_URL]', { path, normalized, fullUrl });
  return fullUrl;
};

// Debug API configuration
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  USE_MOCK_API,
  VITE_USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API,
  VITE_API_URL: import.meta.env.VITE_API_URL
});

// In-memory database for simulation
let users: User[] = [
    { _id: '1', id: '1', name: 'John Doe', email: 'john@example.com', businessId: '1' },
    { _id: '2', id: '2', name: 'Jane Smith', email: 'jane@example.com', businessId: '2' },
    { _id: '3', id: '3', name: 'Mario Rossi', email: 'mario@example.com', businessId: '3' },
    { _id: '4', id: '4', name: 'Anna Bloem', email: 'anna@example.com', businessId: '4' },
    { _id: '5', id: '5', name: 'Real Estate Agent', email: 'agent@example.com', businessId: '5' },
    { _id: '6', id: '6', name: 'Tech Fixer', email: 'tech@example.com', businessId: '6' },
];
let ads: Ad[] = [...MOCK_ADS];
let businesses: Business[] = [...MOCK_BUSINESSES];
let freelancers: Freelancer[] = [...MOCK_FREELANCERS];
let comments: Comment[] = [...MOCK_COMMENTS];
let propertyListings: PropertyListing[] = [...MOCK_PROPERTY_LISTINGS];
let posts: Post[] = [...MOCK_POSTS];
let nextUserId = 7; // Start after mock business owners
let nextBusinessId = 7;
let nextAdId = MOCK_ADS.length + 1;
let nextPropertyId = MOCK_PROPERTY_LISTINGS.length + 1;
let nextCommentId = MOCK_COMMENTS.length + 1;
let nextReviewId = MOCK_REVIEWS.length + 1;
let nextPostId = MOCK_POSTS.length + 1;


// Simulate a network delay
const networkDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// API Helper functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  if (USE_MOCK_API) {
    throw new Error('Mock API mode - this function should not be called');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Authentication helper
const getAuthToken = () => {
  return token.getToken();
};

const setAuthHeader = (headers: Record<string, string> = {}) => {
  const authToken = getAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

const isAdActive = (ad: Ad): boolean => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Compare dates only

    if (!ad.startDate) {
        return true; // No schedule, always active
    }

    const startDate = new Date(ad.startDate);
    if (ad.endDate) {
        const endDate = new Date(ad.endDate);
        return startDate <= currentDate && currentDate <= endDate;
    }

    return startDate <= currentDate;
};

// Helper function to wrap API calls with global loading state
const withFetching = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    const { startFetching, stopFetching } = useStore.getState();
    startFetching();
    try {
        const result = await apiCall();
        return result;
    } catch (error) {
        throw error;
    } finally {
        stopFetching();
    }
};

export const api = {
    // --- Auth ---
    login: async (email: string, password: string): Promise<{ user: User, token: string }> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(1000);
                // Return consistent stringified IDs for Mock
                const mockUser = {
                    _id: String(1),
                    name: "Mock User",
                    email: email,
                    businessId: String(2)
                };
                const mockToken = 'mock-token-123';
                token.setToken(mockToken);
                return { user: normalizeUser(mockUser), token: mockToken };
            } else {
                const response = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                });
                
                if (response.token) {
                    token.setToken(response.token);
                }
                
                return { user: normalizeUser(response.user), token: response.token };
            }
        }),    register: async (name: string, email: string, password: string): Promise<{ user: User, token: string }> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(1500);
                if (!name || !email || !password) {
                    throw new Error('error_all_fields_required');
                }
                if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    throw new Error('error_email_in_use');
                }
                const rawUser = { id: nextUserId++, name, email };
                const newUser = normalizeUser(rawUser);
                users.push(newUser);
                return { user: newUser, token: 'fake-jwt-token-for-new-user' };
            } else {
                const response = await apiCall('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password }),
                });
                
                if (response.token) {
                    localStorage.setItem('auth-token', response.token);
                }
                
                return response;
            }
        }),

    registerBusiness: async (data: any): Promise<{ user: User, token: string, business: Business }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(2000);
                
                // Basic validation
                if (!data.name || !data.email || !data.password) {
                    throw new Error('Wszystkie pola są wymagane');
                }
                
                if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
                    throw new Error('Ten adres email jest już używany');
                }
                
                // Create mock user
                const rawUser = { 
                    id: nextUserId++, 
                    name: data.name, 
                    email: data.email 
                };
                const newUser = normalizeUser(rawUser);
                users.push(newUser);
                
                // Create mock business
                const newBusiness: Business = {
                    id: Date.now(),
                    ownerId: Date.now() + 1,
                    nameKey: data.businessName || 'Nowy Biznes',
                    descriptionKey: data.description || 'Opis biznesu',
                    categoryKey: data.category || 'inne',
                    logoUrl: '',
                    coverImageUrl: '',
                    address: data.address || {
                        street: 'Ul. Przykładowa 1',
                        postalCode: '00-001',
                        city: 'Warszawa',
                        country: 'Polska'
                    },
                    rating: 0,
                    reviewCount: 0,
                    adCount: 0,
                    isVerified: false,
                    phone: data.phone || '',
                    website: data.website || '',
                    googleMapsUrl: '',
                    instagram: '',
                    facebook: '',
                    twitter: '',
                    linkedin: '',
                    tiktokUrl: '',
                    otherLinkUrl: '',
                    openingHours: {},
                    services: [],
                    kvkNumber: '',
                    btwNumber: '',
                    iban: '',
                    createdAt: new Date().toISOString(),
                    subscriptionStatus: 'inactive' as const
                };
                
                return { 
                    user: newUser, 
                    token: 'fake-jwt-token-for-business-owner',
                    business: newBusiness
                };
            } else {
                // 1) API endpoint - zgodność ścieżki
                const finalURL = apiUrl('/auth/register/business');
                console.log('📡 [API_REGISTER_BUSINESS] Sending to backend');
                console.log('📡 [API_REGISTER_BUSINESS] Final URL:', finalURL);
                
                const response = await fetch(finalURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        password: data.password,
                        businessName: data.businessName,
                        businessDescription: data.businessDescription,
                        category: data.category,
                        phone: data.phone,
                        website: data.website,
                        street: data.street,
                        postalCode: data.postalCode,
                        city: data.city,
                        kvkNumber: data.kvkNumber,
                        btwNumber: data.btwNumber,
                        iban: data.iban,
                        instagram: data.instagram,
                        facebook: data.facebook,
                        twitter: data.twitter,
                        linkedin: data.linkedin,
                        tiktokUrl: data.tiktokUrl,
                        otherLinkUrl: data.otherLinkUrl
                    }),
                });

                console.log('📡 [API] Backend response status:', response.status, response.statusText);

                if (!response.ok) {
                    let errorData: any = {};
                    try {
                        errorData = await response.json();
                    } catch (jsonError) {
                        console.error('🔴 [API] Failed to parse error response as JSON:', jsonError);
                    }
                    console.error('🔴🔴🔴 [API] Backend returned error:', errorData);
                    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                let result: any;
                try {
                    result = await response.json();
                } catch (jsonError) {
                    console.error('🔴🔴🔴 [API] Failed to parse success response as JSON:', jsonError);
                    throw new Error('Invalid JSON response from server');
                }
                
                // 2) Zapis tokenu - BEZWARUNKOWO
                console.log('✅ [API] Backend response:', JSON.stringify(result, null, 2));
                
                if (result.token) {
                    localStorage.setItem('auth-token', result.token);
                    console.log('✅ [API] Token UNCONDITIONALLY saved:', result.token.substring(0, 20) + '...');
                } else {
                    console.error('🔴🔴🔴 [API] NO TOKEN in response!');
                }
                
                // Validate structure and return
                return {
                    user: result.user,
                    token: result.token,
                    business: result.business
                };
            }
        }),

    requestPasswordReset: async (email: string): Promise<{ message: string }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(1000);
                // Mock validation
                if (!email) {
                    throw new Error('Email is required');
                }
                return { message: 'If an account with that email exists, we have sent a password reset link.' };
            } else {
                const response = await apiCall('/auth/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                });
                return response;
            }
        }),

    forgotPassword: async (email: string): Promise<{ message: string }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(1000);
                // Mock validation
                if (!email) {
                    throw new Error('Email is required');
                }
                return { message: 'If an account with that email exists, we have sent a password reset link.' };
            } else {
                const response = await apiCall('/auth/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                });
                return response;
            }
        }),

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(1000);
                // Mock validation
                if (!token || !newPassword) {
                    throw new Error('Token and new password are required');
                }
                if (newPassword.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }
                return { message: 'Password has been reset successfully. You can now log in with your new password.' };
            } else {
                const response = await apiCall('/auth/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ token, newPassword }),
                });
                return response;
            }
        }),

    verifyResetToken: async (token: string): Promise<{ message: string, email?: string }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(500);
                // Mock validation
                if (!token) {
                    throw new Error('Invalid or expired reset token');
                }
                return { message: 'Reset token is valid', email: 'user@example.com' };
            } else {
                const response = await apiCall(`/auth/verify-reset-token/${token}`, {
                    method: 'GET',
                });
                return response;
            }
        }),

    // --- Ads ---
    fetchAds: async (filters: { city?: string; category?: Category | ''; mediaType?: 'video' | 'image' }): Promise<AdWithBusiness[]> => 
        withFetching(async () => {
            await networkDelay(1500);

            const activeAds = ads.filter(isAdActive);
            let filteredAds = [...activeAds];

            if (filters.city) {
                filteredAds = filteredAds.filter(ad => ad.city === filters.city);
            }
            if (filters.category) {
                filteredAds = filteredAds.filter(ad => ad.category === filters.category);
            }
            if (filters.mediaType) {
                filteredAds = filteredAds.filter(ad => ad.mediaType === filters.mediaType);
            }

            const sortedAds = filteredAds.sort((a, b) => b.id - a.id);
            
            return sortedAds.map(ad => ({
                ...ad,
                business: businesses.find(b => b.id === ad.businessId)!,
            }));
        }),
    
    fetchDeals: async (): Promise<AdWithBusiness[]> => 
        withFetching(async () => {
            await networkDelay(1200);

            const activeAds = ads.filter(isAdActive);

            const dealAds = activeAds
                .filter(ad => ad.discountPercentage && ad.discountPercentage >= 35)
                .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));

            return dealAds.map(ad => ({
                ...ad,
                business: businesses.find(b => b.id === ad.businessId)!,
            }));
        }),

    createAd: async (adData: any): Promise<Ad | PropertyListing> => 
        withFetching(async () => {
            await networkDelay(1500);

            if (adData.adType === 'property') {
                const newProperty: PropertyListing = {
                    id: nextPropertyId++,
                    businessId: adData.businessId,
                    title: adData.title,
                    address: { street: adData.street, postalCode: adData.postalCode, city: adData.city, country: "Netherlands" },
                    status: adData.status as PropertyStatus,
                    type: adData.type as PropertyType,
                    price: parseFloat(adData.price),
                    livingArea: parseInt(adData.livingArea),
                    plotSize: adData.plotSize ? parseInt(adData.plotSize) : undefined,
                    bedrooms: parseInt(adData.bedrooms),
                    bathrooms: parseInt(adData.bathrooms),
                    yearBuilt: parseInt(adData.yearBuilt),
                    energyLabel: adData.energyLabel,
                    description: adData.description,
                    photos: adData.photos || [],
                };
                propertyListings.unshift(newProperty);
                return newProperty;
            } else {
                const newAd: Ad = {
                    ...adData,
                    id: nextAdId++,
                    isSponsored: false,
                    likeCount: 0,
                    commentCount: 0,
                    isLikedByCurrentUser: false,
                    discountPercentage: adData.discountPercentage ? Number(adData.discountPercentage) : undefined,
                };
                ads.unshift(newAd);
                const business = businesses.find(b => b.id === adData.businessId);
                if (business) business.adCount++;
                return newAd;
            }
        }),

    fetchAdsByIds: async (ids: number[]): Promise<AdWithBusiness[]> => 
        withFetching(async () => {
            await networkDelay(500);
            const savedAds = ads.filter(ad => ids.includes(ad.id));
            return savedAds.map(ad => ({ ...ad, business: businesses.find(b => b.id === ad.businessId)! }));
        }),

    fetchAdsByBusinessId: async (businessId: number): Promise<AdWithBusiness[]> => {
        await networkDelay(1000);
        const businessAds = ads.filter(ad => ad.businessId === businessId);
        return businessAds.map(ad => ({ ...ad, business: businesses.find(b => b.id === ad.businessId)! }));
    },

    toggleAdLike: async (adId: number, like: boolean): Promise<{ likeCount: number }> => {
        await networkDelay(300);
        const ad = ads.find(p => p.id === adId);
        if (!ad) throw new Error("Ad not found");
        ad.likeCount = like ? ad.likeCount + 1 : Math.max(0, ad.likeCount - 1);
        ad.isLikedByCurrentUser = like;
        return { likeCount: ad.likeCount };
    },

    fetchAdAnalytics: async (adId: number): Promise<AdAnalyticsData> => 
        withFetching(async () => {
            await networkDelay(1200);
            const analytics = MOCK_AD_ANALYTICS.find(a => a.adId === adId);
            if (!analytics) return { adId, impressions: 0, ctr: 0, engagementRate: 0, trend: [] };
            return analytics;
        }),

    // --- Businesses ---
    fetchBusinesses: async (filters: { search?: string, category?: Category | '', city?: string }): Promise<Business[]> => 
        withFetching(async () => {
            await networkDelay(1000);
            let filteredBusinesses = businesses.filter(b => b.subscriptionStatus === 'active' || b.subscriptionStatus === 'past_due');
            if (filters.city) filteredBusinesses = filteredBusinesses.filter(b => b.address.city === filters.city);
            if (filters.category) filteredBusinesses = filteredBusinesses.filter(b => b.categoryKey === filters.category);
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredBusinesses = filteredBusinesses.filter(b => 
                    b.nameKey.toLowerCase().includes(searchTerm) || 
                    b.descriptionKey.toLowerCase().includes(searchTerm) ||
                    b.categoryKey.toLowerCase().includes(searchTerm)
                );
            }
            return filteredBusinesses;
        }),

    fetchBusinessById: async (id: string): Promise<Business> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(800);
                const business = businesses.find(b => b.id === parseInt(id));
                if (!business) throw new Error("Business not found.");
                return business;
            } else {
                const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch business');
                }

                const result = await response.json();
                return result.business;
            }
        }),
    
    fetchBusinessByOwnerId: async (ownerId: number): Promise<Business> => 
        withFetching(async () => {
            await networkDelay(700);
            const business = businesses.find(b => b.ownerId === ownerId);
            if (!business) {
                const user = users.find(u => String(u.id) === String(ownerId));
                if(user && user.businessId) {
                    const businessById = businesses.find(b => String(b.id) === String(user.businessId));
                    if (businessById) return businessById;
                }
                throw new Error("Business not found for this owner.");
            }
            return business;
        }),

    updateBusiness: async (updatedData: Business): Promise<Business> => 
        withFetching(async () => {
            const { showToast } = useStore.getState();
            await networkDelay(1500);
            const businessIndex = businesses.findIndex(b => b.id === updatedData.id);
            if (businessIndex === -1) throw new Error("Business not found to update.");
            
            i18n.addResourceBundle('en', 'translation', { [updatedData.nameKey]: updatedData.nameKey, [updatedData.descriptionKey]: updatedData.descriptionKey });
            i18n.addResourceBundle('nl', 'translation', { [updatedData.nameKey]: updatedData.nameKey, [updatedData.descriptionKey]: updatedData.descriptionKey });
            i18n.addResourceBundle('pl', 'translation', { [updatedData.nameKey]: updatedData.nameKey, [updatedData.descriptionKey]: updatedData.descriptionKey });
            
            businesses[businessIndex] = updatedData;
            showToast(i18n.t('profile_updated_success'), 'success');
            return businesses[businessIndex];
        }),

    fetchReviewsForBusiness: async (businessId: number): Promise<Review[]> => {
        await networkDelay(1200);
        return MOCK_REVIEWS.filter(review => review.businessId === businessId);
    },

    fetchAllReviewsForBusiness: async (businessId: number): Promise<Review[]> => 
        withFetching(async () => {
            await networkDelay(1000);
            return [...MOCK_REVIEWS].filter(r => r.businessId === businessId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }),

    postBusinessReview: async (targetBusinessId: number, authorBusinessId: number, rating: number, text: string): Promise<Review> => 
        withFetching(async () => {
            const { showToast } = useStore.getState();
            await networkDelay(1000);

            const authorBusiness = businesses.find(b => b.id === authorBusinessId);
            if (!authorBusiness) throw new Error("Author business not found.");

            const newReview: Review = {
                id: nextReviewId++,
                businessId: targetBusinessId,
                author: i18n.t(authorBusiness.nameKey),
                authorType: 'business',
                authorBusinessId: authorBusiness.id,
                avatarUrl: authorBusiness.logoUrl,
                rating,
                text,
                date: new Date().toISOString(),
            };
            MOCK_REVIEWS.unshift(newReview);
            showToast(i18n.t('review_posted_successfully'), 'success');
            return newReview;
        }),
    
    fetchGalleryForBusiness: async (businessId: number): Promise<string[]> => {
        await networkDelay(1000);
        return MOCK_GALLERY_IMAGES[businessId] || [];
    },

    fetchCommentsForAd: async (adId: number): Promise<Comment[]> => {
        await networkDelay(800);
        return comments.filter(c => c.adId === adId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    fetchCommentsForPost: async (postId: number): Promise<Comment[]> => {
        await networkDelay(800);
        return comments.filter(c => c.postId === postId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    postComment: async (target: { adId?: number; postId?: number }, text: string, author: string, avatarUrl: string): Promise<Comment> => {
        await networkDelay(500);
        const newComment: Comment = {
            id: nextCommentId++, adId: target.adId || 0, postId: target.postId || 0,
            text, author, avatarUrl, date: new Date().toISOString(),
        };
        comments.push(newComment);
        if (target.adId) { const ad = ads.find(a => a.id === target.adId); if (ad) ad.commentCount++; }
        if (target.postId) { const post = posts.find(p => p.id === target.postId); if (post) post.commentCount++; }
        return newComment;
    },

    // --- Real Estate ---
    fetchPropertyListings: async (filters: any): Promise<PropertyListing[]> => 
        withFetching(async () => {
            await networkDelay(1000);
            let filteredListings = [...propertyListings];
            if (filters.search) {
                const term = filters.search.toLowerCase();
                filteredListings = filteredListings.filter(p => p.title.toLowerCase().includes(term) || p.address.street.toLowerCase().includes(term) || p.address.city.toLowerCase().includes(term));
            }
            if (filters.status) filteredListings = filteredListings.filter(p => p.status === filters.status);
            if (filters.type) filteredListings = filteredListings.filter(p => p.type === filters.type);
            if (filters.priceMin) filteredListings = filteredListings.filter(p => p.price >= Number(filters.priceMin));
            if (filters.priceMax) filteredListings = filteredListings.filter(p => p.price <= Number(filters.priceMax));
            if (filters.bedrooms) filteredListings = filteredListings.filter(p => p.bedrooms >= Number(filters.bedrooms));
            return filteredListings;
        }),

    fetchPropertyListingById: async (id: number): Promise<PropertyListing> => {
        await networkDelay(700);
        const listing = propertyListings.find(p => p.id === id);
        if (!listing) throw new Error("Property listing not found.");
        return listing;
    },

    updatePropertyListing: async (listingData: PropertyListing): Promise<PropertyListing> => 
        withFetching(async () => {
            await networkDelay(1000);
            const index = propertyListings.findIndex(p => p.id === listingData.id);
            if (index === -1) throw new Error("Property listing to update not found.");
            propertyListings[index] = listingData;
            return propertyListings[index];
        }),

    fetchPropertiesByIds: async (ids: number[]): Promise<PropertyListing[]> => 
        withFetching(async () => {
            await networkDelay(500);
            return propertyListings.filter(p => ids.includes(p.id));
        }),

    // --- Freelancers (Klussen) ---
    fetchFreelancers: async (filters: { search?: string, category?: string, city?: string }): Promise<Freelancer[]> => 
        withFetching(async () => {
            await networkDelay(900);
            let filteredFreelancers = [...freelancers];
            if (filters.city) filteredFreelancers = filteredFreelancers.filter(f => f.city === filters.city);
            if (filters.category) {
                const categoryKey = JOB_CATEGORIES.find(c => c.id === filters.category)?.translationKey;
                if(categoryKey) filteredFreelancers = filteredFreelancers.filter(f => f.specializationKey === categoryKey);
            }
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredFreelancers = filteredFreelancers.filter(f => i18n.t(f.nameKey).toLowerCase().includes(searchTerm) || i18n.t(f.specializationKey).toLowerCase().includes(searchTerm));
            }
            return filteredFreelancers;
        }),

    fetchFreelancerById: async (id: number): Promise<Freelancer> => {
        await networkDelay(600);
        const freelancer = freelancers.find(f => f.id === id);
        if (!freelancer) throw new Error("Freelancer not found.");
        return freelancer;
    },
    
    updateFreelancer: async (updatedData: Freelancer): Promise<Freelancer> => {
        // Not wrapped in `withFetching` to support silent autosave
        await networkDelay(500);
        const freelancerIndex = freelancers.findIndex(f => f.id === updatedData.id);
        if (freelancerIndex === -1) throw new Error("Freelancer not found to update.");
        
        // Convert translation keys back to plain text for mock data
        i18n.addResourceBundle('en', 'translation', { [updatedData.nameKey]: updatedData.nameKey, [updatedData.aboutKey]: updatedData.aboutKey });
        i18n.addResourceBundle('nl', 'translation', { [updatedData.nameKey]: updatedData.nameKey, [updatedData.aboutKey]: updatedData.aboutKey });
        i18n.addResourceBundle('pl', 'translation', { [updatedData.nameKey]: updatedData.nameKey, [updatedData.aboutKey]: updatedData.aboutKey });
        
        freelancers[freelancerIndex] = updatedData;
        return freelancers[freelancerIndex];
    },

    saveCvDraft: async (freelancerId: number, cvData: CV): Promise<{ status: 'ok' }> => {
        // This is a stubbed method for autosaving to a backend.
        // It doesn't use `withFetching` to avoid showing the global loading bar.
        await networkDelay(300);
        console.log(`[Autosave] Saving draft for freelancer ${freelancerId}`, cvData);
        // In a real app, this would be a POST/PUT to /api/cv/draft
        return { status: 'ok' };
    },

    fetchReviewsForFreelancer: async (freelancerId: number): Promise<Review[]> => {
        await networkDelay(1000);
        return MOCK_REVIEWS.filter(review => review.freelancerId === freelancerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    postFreelancerReview: async (freelancerId: number, rating: number, text: string): Promise<Review> => 
        withFetching(async () => {
            const { showToast, user } = useStore.getState();
            await networkDelay(1000);

            if (!user) throw new Error("User not logged in.");

            const newReview: Review = {
                id: nextReviewId++,
                freelancerId,
                author: user.name,
                authorType: 'user',
                avatarUrl: "https://i.imgur.com/sC3bL2T.png", // Using a generic avatar for new user reviews
                rating,
                text,
                date: new Date().toISOString(),
            };
            MOCK_REVIEWS.unshift(newReview);

            const freelancer = freelancers.find(f => f.id === freelancerId);
            if (freelancer) {
                const allReviewsForFreelancer = MOCK_REVIEWS.filter(r => r.freelancerId === freelancerId);
                const totalRating = allReviewsForFreelancer.reduce((sum, r) => sum + r.rating, 0);
                freelancer.rating = totalRating / allReviewsForFreelancer.length;
                freelancer.reviewCount = allReviewsForFreelancer.length;
            }

            showToast(i18n.t('review_posted_successfully'), 'success');
            return newReview;
        }),

    // --- Posts (Wall) ---
    fetchPosts: async (filters: { businessId?: number; search?: string; sortBy?: 'newest' | 'most_liked' } = {}): Promise<PostWithBusiness[]> => {
        await networkDelay(1000);

        let filteredPosts = [...posts];
        if (filters.businessId) filteredPosts = filteredPosts.filter(p => p.businessId === filters.businessId);

        const allBusinesses = [...businesses];
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredPosts = filteredPosts.filter(post => {
                const business = allBusinesses.find(b => b.id === post.businessId);
                const businessName = business ? i18n.t(business.nameKey).toLowerCase() : '';
                return post.content.toLowerCase().includes(searchTerm) || businessName.includes(searchTerm);
            });
        }
        if (filters.sortBy === 'most_liked') filteredPosts.sort((a, b) => b.likeCount - a.likeCount);
        else filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return filteredPosts.map(post => ({ ...post, business: allBusinesses.find(b => b.id === post.businessId)! }));
    },
    
    createPost: async (postData: { businessId: number; type: PostType; content: string; mediaUrl?: string }): Promise<Post> => 
        withFetching(async () => {
            await networkDelay(1200);

            const newPost: Post = {
                id: nextPostId++, businessId: postData.businessId, type: postData.type,
                content: postData.content, mediaUrl: postData.mediaUrl, createdAt: new Date().toISOString(),
                likeCount: 0, commentCount: 0, isLikedByCurrentUser: false,
            };
            posts.unshift(newPost);
            
            if (newPost.type === 'video' && newPost.mediaUrl) {
                const business = businesses.find(b => b.id === newPost.businessId);
                if (business) {
                    const newAd: Ad = {
                        id: nextAdId++, businessId: newPost.businessId, title: newPost.content.substring(0, 50),
                        structuredDescription: { benefit: "Check out our latest video!", features: "", solution: "" },
                        city: business.address.city, category: business.categoryKey, mediaUrls: [newPost.mediaUrl],
                        mediaType: 'video', tags: [], isSponsored: false, likeCount: 0, commentCount: 0,
                    };
                    ads.unshift(newAd);
                    business.adCount++;
                }
            }
            return newPost;
        }),

    togglePostLike: async (postId: number, like: boolean): Promise<{ likeCount: number }> => {
        await networkDelay(300);
        const post = posts.find(p => p.id === postId);
        if (!post) throw new Error("Post not found");
        post.likeCount = like ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
        post.isLikedByCurrentUser = like;
        return { likeCount: post.likeCount };
    },
    
    // --- Subscription & Dashboard ---
    fetchDashboardStats: async (businessId: number): Promise<DashboardStats> => 
        withFetching(async () => {
            await networkDelay(1200);
            return {
                profileViews: { value: 1345, change: 12.5 }, adClicks: { value: 876, change: -5.2 },
                newLikes: { value: 213, change: 8.0 },
                recentActivities: [
                    { id: 1, type: 'review', text: `Anna V. left a 5-star review.`, timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
                    { id: 2, type: 'like', text: `Your ad "New collection..." received 15 new likes.`, timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
                    { id: 3, type: 'comment', text: `Mark D. commented on your post "Start your week right...".`, timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
                    { id: 4, type: 'ad_created', text: `Your ad "Morning Boost..." is now live.`, timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
                ],
            };
        }),

    fetchPlans: async (): Promise<Plan[]> => {
        await networkDelay(500);
        return MOCK_PLANS;
    },

    fetchInvoices: async (businessId: number): Promise<Invoice[]> => 
        withFetching(async () => {
            await networkDelay(800);
            return MOCK_INVOICES.filter(inv => inv.businessId === businessId);
        }),

    createCheckoutSession: async (businessId: number, planId: string): Promise<{ success: boolean }> => 
        withFetching(async () => {
            await networkDelay(1500);
            const business = businesses.find(b => b.id === businessId);
            if (!business) throw new Error("Business not found");
            return { success: true };
        }),

    activateSubscription: async (businessId: number, planId: string): Promise<Business> => 
        withFetching(async () => {
            await networkDelay(500);
            const businessIndex = businesses.findIndex(b => b.id === businessId);
            if (businessIndex === -1) throw new Error("Business not found");
            
            const plan = MOCK_PLANS.find(p => p.id === planId);
            if (!plan) throw new Error("Plan not found");

            const expiryDate = new Date();
            if (plan.intervalKey === 'month') expiryDate.setMonth(expiryDate.getMonth() + 1);
            else if (plan.intervalKey === 'year') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            else if (plan.intervalKey === '2_years') expiryDate.setFullYear(expiryDate.getFullYear() + 2);
            
            businesses[businessIndex].subscriptionStatus = 'active';
            businesses[businessIndex].planId = planId;
            businesses[businessIndex].subscriptionExpiresAt = expiryDate.toISOString();
            businesses[businessIndex].isVerified = planId === 'plan_yearly' || planId === 'plan_two_year';

            return businesses[businessIndex];
        }),

    cancelSubscription: async (businessId: number): Promise<Business> => 
        withFetching(async () => {
            await networkDelay(1000);
            const businessIndex = businesses.findIndex(b => b.id === businessId);
            if (businessIndex === -1) throw new Error("Business not found");
            
            businesses[businessIndex].subscriptionStatus = 'canceled';
            businesses[businessIndex].isVerified = false;
            return businesses[businessIndex];
        }),
    
    submitSupportTicket: async (ticketData: { category: string; subject: string; message: string; attachment?: File }): Promise<{ success: boolean }> => 
        withFetching(async () => {
            const { showToast } = useStore.getState();
            await networkDelay(1500);
            console.log("Submitting support ticket:", ticketData);
            showToast(i18n.t('ticket_submitted_success'), 'success');
            return { success: true };
        }),
    
    submitServiceOrder: async (orderData: { serviceName: string; email: string; description: string; fileCount: number }): Promise<{ success: boolean }> => 
        withFetching(async () => {
            const { showToast } = useStore.getState();
            await networkDelay(1500);
            console.log("Submitting NORBS SERVICE order:", orderData);
            showToast(i18n.t('inquiry_sent_successfully'), 'success');
            return { success: true };
        }),
        
    fetchBusinessProfileData: async (id: string): Promise<{
        business: Business;
        reviews: Review[];
        gallery: string[];
        ads: AdWithBusiness[];
        posts: PostWithBusiness[];
    }> => withFetching(async () => {
            await networkDelay(1200); // Simulate combined network time

            // Directly call internal implementations to avoid nested withFetching calls
            const business = await api.fetchBusinessById(id);
            const reviews = await api.fetchReviewsForBusiness(parseInt(id));
            const gallery = await api.fetchGalleryForBusiness(parseInt(id));
            const ads = await api.fetchAdsByBusinessId(parseInt(id));
            const posts = await api.fetchPosts({ businessId: parseInt(id) });

            return { business, reviews, gallery, ads, posts };
        }),

    fetchFreelancerProfileData: async (id: number): Promise<{
        freelancer: Freelancer;
        reviews: Review[];
    }> => withFetching(async () => {
        await networkDelay(1200);
        const freelancer = await api.fetchFreelancerById(id);
        const reviews = await api.fetchReviewsForFreelancer(id);
        return { freelancer, reviews };
    }),

    // --- NEW: Real API Functions for Frontend Integration ---
    
    verifyToken: async (): Promise<{ user: User }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(300);
                const token = localStorage.getItem('auth-token');
                if (!token) throw new Error('No token found');
                // Mock user verification
                return { user: users[0] || { id: 1, name: 'Mock User', email: 'mock@example.com' } };
            } else {
                const response = await apiCall('/auth/me', {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
                return { user: response.user };
            }
        }),

    logout: async (): Promise<void> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(500);
                localStorage.removeItem('auth-token');
                return;
            } else {
                try {
                    await apiCall('/auth/logout', {
                        method: 'POST',
                        headers: setAuthHeader(),
                    });
                } catch (error) {
                    console.warn('Logout API call failed:', error);
                }
                localStorage.removeItem('auth-token');
            }
        }),

    refresh: async (): Promise<{ token: string }> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(300);
                return { token: 'refreshed-fake-jwt-token' };
            } else {
                const response = await apiCall('/auth/refresh', {
                    method: 'POST',
                    headers: setAuthHeader(),
                });
                
                if (response.token) {
                    localStorage.setItem('auth-token', response.token);
                }
                
                return response;
            }
        }),

    getBusinesses: async (filters: { search?: string; category?: Category | ''; city?: string; page?: number } = {}): Promise<Business[]> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                return api.fetchBusinesses({ 
                    search: filters.search, 
                    category: filters.category || '', 
                    city: filters.city 
                });
            } else {
                const queryParams = new URLSearchParams();
                if (filters.search) queryParams.append('search', filters.search);
                if (filters.category) queryParams.append('category', filters.category);
                if (filters.city) queryParams.append('city', filters.city);
                if (filters.page) queryParams.append('page', filters.page.toString());

                return await apiCall(`/businesses?${queryParams.toString()}`, {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
            }
        }),

    getFeed: async (page: number = 1): Promise<{ videos: any[]; hasMore: boolean; totalCount: number }> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(800);
                // Mock video feed data
                const mockVideos = [
                    {
                        id: `video_${page}_1`,
                        title: `Mock Video ${page * 3 - 2}`,
                        description: 'This is a mock video for testing',
                        url: 'https://example.com/video1.mp4',
                        thumbnail: 'https://example.com/thumb1.jpg',
                        authorId: 1,
                        businessId: 1,
                        likes: Math.floor(Math.random() * 100),
                        views: Math.floor(Math.random() * 1000),
                        tags: ['test', 'mock'],
                        createdAt: new Date().toISOString(),
                    },
                    {
                        id: `video_${page}_2`,
                        title: `Mock Video ${page * 3 - 1}`,
                        description: 'Another mock video',
                        url: 'https://example.com/video2.mp4',
                        thumbnail: 'https://example.com/thumb2.jpg',
                        authorId: 2,
                        businessId: 2,
                        likes: Math.floor(Math.random() * 100),
                        views: Math.floor(Math.random() * 1000),
                        tags: ['demo', 'video'],
                        createdAt: new Date().toISOString(),
                    }
                ];
                
                return {
                    videos: mockVideos,
                    hasMore: page < 5, // Mock pagination
                    totalCount: 10
                };
            } else {
                return await apiCall(`/videos/feed?page=${page}`, {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
            }
        }),

    uploadVideo: async (formData: FormData): Promise<{ id: string; videoUrl: string }> => 
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(2000); // Simulate upload time
                const mockId = `uploaded_${Date.now()}`;
                return {
                    id: mockId,
                    videoUrl: `https://example.com/uploads/${mockId}.mp4`
                };
            } else {
                const response = await fetch(`${API_BASE_URL}/videos/upload`, {
                    method: 'POST',
                    headers: setAuthHeader({}),
                    body: formData, // Don't set Content-Type for multipart/form-data
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                    throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
                }
                
                return response.json();
            }
        }),

    // User Profile API Functions
    fetchUserProfile: async (userId: string): Promise<any> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(500);
                // Mock user profile data
                const mockUser = {
                    _id: userId,
                    name: 'Jan Kowalski',
                    email: 'jan@example.com',
                    userType: 'user',
                    avatar: 'https://picsum.photos/200/200?random=1',
                    coverImage: 'https://picsum.photos/800/400?random=1',
                    bio: 'Cześć! Jestem pasjonatem technologii i lubię dzielić się swoimi doświadczeniami.',
                    location: 'Warszawa, Polska',
                    website: 'https://jankowalski.pl',
                    interests: ['Technologia', 'Fotografia', 'Podróże', 'Gotowanie'],
                    languages: ['pl', 'en', 'de'],
                    socialLinks: {
                        facebook: 'https://facebook.com/jankowalski',
                        instagram: 'https://instagram.com/jankowalski',
                        twitter: 'https://twitter.com/jankowalski',
                        linkedin: 'https://linkedin.com/in/jankowalski'
                    },
                    createdAt: new Date('2023-01-01'),
                    isVerified: true,
                    isActive: true
                };
                return mockUser;
            } else {
                return await apiCall(`/users/profile/${userId}`, {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
            }
        }),

    fetchUserPosts: async (userId: string): Promise<any[]> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(300);
                // Mock user posts
                const mockPosts = [
                    {
                        id: 1,
                        content: 'Właśnie wróciłem z niesamowitej wycieczki po Zakopanem! 🏔️',
                        mediaUrl: 'https://picsum.photos/600/400?random=10',
                        mediaType: 'photo',
                        createdAt: new Date('2024-01-15'),
                        likes: 24,
                        comments: 8,
                        shares: 3
                    },
                    {
                        id: 2,
                        content: 'Dzisiaj testowałem nowy aparat. Efekty są niesamowite! 📸',
                        mediaUrl: 'https://picsum.photos/600/400?random=11',
                        mediaType: 'photo',
                        createdAt: new Date('2024-01-10'),
                        likes: 18,
                        comments: 5,
                        shares: 2
                    }
                ];
                return mockPosts;
            } else {
                return await apiCall(`/users/${userId}/posts`, {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
            }
        }),

    fetchUserPhotos: async (userId: string): Promise<string[]> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(300);
                // Mock user photos
                const mockPhotos = Array.from({ length: 12 }, (_, i) => 
                    `https://picsum.photos/400/400?random=${i + 20}`
                );
                return mockPhotos;
            } else {
                return await apiCall(`/users/${userId}/photos`, {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
            }
        }),

    fetchUserVideos: async (userId: string): Promise<string[]> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(300);
                // Mock user videos
                const mockVideos = [
                    'https://sample-videos.com/zip/10/mp4/480/mp4-sample-1.mp4',
                    'https://sample-videos.com/zip/10/mp4/480/mp4-sample-2.mp4'
                ];
                return mockVideos;
            } else {
                return await apiCall(`/users/${userId}/videos`, {
                    method: 'GET',
                    headers: setAuthHeader(),
                });
            }
        }),

    updateUserProfile: async (userData: any): Promise<any> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(800);
                // Mock profile update
                return {
                    success: true,
                    message: 'Profil został zaktualizowany',
                    user: userData
                };
            } else {
                return await apiCall('/users/profile', {
                    method: 'PUT',
                    headers: setAuthHeader(),
                    body: JSON.stringify(userData),
                });
            }
        }),

    // ============================================
    // REAL MongoDB API Functions (NEW)
    // ============================================

    // Create Business (REAL - requires auth)
    createBusiness: async (data: {
        name: string;
        description?: string;
        category: string;
        city: string;
        street?: string;
        postalCode?: string;
        country?: string;
    }): Promise<{ success: boolean; business: Business }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(1000);
                const newBusiness: Business = {
                    id: Date.now(),
                    ownerId: Date.now() + 1,
                    nameKey: data.name,
                    descriptionKey: data.description || '',
                    categoryKey: data.category as any,
                    logoUrl: '',
                    coverImageUrl: '',
                    address: {
                        street: data.street || '',
                        postalCode: data.postalCode || '',
                        city: data.city,
                        country: data.country || 'Netherlands'
                    },
                    rating: 0,
                    reviewCount: 0,
                    adCount: 0,
                    isVerified: false,
                    phone: '',
                    website: '',
                    googleMapsUrl: '',
                    instagram: '',
                    facebook: '',
                    twitter: '',
                    linkedin: '',
                    tiktokUrl: '',
                    otherLinkUrl: '',
                    openingHours: {},
                    services: [],
                    kvkNumber: '',
                    btwNumber: '',
                    iban: '',
                    createdAt: new Date().toISOString(),
                    subscriptionStatus: 'inactive' as const
                };
                return { success: true, business: newBusiness };
            } else {
                console.log('[API] createBusiness - Sending to REAL backend');
                const response = await fetch(apiUrl('/business'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...setAuthHeader()
                    },
                    body: JSON.stringify(data)
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || 'Failed to create business');
                }

                console.log('[API] createBusiness - Success:', result);
                return result;
            }
        }),

    // Get My Business (REAL - requires auth)
    meBusiness: async (): Promise<{ success: boolean; business: Business | null }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(500);
                return { success: true, business: null };
            } else {
                console.log('[API] meBusiness - Fetching from REAL backend');
                const response = await fetch(apiUrl('/business/me'), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...setAuthHeader()
                    }
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
                }

                // 404 is OK - user doesn't have a business yet
                if (response.status === 404) {
                    console.log('[API] meBusiness - No business found (404)');
                    return { success: true, business: null };
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || 'Failed to fetch business');
                }

                console.log('[API] meBusiness - Success:', result);
                return result;
            }
        }),

    // Add Post (REAL - requires auth)
    addPost: async (data: {
        title: string;
        body?: string;
        type?: 'text' | 'image' | 'video';
        city?: string;
    }): Promise<{ success: boolean; post: any }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(800);
                const newPost = {
                    id: Date.now(),
                    authorId: 1,
                    businessId: null,
                    type: data.type || 'text',
                    title: data.title,
                    body: data.body || '',
                    city: data.city,
                    likes: 0,
                    comments: 0,
                    views: 0,
                    createdAt: new Date().toISOString()
                };
                return { success: true, post: newPost };
            } else {
                console.log('[API] addPost - Sending to REAL backend');
                const response = await fetch(apiUrl('/posts'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...setAuthHeader()
                    },
                    body: JSON.stringify(data)
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || 'Failed to create post');
                }

                console.log('[API] addPost - Success:', result);
                return result;
            }
        }),

    // List Posts (REAL - public)
    listPosts: async (limit: number = 20, city?: string): Promise<{ success: boolean; posts: any[]; total: number }> =>
        withFetching(async () => {
            if (USE_MOCK_API) {
                await networkDelay(500);
                return { success: true, posts: [], total: 0 };
            } else {
                console.log('[API] listPosts - Fetching from REAL backend');
                const params = new URLSearchParams();
                params.append('limit', limit.toString());
                if (city) params.append('city', city);

                const response = await fetch(apiUrl(`/posts?${params.toString()}`), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || 'Failed to fetch posts');
                }

                console.log('[API] listPosts - Success:', result);
                return result;
            }
        }),
};