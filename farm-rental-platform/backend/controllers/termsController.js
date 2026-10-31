const asyncHandler = require('express-async-handler');
const { PLATFORM_TERMS } = require('../constants/platformTerms');

// @desc    Get the current RENTEX platform terms
// @route   GET /api/terms/platform
// @access  Public
const getPlatformTerms = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, terms: PLATFORM_TERMS });
});

module.exports = { getPlatformTerms };
