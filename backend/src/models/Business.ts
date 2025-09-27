import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface IService {
  name: string;
  price?: string;
  description?: string;
}

export interface IBusiness extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  phone?: string;
  email?: string;
  website?: string;
  googleMapsUrl?: string;
  address: IAddress;
  services: IService[];
  paymentMethods: string[];
  spokenLanguages: string[];
  kvkNumber?: string;
  btwNumber?: string;
  iban?: string;
  subscriptionStatus: 'active' | 'inactive' | 'expired' | 'past_due' | 'canceled';
  subscriptionExpiresAt?: Date;
  planId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  postalCode: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, default: 'Netherlands' }
});

const serviceSchema = new Schema<IService>({
  name: { type: String, required: true },
  price: String,
  description: String
});

const businessSchema = new Schema<IBusiness>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Business description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  logoUrl: String,
  coverImageUrl: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  phone: String,
  email: String,
  website: String,
  googleMapsUrl: String,
  address: {
    type: addressSchema,
    required: true
  },
  services: [serviceSchema],
  paymentMethods: [String],
  spokenLanguages: [String],
  kvkNumber: String,
  btwNumber: String,
  iban: String,
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'past_due', 'canceled'],
    default: 'inactive'
  },
  subscriptionExpiresAt: Date,
  planId: String,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
    linkedin: String,
    tiktok: String
  }
}, {
  timestamps: true
});

// Indexes for performance
businessSchema.index({ ownerId: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ 'address.city': 1 });
businessSchema.index({ rating: -1 });
businessSchema.index({ createdAt: -1 });

// Text search index
businessSchema.index({ 
  name: 'text', 
  description: 'text',
  'services.name': 'text' 
});

export default mongoose.model<IBusiness>('Business', businessSchema);