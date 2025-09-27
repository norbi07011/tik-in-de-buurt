import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  userType: 'user' | 'business';
  phone?: string;
  businessId?: mongoose.Types.ObjectId;
  freelancerId?: mongoose.Types.ObjectId;
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
  emailVerifiedAt?: Date;
  passwordResetAt?: Date;
  isPhoneVerified?: boolean;
  phoneVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  userType: {
    type: String,
    enum: ['user', 'business'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business'
  },
  freelancerId: {
    type: Schema.Types.ObjectId,
    ref: 'Freelancer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String
  },
  coverImage: {
    type: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    trim: true
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+$/, 'Website must be a valid URL']
  },
  birthday: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        return !date || date < new Date();
      },
      message: 'Birthday cannot be in the future'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  interests: [{
    type: String,
    trim: true,
    maxlength: [50, 'Interest cannot exceed 50 characters']
  }],
  languages: [{
    type: String,
    trim: true,
    minlength: [2, 'Language code must be at least 2 characters'],
    maxlength: [10, 'Language code cannot exceed 10 characters']
  }],
  socialLinks: {
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.+$/, 'Invalid Facebook URL']
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?instagram\.com\/.+$/, 'Invalid Instagram URL']
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+$/, 'Invalid Twitter/X URL']
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.+$/, 'Invalid LinkedIn URL']
    },
    tiktok: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?tiktok\.com\/.+$/, 'Invalid TikTok URL']
    },
    youtube: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?youtube\.com\/.+$/, 'Invalid YouTube URL']
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'pl',
      minlength: [2, 'Language code must be at least 2 characters'],
      maxlength: [10, 'Language code cannot exceed 10 characters']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      },
      showLocation: {
        type: Boolean,
        default: true
      },
      showBirthday: {
        type: Boolean,
        default: false
      }
    }
  },
  lastLogin: {
    type: Date
  },
  emailVerifiedAt: {
    type: Date
  },
  passwordResetAt: {
    type: Date
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);