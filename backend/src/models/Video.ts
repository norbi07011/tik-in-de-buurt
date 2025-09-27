import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  authorId: mongoose.Types.ObjectId;
  authorType: 'user' | 'business';
  businessId?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  views: number;
  duration?: number; // in seconds
  tags: string[];
  isPromoted: boolean;
  isActive: boolean;
  metadata?: {
    fileSize?: number;
    format?: string;
    resolution?: string;
    fps?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnailUrl: String,
  authorId: {
    type: Schema.Types.ObjectId,
    refPath: 'authorType',
    required: true
  },
  authorType: {
    type: String,
    enum: ['user', 'business'],
    required: true
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business'
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    min: 0
  },
  tags: [String],
  isPromoted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    fileSize: Number,
    format: String,
    resolution: String,
    fps: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
videoSchema.index({ authorId: 1 });
videoSchema.index({ businessId: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ isPromoted: 1, isActive: 1 });
videoSchema.index({ tags: 1 });

// Text search index
videoSchema.index({ 
  title: 'text', 
  description: 'text',
  tags: 'text'
});

// Virtual for like count
videoSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Ensure virtual fields are serialized
videoSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IVideo>('Video', videoSchema);