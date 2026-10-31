const mongoose = require('mongoose');

const machineHealthSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: true,
      unique: true,
    },
    lastServiceDate: {
      type: Date,
      default: null,
    },
    nextMaintenanceDate: {
      type: Date,
      default: null,
    },
    engineHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    fuelUsage: {
      type: Number,
      default: 0,
      min: 0,
      // liters consumed since last service
    },
    mechanicName: {
      type: String,
      trim: true,
      default: '',
    },
    mechanicMobile: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['healthy', 'due-soon', 'overdue'],
      default: 'healthy',
    },
  },
  { timestamps: true }
);

machineHealthSchema.pre('save', function computeStatus(next) {
  if (this.nextMaintenanceDate) {
    const today = new Date();
    const daysUntil = Math.ceil(
      (this.nextMaintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) this.status = 'overdue';
    else if (daysUntil <= 7) this.status = 'due-soon';
    else this.status = 'healthy';
  }
  next();
});

module.exports = mongoose.model('MachineHealth', machineHealthSchema);
