
import type React from 'react';

export interface Language {
  code: string;
  name: string;
  flag: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  businessId?: number;
  freelancerId?: number; // Added to link user to a freelancer profile
}

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Review {
  id: number;
  businessId?: number;
  freelancerId?: number;
  author: string;
  authorType: 'user' | 'business';
  authorBusinessId?: number;
  avatarUrl: string;
  rating: number;
  text: string;
  date: string;
}

export interface Service {
    name: string;
    price?: string;
    description?: string;
}

export interface ServiceItem {
    nameKey: string;
    price: string;
    descriptionKey?: string;
}

export interface ServiceOrder {
    service: ServiceItem;
    email: string;
    description: string;
    files: File[];
}

export interface SubscriptionPackage {
    id: string;
    titleKey: string;
    descriptionKey: string;
    price: string;
    intervalKey: 'monthly_fee' | 'one_time_package';
    isPopular?: boolean;
}


export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'past_due' | 'canceled';

export interface Plan {
  id: string;
  nameKey: string;
  price: number;
  originalPrice?: number;
  intervalKey: string;
  priceNoteKey?: string;
  isPopular?: boolean;
  features: string[];
}

export interface Invoice {
  id: string;
  businessId: number;
  date: string;
  amount: number;
  status: 'paid' | 'open' | 'failed';
  pdfUrl: string;
}

export interface CVLink {
    name: string;
    url: string;
}

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export interface CVExperience {
    job_title: string;
    company: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    location: string;
    employment_type: EmploymentType;
    description: string;
    achievements: string[];
    tech_stack: string[];
    links: CVLink[];
}


export interface CVEducation {
    degree: string;
    institution: string;
    start_date: string;
    end_date: string;
}

export interface CVProject {
    name: string;
    description: string;
}

export interface CVCertification {
    name: string;
    issuer: string;
    date: string; 
}

export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
export interface CVLanguage {
    language: string;
    proficiency: Proficiency;
}

export interface CVAward {
    name: string;
    issuer: string;
    date: string;
}

export interface CVVolunteering {
    organization: string;
    role: string;
    date: string;
    description: string;
}
export interface CVInterest {
    name: string;
}

export interface CV {
    summary: string;
    experience: CVExperience[];
    education: CVEducation[];
    projects: CVProject[];
    skills: string[];
    languages: CVLanguage[];
    certifications: CVCertification[];
    awards?: CVAward[];
    volunteering?: CVVolunteering[];
    interests?: CVInterest[];
}


export interface Business {
  id: number;
  ownerId: number;
  nameKey: string;
  descriptionKey: string;
  categoryKey: string;
  logoUrl: string;
  coverImageUrl: string;
  rating: number;
  reviewCount: number;
  adCount: number;
  isVerified: boolean;
  phone: string;
  website: string;
  googleMapsUrl?: string;
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  tiktokUrl?: string;
  otherLinkUrl?: string;
  openingHours: { [key: string]: string };
  services: Service[];
  address: Address;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  establishedYear?: number;
  teamSize?: string;
  paymentMethods?: string[];
  spokenLanguages?: string[];
  companyMotto?: string;
  sustainabilityInfo?: string;
  certifications?: string[];
  otherLocations?: Address[];
  topReviewSnippetKey?: string;
  createdAt: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  planId?: string;
  cv?: CV;
}

export interface Ad {
  id: number;
  businessId: number;
  title: string;
  city: string;
  category: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video';
  coverImageUrl?: string;
  layoutTemplate?: 'single' | 'collage';
  tags: string[];
  isSponsored: boolean;
  discountPercentage?: number;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser?: boolean;
  startDate?: string;
  endDate?: string;
  structuredDescription: {
    benefit: string;
    features: string;
    solution: string;
  };
  callToAction?: {
    text: string;
    link: string;
  };
}

export enum PropertyStatus {
  ForSale = 'for_sale',
  ForRent = 'for_rent',
}

export enum PropertyType {
  House = 'house',
  Apartment = 'apartment',
}

export interface PropertyListing {
  id: number;
  businessId: number;
  title: string;
  address: Address;
  status: PropertyStatus;
  type: PropertyType;
  price: number;
  priceType?: 'kk' | 'von'; // kk = kosten koper, von = vrij op naam
  pricePerSqm?: number;
  availabilityStatus?: string;
  offeredSince?: string;
  livingArea: number; // in m²
  plotSize?: number; // in m², optional
  volume?: number; // in m³
  otherIndoorSpace?: number;
  buildingBoundOutdoorSpace?: number;
  totalRooms?: number;
  bedrooms: number;
  bathrooms: number;
  numberOfFloors?: number;
  bathroomFacilities?: string[];
  amenities?: string[];
  yearBuilt: number;
  constructionType?: string;
  roofType?: string;
  energyLabel: string;
  insulation?: string[];
  heating?: string[];
  certifications?: string[];
  description: string;
  photos: string[]; // URLs
}



export interface Comment {
    id: number;
    adId: number;
    postId: number;
    author: string;
    avatarUrl: string;
    text: string;
    date: string;
}

export interface Product {
  name: string;
  price: string;
}

export interface LiveChatMessage {
  type: 'user' | 'host' | 'system';
  message: string;
  author?: string;
  avatar?: string;
  productName?: string;
}

export interface JobCategory {
    id: string;
    translationKey: string;
}

export interface FreelancerService {
    nameKey: string;
    price?: string;
}

export interface Freelancer {
    id: number;
    ownerId?: number; // Link to user account
    nameKey: string;
    city: string;
    rating: number;
    reviewCount: number;
    specializationKey: string;
    profileImageUrl: string;
    aboutKey: string;
    services: FreelancerService[];
    portfolioImages: string[];
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    tiktokUrl?: string;
    website?: string;
    otherLinkUrl?: string;
    cv: CV;
}

export enum PostType {
    Text = 'text',
    Photo = 'photo',
    Video = 'video',
}

export interface Post {
    id: number;
    businessId: number;
    type: PostType;
    content: string;
    mediaUrl?: string; // for photo or video
    createdAt: string;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser?: boolean;
}

export interface PostWithBusiness extends Post {
    business: Business;
}


export interface AdWithBusiness extends Ad {
    business: Business;
}

export type ActivityType = 'comment' | 'like' | 'review' | 'ad_created';

export interface ActivityItem {
    id: number;
    type: ActivityType;
    text: string; // e.g., "Anna V. commented on your ad..."
    timestamp: string;
    relatedAdId?: number;
    relatedReviewId?: number;
}

export interface DashboardStats {
    profileViews: { value: number; change: number };
    adClicks: { value: number; change: number };
    newLikes: { value: number; change: number };
    recentActivities: ActivityItem[];
}

export interface AdAnalyticsData {
    adId: number;
    impressions: number;
    ctr: number; // Click-through rate
    engagementRate: number;
    trend: { date: string; views: number }[];
}


export enum Page {
    Home = 'home',
    Discover = 'discover',
    Deals = 'deals',
    Businesses = 'businesses',
    RealEstate = 'real_estate',
    Jobs = 'jobs',
    Wall = 'wall',
    FreelancerProfile = 'freelancer_profile',
    PropertyListing = 'property_listing',
    AddAd = 'add_ad',
    BusinessProfile = 'business_profile',
    Auth = 'auth',
    LiveStream = 'live_stream',
    Settings = 'settings',
    Saved = 'saved',
    Account = 'account',
    SubscriptionSuccess = 'subscription_success',
    Dashboard = 'dashboard',
    Reviews = 'reviews',
    Support = 'support',
    MarketingServices = 'marketing_services',
    RegistrationSuccess = 'registration_success',
    EditFreelancerCV = 'edit_freelancer_cv',
    BusinessRegistration = 'business_registration',
}

export enum FetchStatus {
    Idle = 'idle',
    Loading = 'loading',
    Success = 'success',
    Error = 'error',
}

export type Category = 
  'category_horeca' | 
  'category_retail' | 
  'category_beauty_wellness' |
  'category_health_medical' |
  'category_construction_trades' |
  'category_automotive' |
  'category_legal_financial' |
  'category_education' |
  'category_events_entertainment' |
  'category_home_garden' |
  'category_pets' |
  'category_sports_fitness' |
  'category_professional_services' |
  'category_real_estate' |
  'category_travel_tourism' |
  'category_it_technology' |
  'category_creative_arts' |
  'category_childcare' |
  'category_non_profit' |
  'category_transport_logistics' |
  'category_fashion' |
  'category_food_drink' |
  'category_doctors' |
  'category_dentists' |
  'category_physiotherapists' |
  'category_hairdressers' |
  'category_beauticians' |
  'category_personal_trainers' |
  'category_builders' |
  'category_plumbers' |
  'category_electricians' |
  'category_painters' |
  'category_carpenters' |
  'category_chefs' |
  'category_bakers' |
  'category_butchers' |
  'category_accountants' |
  'category_lawyers' |
  'category_consultants' |
  'category_cleaning_services' |
  'category_real_estate_agents' |
  'category_photographers' |
  'category_designers' |
  'category_mechanics' |
  'category_gardening_services' |
  'category_childminders' |
  'category_architects' |
  'category_catering' |
  'category_coaching' |
  'category_bicycle_shops' |
  'category_tutoring' |
  'category_interior_design' |
  'category_handyman_services' |
  'category_marketing_agencies' |
  'category_notaries' |
  'category_driving_schools' |
  'category_tattoo_artists' |
  'category_taxi_services' |
  'category_translators' |
  'category_moving_services' |
  'category_web_design' |
  'category_yoga_pilates' |
  'category_freelance_healthcare' |
  'category_galleries' |
  'category_theaters' |
  'category_dance_studios' |
  'category_hr_consultants' |
  'category_it_support' |
  'category_insurance_agents' |
  'category_car_washes' |
  'category_car_rental' |
  'category_pharmacies' |
  'category_chiropractors' |
  'category_home_care' |
  'category_pool_maintenance' |
  'category_pest_control' |
  'category_roofers' |
  'category_wineries' |
  'category_breweries' |
  'category_delicatessens' |
  'category_pet_grooming' |
  'category_storage_facilities' |
  'category_florists';
  
export type SortBy = 'default' | 'rating' | 'popularity' | 'newest' | 'alphabetical';