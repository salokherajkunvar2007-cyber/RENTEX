const express = require('express');
const { getPlatformTerms } = require('../controllers/termsController');

const router = express.Router();

router.get('/platform', getPlatformTerms);

module.exports = router;
