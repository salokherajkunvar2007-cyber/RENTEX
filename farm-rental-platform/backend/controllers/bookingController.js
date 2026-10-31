const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { PLATFORM_TERMS_VERSION, PLATFORM_TERMS } = require('../constants/platformTerms');

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

const calculateTotalPrice = (start, end, amount, unit) => {
  const diffMs = end.getTime() - start.getTime();
  if (unit === 'hour') {
    const hours = Math.max(1, Math.ceil(diffMs / MS_PER_HOUR));
    return hours * amount;
  }
  // 'day' and 'acre' are both billed per-day for the rental duration
  const days = Math.max(1, Math.ceil(diffMs / MS_PER_DAY));
  return days * amount;
};

const calculateDurationDays = (start, end) =>
  Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && bStart <= aEnd;

// Timeline labels shown to users; kept in one place so the visual timeline
// (Feature Group 11, built in a later phase) has consistent, friendly text to read from.
const TIMELINE_LABELS = {
  pending: 'Booking requested',
  'agreement-accepted': 'Agreement accepted',
  approved: 'Owner approved',
  rejected: 'Owner rejected',
  cancelled: 'Booking cancelled',
  completed: 'Rental completed',
};

const pushTimelineEvent = (booking, status) => {
  booking.timeline = booking.timeline || [];
  booking.timeline.push({ status, label: TIMELINE_LABELS[status] || status, at: new Date() });
};

// @desc    Create a booking request
// @route   POST /api/bookings
// @access  Private (farmer)
const createBooking = asyncHandler(async (req, res) => {
  const { machineId, startDate, endDate, notes, requestDelivery, agreementAccepted } = req.body;

  if (!machineId || !startDate || !endDate) {
    res.status(400);
    throw new Error('Machine, start date, and end date are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    res.status(400);
    throw new Error('Invalid date range');
  }

  const machine = await Machine.findById(machineId).populate('owner', 'name phone email');
  if (!machine || !machine.isActive) {
    res.status(404);
    throw new Error('Machine not found or unavailable');
  }

  if (machine.owner._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot book your own machine');
  }

  // The digital rental agreement must be explicitly accepted server-side —
  // the frontend checkbox alone is never trusted.
  if (agreementAccepted !== true && agreementAccepted !== 'true') {
    res.status(400);
    throw new Error('You must read and accept the rental agreement before booking');
  }

  // Prevent double booking: check against existing booked/blocked slots
  const conflict = machine.availability.some((slot) =>
    rangesOverlap(start, end, new Date(slot.startDate), new Date(slot.endDate))
  );

  if (conflict) {
    res.status(409);
    throw new Error('Machine is already booked for the selected dates');
  }

  const rentalTerms = machine.rentalTerms || {};
  const durationDays = calculateDurationDays(start, end);

  // Enforce owner-configured min/max rental duration server-side.
  if (rentalTerms.minimumRentalDays && durationDays < rentalTerms.minimumRentalDays) {
    res.status(400);
    throw new Error(`This machine requires a minimum rental of ${rentalTerms.minimumRentalDays} day(s)`);
  }
  if (rentalTerms.maximumRentalDays && durationDays > rentalTerms.maximumRentalDays) {
    res.status(400);
    throw new Error(`This machine allows a maximum rental of ${rentalTerms.maximumRentalDays} day(s)`);
  }

  const rentalPrice = calculateTotalPrice(start, end, machine.pricing.amount, machine.pricing.unit);
  const wantsDelivery = Boolean(rentalTerms.deliveryAvailable) && (requestDelivery === true || requestDelivery === 'true');
  const deliveryCharge = wantsDelivery ? Number(rentalTerms.deliveryCharge || 0) : 0;
  const securityDeposit = Number(rentalTerms.securityDeposit || 0);
  const totalPayable = rentalPrice + deliveryCharge; // deposit shown/handled separately — see priceBreakdown

  // Backward-compatible: totalPrice keeps meaning "rental cost" exactly as before,
  // so any existing code/reports reading it are unaffected.
  const totalPrice = rentalPrice;

  const agreementId = crypto.randomUUID();
  const acceptedAt = new Date();

  const booking = new Booking({
    machine: machine._id,
    owner: machine.owner._id,
    farmer: req.user._id,
    startDate: start,
    endDate: end,
    totalPrice,
    pricingUnit: machine.pricing.unit,
    notes: notes || '',
    status: 'pending',
    priceBreakdown: {
      rentalPrice,
      deliveryCharge,
      securityDeposit,
      totalPayable,
    },
    agreement: {
      agreementId,
      platformTermsVersion: PLATFORM_TERMS_VERSION,
      ownerTermsVersion: rentalTerms.termsVersion || 1,
      acceptedBy: req.user._id,
      acceptedAt,
      status: 'accepted',
      platformTermsSnapshot: PLATFORM_TERMS,
      ownerTermsSnapshot: rentalTerms.toObject ? rentalTerms.toObject() : rentalTerms,
      bookingSnapshot: {
        machineName: machine.name,
        machineType: machine.machineType,
        brand: machine.brand,
        ownerName: machine.owner.name,
        ownerPhone: machine.owner.phone,
        renterName: req.user.name,
        renterPhone: req.user.phone,
        startDate: start,
        endDate: end,
        durationDays,
        pricingUnit: machine.pricing.unit,
        rentalPrice,
        deliveryCharge,
        securityDeposit,
        totalPayable,
      },
    },
  });

  pushTimelineEvent(booking, 'pending');
  pushTimelineEvent(booking, 'agreement-accepted');

  await booking.save();

  // Reserve a tentative slot immediately so overlapping requests can't both be created;
  // it's removed if the owner rejects, or remains as "booked" once approved.
  machine.availability.push({
    startDate: start,
    endDate: end,
    status: 'booked',
    booking: booking._id,
  });
  await machine.save();

  await Notification.create({
    user: machine.owner._id,
    type: 'booking-request',
    title: 'New booking request',
    message: `${req.user.name} requested to book "${machine.name}" from ${start.toDateString()} to ${end.toDateString()}.`,
    relatedBooking: booking._id,
    relatedMachine: machine._id,
  });

  res.status(201).json({ success: true, booking });
});

// @desc    Get bookings for the logged-in user (as farmer or owner)
// @route   GET /api/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
  const { status, role } = req.query;

  const query = {};
  if (role === 'owner') {
    query.owner = req.user._id;
  } else if (role === 'farmer') {
    query.farmer = req.user._id;
  } else {
    query.$or = [{ owner: req.user._id }, { farmer: req.user._id }];
  }

  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('machine', 'name machineType photos pricing location')
    .populate('farmer', 'name phone village district')
    .populate('owner', 'name phone village district')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: bookings.length, bookings });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (owner or farmer on the booking)
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('machine')
    .populate('farmer', 'name phone village district')
    .populate('owner', 'name phone village district');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const isParty =
    booking.owner._id.toString() === req.user._id.toString() ||
    booking.farmer._id.toString() === req.user._id.toString();

  if (!isParty) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.status(200).json({ success: true, booking });
});

// @desc    Update booking status (approve/reject/cancel/complete)
// @route   PUT /api/bookings/:id
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['approved', 'rejected', 'cancelled', 'completed'];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const machine = await Machine.findById(booking.machine);
  const isOwner = booking.owner.toString() === req.user._id.toString();
  const isFarmer = booking.farmer.toString() === req.user._id.toString();

  if (!isOwner && !isFarmer) {
    res.status(403);
    throw new Error('Not authorized to update this booking');
  }

  if (['approved', 'rejected'].includes(status) && !isOwner) {
    res.status(403);
    throw new Error('Only the machine owner can approve or reject a booking');
  }

  if (status === 'cancelled' && !isFarmer && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  if (booking.status !== 'pending' && ['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error(`Booking is already ${booking.status} and cannot be changed`);
  }

  const previousStatus = booking.status;
  booking.status = status;
  pushTimelineEvent(booking, status);
  await booking.save();

  // Free up the calendar slot when a booking is rejected or cancelled
  if (machine && ['rejected', 'cancelled'].includes(status)) {
    machine.availability = machine.availability.filter(
      (slot) => slot.booking?.toString() !== booking._id.toString()
    );
    await machine.save();
  }

  const notifyUser = isOwner ? booking.farmer : booking.owner;
  const typeMap = {
    approved: 'booking-approved',
    rejected: 'booking-rejected',
    cancelled: 'booking-cancelled',
    completed: 'general',
  };
  const messageMap = {
    approved: 'Your booking request has been approved.',
    rejected: 'Your booking request has been rejected.',
    cancelled: 'A booking has been cancelled.',
    completed: 'A booking has been marked as completed.',
  };

  await Notification.create({
    user: notifyUser,
    type: typeMap[status],
    title: `Booking ${status}`,
    message: messageMap[status],
    relatedBooking: booking._id,
    relatedMachine: booking.machine,
  });

  res.status(200).json({ success: true, booking, previousStatus });
});

// @desc    Delete/cancel a booking (farmer only, pending bookings)
// @route   DELETE /api/bookings/:id
// @access  Private (farmer who created it)
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this booking');
  }

  if (!['pending', 'approved'].includes(booking.status)) {
    res.status(400);
    throw new Error('Only pending or approved bookings can be cancelled');
  }

  booking.status = 'cancelled';
  pushTimelineEvent(booking, 'cancelled');
  await booking.save();

  const machine = await Machine.findById(booking.machine);
  if (machine) {
    machine.availability = machine.availability.filter(
      (slot) => slot.booking?.toString() !== booking._id.toString()
    );
    await machine.save();
  }

  await Notification.create({
    user: booking.owner,
    type: 'booking-cancelled',
    title: 'Booking cancelled',
    message: 'The farmer has cancelled their booking request.',
    relatedBooking: booking._id,
    relatedMachine: booking.machine,
  });

  res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
});

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
};
