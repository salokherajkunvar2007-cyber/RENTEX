const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['booked', 'blocked'],
      default: 'booked',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
  },
  { _id: true }
);

const machineSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
    },
    machineType: {
      type: String,
      required: [true, 'Machine type is required'],
      trim: true,
      index: true,
    },
    category: {
  main: {
    type: String,
    enum: ['heavy', 'household'],
    required: true,
    index: true,
  },
  sub: {
    type: String,
    trim: true,
    default: '',
  },
},
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    pricing: {
      amount: { type: Number, required: [true, 'Rental price is required'] },
      unit: {
        type: String,
        enum: ['hour', 'day', 'acre'],
        default: 'day',
      },
    },
    location: {
      village: { type: String, required: true, trim: true, index: true },
      district: { type: String, required: true, trim: true, index: true },
      fullAddress: { type: String, trim: true, default: '' },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs-service'],
      default: 'good',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    availability: [availabilitySchema],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // --- Owner-defined rental terms (Feature Group 2) ---
    // Every field is optional/defaulted so machines created before this change
    // continue to load and save without any migration.
    rentalTerms: {
      minimumRentalDays: { type: Number, default: 1, min: 0 },
      maximumRentalDays: { type: Number, default: null, min: 0 },
      fuelResponsibility: {
        type: String,
        enum: ['owner', 'renter', 'shared'],
        default: 'renter',
      },
      operatorRequired: {
        type: String,
        enum: ['not-required', 'required', 'optional'],
        default: 'not-required',
      },
      deliveryAvailable: { type: Boolean, default: false },
      deliveryCharge: { type: Number, default: 0, min: 0 },
      pickupRequired: { type: Boolean, default: true },
      securityDeposit: { type: Number, default: 0, min: 0 },
      cancellationPolicy: {
        type: {
          type: String,
          enum: ['flexible', 'moderate', 'strict', 'custom'],
          default: 'moderate',
        },
        freeCancellationHours: { type: Number, default: 24, min: 0 },
        description: {
          type: String,
          trim: true,
          default:
            'Free cancellation up to 24 hours before the rental start. Cancellations within 24 hours may forfeit a portion of the rental price, at the owner\'s discretion.',
        },
      },
      damagePolicy: {
        type: String,
        trim: true,
        default:
          'The renter is responsible for any damage beyond normal wear and tear that occurs during the rental period. Damage will be assessed against the pre- and post-rental condition of the machine.',
      },
      usageRestrictions: {
        type: String,
        trim: true,
        default: '',
      },
      allowedUsage: {
        type: String,
        trim: true,
        default: '',
      },
      customTerms: {
        type: [String],
        default: [],
      },
      // Bumped by the owner whenever they materially change these terms, so that
      // agreements already accepted by renters (which store a snapshot) never
      // silently change out from under them.
      termsVersion: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

machineSchema.index({ 'location.village': 'text', 'location.district': 'text', name: 'text' });

module.exports = mongoose.model('Machine', machineSchema);
