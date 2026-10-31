const express = require('express');
const { getMachineHealth, updateMachineHealth } = require('../controllers/healthController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/:machineId', protect, getMachineHealth);
router.put('/:machineId', protect, authorize('owner'), updateMachineHealth);

module.exports = router;
