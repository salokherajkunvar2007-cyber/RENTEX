const asyncHandler = require('express-async-handler');
const Machine = require('../models/Machine');
const MachineHealth = require('../models/MachineHealth');

// @desc    Get health record for a machine
// @route   GET /api/health/:machineId
// @access  Private
const getMachineHealth = asyncHandler(async (req, res) => {
  const health = await MachineHealth.findOne({ machine: req.params.machineId });

  if (!health) {
    res.status(404);
    throw new Error('Health record not found for this machine');
  }

  res.status(200).json({ success: true, health });
});

// @desc    Update health record for a machine
// @route   PUT /api/health/:machineId
// @access  Private (owner of the machine)
const updateMachineHealth = asyncHandler(async (req, res) => {
  const machine = await Machine.findById(req.params.machineId);
  if (!machine) {
    res.status(404);
    throw new Error('Machine not found');
  }

  if (machine.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this machine health record');
  }

  const {
    lastServiceDate,
    nextMaintenanceDate,
    engineHours,
    fuelUsage,
    mechanicName,
    mechanicMobile,
  } = req.body;

  let health = await MachineHealth.findOne({ machine: machine._id });
  if (!health) {
    health = new MachineHealth({ machine: machine._id });
  }

  if (lastServiceDate !== undefined) health.lastServiceDate = lastServiceDate;
  if (nextMaintenanceDate !== undefined) health.nextMaintenanceDate = nextMaintenanceDate;
  if (engineHours !== undefined) health.engineHours = engineHours;
  if (fuelUsage !== undefined) health.fuelUsage = fuelUsage;
  if (mechanicName !== undefined) health.mechanicName = mechanicName;
  if (mechanicMobile !== undefined) health.mechanicMobile = mechanicMobile;

  const updated = await health.save();
  res.status(200).json({ success: true, health: updated });
});

module.exports = { getMachineHealth, updateMachineHealth };
