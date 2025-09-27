import mongoose, { Document, Schema } from 'mongoose';

// 📍 Location Interface
export interface ILocation extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    formatted?: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  radius?: number; // Service radius in kilometers
  placeId?: string; // Google Places ID
  verified: boolean;
  accuracy?: number; // Location accuracy in meters
  source: 'manual' | 'google_places' | 'user_input';
  metadata?: {
    timezone?: string;
    utcOffset?: number;
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// 📍 Location Schema
const LocationSchema = new Schema<ILocation>({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Netherlands' },
    formatted: { type: String }
  },
  coordinates: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  radius: {
    type: Number,
    min: 0,
    max: 100,
    default: 5 // 5km default service radius
  },
  placeId: {
    type: String,
    unique: true,
    sparse: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  accuracy: {
    type: Number,
    min: 0
  },
  source: {
    type: String,
    enum: ['manual', 'google_places', 'user_input'],
    default: 'user_input'
  },
  metadata: {
    timezone: String,
    utcOffset: Number,
    viewport: {
      northeast: {
        lat: { type: Number },
        lng: { type: Number }
      },
      southwest: {
        lat: { type: Number },
        lng: { type: Number }
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🗺️ Geospatial Index for location queries
LocationSchema.index({ coordinates: '2dsphere' });

// 🔍 Compound indexes for common queries
LocationSchema.index({ businessId: 1, verified: 1 });
LocationSchema.index({ 'address.city': 1, verified: 1 });
LocationSchema.index({ coordinates: '2dsphere', verified: 1 });

// 🧮 Virtual for formatted coordinates
LocationSchema.virtual('coordinatesString').get(function() {
  return `${this.coordinates.lat}, ${this.coordinates.lng}`;
});

// 📏 Static method to find nearby locations
LocationSchema.statics.findNearby = function(
  lat: number, 
  lng: number, 
  maxDistance: number = 10000, // meters
  limit: number = 50
) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON uses [lng, lat] order
        },
        $maxDistance: maxDistance
      }
    },
    verified: true
  }).limit(limit);
};

// 🔍 Static method to find within bounds
LocationSchema.statics.findWithinBounds = function(
  southwest: { lat: number; lng: number },
  northeast: { lat: number; lng: number }
) {
  return this.find({
    coordinates: {
      $geoWithin: {
        $box: [
          [southwest.lng, southwest.lat],
          [northeast.lng, northeast.lat]
        ]
      }
    },
    verified: true
  });
};

// 📍 Instance method to calculate distance to point
LocationSchema.methods.distanceTo = function(lat: number, lng: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.coordinates.lat) * Math.PI / 180;
  const dLng = (lng - this.coordinates.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.coordinates.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 🔒 Pre-save middleware
LocationSchema.pre('save', function(next) {
  // Generate formatted address if not provided
  if (!this.address.formatted) {
    this.address.formatted = `${this.address.street}, ${this.address.city} ${this.address.postalCode}, ${this.address.country}`;
  }
  
  next();
});

const Location = mongoose.model<ILocation>('Location', LocationSchema);

export default Location;