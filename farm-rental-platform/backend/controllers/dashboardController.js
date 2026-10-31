const asyncHandler = require('express-async-handler');
const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const MachineHealth = require('../models/MachineHealth');

// @desc    Owner dashboard summary
// @route   GET /api/dashboard/owner
// @access  Private (owner)
const getOwnerDashboard = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  const totalMachines = await Machine.countDocuments({ owner: ownerId });
  const activeBookings = await Booking.countDocuments({
    owner: ownerId,
    status: 'approved',
  });

  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);

  const upcomingReturns = await Booking.find({
    owner: ownerId,
    status: 'approved',
    endDate: { $gte: now, $lte: in7Days },
  })
    .populate('machine', 'name')
    .populate('farmer', 'name phone')
    .sort({ endDate: 1 });

  const machines = await Machine.find({ owner: ownerId }).select('_id name');
  const machineIds = machines.map((m) => m._id);
  const healthRecords = await MachineHealth.find({ machine: { $in: machineIds } }).populate(
    'machine',
    'name'
  );

  const healthSummary = {
    healthy: healthRecords.filter((h) => h.status === 'healthy').length,
    dueSoon: healthRecords.filter((h) => h.status === 'due-soon').length,
    overdue: healthRecords.filter((h) => h.status === 'overdue').length,
  };

  const pendingRequests = await Booking.countDocuments({ owner: ownerId, status: 'pending' });

  res.status(200).json({
    success: true,
    stats: {
      totalMachines,
      activeBookings,
      pendingRequests,
      upcomingReturns,
      healthSummary,
      healthRecords,
    },
  });
});

// @desc    Farmer dashboard summary
// @route   GET /api/dashboard/farmer
// @access  Private (farmer)
const getFarmerDashboard = asyncHandler(async (req, res) => {
  const farmerId = req.user._id;

  const myBookings = await Booking.find({ farmer: farmerId })
    .populate('machine', 'name machineType photos pricing category')
    .populate('owner', 'name phone')
    .sort({ createdAt: -1 });

  const now = new Date();
  const upcomingRentals = myBookings.filter(
    (b) => b.status === 'approved' && new Date(b.startDate) >= now
  );
  const bookingHistory = myBookings.filter((b) =>
    ['completed', 'cancelled', 'rejected'].includes(b.status)
  );
  const activeCount = myBookings.filter((b) => b.status === 'approved').length;
  const pendingCount = myBookings.filter((b) => b.status === 'pending').length;

  res.status(200).json({
    success: true,
    stats: {
      totalBookings: myBookings.length,
      activeCount,
      pendingCount,
      upcomingRentals,
      bookingHistory,
      recentBookings: myBookings.slice(0, 10),
    },
  });
});

module.exports = { getOwnerDashboard, getFarmerDashboard };
