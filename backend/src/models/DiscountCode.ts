import mongoose from 'mongoose';

// Discount Code Schema
const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxLength: 20
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'free_year', 'free_lifetime'],
    default: 'percentage'
  },
  value: {
    type: Number,
    required: function(this: { type: string }) { return this.type === 'percentage'; },
    min: 0,
    max: 100
  },
  description: {
    type: String,
    required: true,
    maxLength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null // null = unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null // null = no expiry
  },
  applicablePlans: [{
    type: String,
    enum: ['basic', 'pro', 'enterprise', 'all'],
    default: 'all'
  }],
  createdBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  usedBy: [{
    businessId: String,
    usedAt: { type: Date, default: Date.now },
    originalPrice: Number,
    discountApplied: Number,
    finalPrice: Number
  }],
  metadata: {
    campaignName: String,
    notes: String,
    internalReference: String
  }
}, {
  timestamps: true
});

// Indexes for performance
discountCodeSchema.index({ isActive: 1 });
discountCodeSchema.index({ validFrom: 1, validUntil: 1 });

// Methods
discountCodeSchema.methods.isValid = function() {
  const now = new Date();
  
  // Check if code is active
  if (!this.isActive) return { valid: false, reason: 'Code is inactive' };
  
  // Check date validity
  if (this.validFrom && this.validFrom > now) {
    return { valid: false, reason: 'Code not yet valid' };
  }
  
  if (this.validUntil && this.validUntil < now) {
    return { valid: false, reason: 'Code has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: 'Code usage limit reached' };
  }
  
  return { valid: true };
};

discountCodeSchema.methods.canBeUsedForPlan = function(planId: string) {
  return this.applicablePlans.includes('all') || this.applicablePlans.includes(planId);
};

discountCodeSchema.methods.calculateDiscount = function(originalPrice: number) {
  const validation = this.isValid();
  if (!validation.valid) {
    return { error: validation.reason };
  }
  
  switch (this.type) {
    case 'percentage':
      const discountAmount = (originalPrice * this.value) / 100;
      return {
        type: 'percentage',
        discountPercent: this.value,
        discountAmount: discountAmount,
        finalPrice: originalPrice - discountAmount
      };
      
    case 'free_year':
      return {
        type: 'free_year',
        discountPercent: 100,
        discountAmount: originalPrice,
        finalPrice: 0,
        freeMonths: 12
      };
      
    case 'free_lifetime':
      return {
        type: 'free_lifetime',
        discountPercent: 100,
        discountAmount: originalPrice,
        finalPrice: 0,
        freeMonths: null // lifetime
      };
      
    default:
      return { error: 'Invalid discount type' };
  }
};

discountCodeSchema.methods.markAsUsed = function(businessId: string, originalPrice: number, discountApplied: number, finalPrice: number) {
  this.usageCount += 1;
  this.usedBy.push({
    businessId,
    usedAt: new Date(),
    originalPrice,
    discountApplied,
    finalPrice
  });
  return this.save();
};

// TypeScript interfaces
interface IDiscountCode extends mongoose.Document {
  code: string;
  type: 'percentage' | 'free_year' | 'free_lifetime';
  value?: number;
  description: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  validFrom: Date;
  validUntil?: Date | null;
  applicablePlans: string[];
  createdBy: string;
  usedBy: Array<{
    businessId: string;
    usedAt: Date;
    originalPrice: number;
    discountApplied: number;
    finalPrice: number;
  }>;
  metadata?: {
    campaignName?: string;
    notes?: string;
    internalReference?: string;
  };
  
  // Methods
  isValid(): { valid: boolean; reason?: string };
  canBeUsedForPlan(planId: string): boolean;
  calculateDiscount(originalPrice: number): any;
  markAsUsed(businessId: string, originalPrice: number, discountApplied: number, finalPrice: number): Promise<IDiscountCode>;
}

interface DiscountCodeModel extends mongoose.Model<IDiscountCode> {
  findValidCode(code: string): Promise<IDiscountCode | null>;
  createAdminCode(codeData: Partial<IDiscountCode>): Promise<IDiscountCode>;
}

// Static methods
discountCodeSchema.statics.findValidCode = function(code: string) {
  return this.findOne({ 
    code: code.toUpperCase(), 
    isActive: true 
  });
};

discountCodeSchema.statics.createAdminCode = function(codeData: Partial<IDiscountCode>) {
  return this.create({
    ...codeData,
    code: codeData.code?.toUpperCase(),
    createdBy: 'admin',
    validUntil: codeData.validUntil || null
  });
};

const DiscountCode = mongoose.model<IDiscountCode, DiscountCodeModel>('DiscountCode', discountCodeSchema);

export default DiscountCode;