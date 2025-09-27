import mongoose from 'mongoose';

export interface IConversation extends mongoose.Document {
  participants: string[]; // Array of user IDs
  type: ConversationType;
  businessId?: string; // For business-customer conversations
  title?: string; // Group/conversation title
  description?: string; // Group/conversation description
  lastMessage?: string;
  lastMessageAt: Date;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends mongoose.Document {
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  read: boolean;
  readAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  BUSINESS_CUSTOMER = 'business_customer',
  USER_USER = 'user_user',
  GROUP = 'group'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file'
}

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: String,
    required: true
  }],
  type: {
    type: String,
    enum: Object.values(ConversationType),
    required: true
  },
  businessId: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: false,
    maxlength: 100
  },
  description: {
    type: String,
    required: false,
    maxlength: 500
  },
  lastMessage: {
    type: String,
    maxlength: 200
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT
  },
  mediaUrl: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    required: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);