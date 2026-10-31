const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    pricingUnit: {
      type: String,
      enum: ['hour', 'day', 'acre'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    // --- Price breakdown (Feature Group 9 & 10) ---
    // Kept alongside the existing `totalPrice` (unchanged, still the authoritative
    // rental-only amount used by existing dashboards/reports) so nothing existing breaks.
    priceBreakdown: {
      rentalPrice: { type: Number, default: 0 },
      deliveryCharge: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      totalPayable: { type: Number, default: 0 }, // rentalPrice + deliveryCharge (deposit shown separately, refundable)
    },
    // --- Digital rental agreement snapshot (Feature Group 1) ---
    // Old bookings simply won't have this object (agreement.status stays 'not-applicable'
    // via the default below), so existing bookings remain valid and render safely.
    agreement: {
      agreementId: { type: String, default: null },
      platformTermsVersion: { type: Number, default: null },
      ownerTermsVersion: { type: Number, default: null },
      acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      acceptedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['not-applicable', 'accepted'],
        default: 'not-applicable',
      },
      // Full text snapshots captured at booking time - immutable historical record.
      platformTermsSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
      ownerTermsSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
      bookingSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    // --- Booking timeline (Feature Group 11 foundation) ---
    timeline: {
      type: [
        {
          status: { type: String, required: true },
          label: { type: String, default: '' },
          at: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

bookingSchema.index({ machine: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
