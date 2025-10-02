export type Id = string;

export interface User {
  _id: Id;          // kanoniczne ID (Mongo / API)
  id: Id;           // always present - aliased to _id
  email: string;
  name: string;
  businessId?: Id;  // zawsze string w całej appce
  userType?: 'user' | 'business';
  phone?: string;
  freelancerId?: Id;
  isVerified?: boolean;
  isActive?: boolean;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: string;
  // Extended properties for compatibility
  createdAt?: string;
  updatedAt?: string;
  interests?: string[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
  };
  // EditProfile compatibility
  firstName?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  languages?: string[];
  preferences?: {
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showLocation?: boolean;
      showBirthday?: boolean;
    };
  };
}