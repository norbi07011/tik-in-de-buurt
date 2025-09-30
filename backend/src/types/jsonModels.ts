// JSON Storage interfaces for mock mode
export interface JsonUser {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string; // hashed
  userType: 'user' | 'business';
  phone?: string;
  businessId?: string;
  freelancerId?: string;
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  interests?: string[];
  languages?: string[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showLocation?: boolean;
      showBirthday?: boolean;
    };
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JsonBusiness {
  _id: string;
  name: string;
  description: string;
  category: string;
  ownerId: string;
  
  // Contact info
  phone: string;
  website: string;
  email: string;
  googleMapsUrl: string;
  
  // Address
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  
  // Legal info
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  
  // Arrays
  spokenLanguages: string[];
  paymentMethods: string[];
  
  // Social media
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    tiktok: string;
  };
  
  // System fields
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  logoUrl: string;
  coverImageUrl: string;
  services: any[];
  subscriptionStatus: string;
  
  createdAt: Date;
  updatedAt: Date;
}