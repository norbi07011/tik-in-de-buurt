import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any; // Additional data for the notification
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  // Business notifications
  NEW_REVIEW = 'new_review',
  NEW_MESSAGE = 'new_message',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  AD_APPROVED = 'ad_approved',
  AD_REJECTED = 'ad_rejected',
  
  // User notifications  
  COMMENT_REPLY = 'comment_reply',
  BUSINESS_UPDATE = 'business_update',
  PROMOTION = 'promotion',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, read: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);