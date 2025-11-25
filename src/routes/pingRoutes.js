const express = require('express');
const router = express.Router();
const { getPing } = require('../controllers/pingController');

// Public ping endpoint - lightweight and unrestricted
router.get('/', getPing);

module.exports = router;
