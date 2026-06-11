const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/dashboard', adminController.dashboard);

module.exports = router;
