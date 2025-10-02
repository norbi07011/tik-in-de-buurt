import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId; // ref: User
  businessId?: mongoose.Types.ObjectId; // ref: Business (optional)
  type: 'text' | 'image' | 'video';
  title: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: string; // image/jpeg, video/mp4, etc.
  tags?: string[];
  city?: string;
  likes: number;
  comments: number;
  views: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      index: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      required: [true, 'Post type is required'],
      default: 'text'
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    body: {
      type: String,
      trim: true,
      maxlength: [5000, 'Body cannot exceed 5000 characters']
    },
    mediaUrl: {
      type: String,
      trim: true
    },
    mediaType: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    city: {
      type: String,
      trim: true,
      index: true
    },
    likes: {
      type: Number,
      default: 0,
      min: 0
    },
    comments: {
      type: Number,
      default: 0,
      min: 0
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
postSchema.index({ createdAt: -1 }); // For sorting by newest
postSchema.index({ city: 1, createdAt: -1 }); // For city-based queries
postSchema.index({ authorId: 1, createdAt: -1 }); // For user's posts
postSchema.index({ businessId: 1, createdAt: -1 }); // For business posts

// Virtual for formatted date
postSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model<IPost>('Post', postSchema);

export default Post;
