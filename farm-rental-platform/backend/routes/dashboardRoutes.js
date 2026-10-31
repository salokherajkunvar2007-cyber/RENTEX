const express = require('express');
const { getOwnerDashboard, getFarmerDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/owner', protect, authorize('owner'), getOwnerDashboard);
router.get('/user', protect, authorize('user'), getFarmerDashboard);

module.exports = router;
