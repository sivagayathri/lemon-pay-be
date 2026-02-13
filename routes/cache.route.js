const express = require('express');
const router = express.Router();
const { clearCache } = require('../controllers/task.controller');
const auth = require('../middleware/auth');

router.post('/', auth, clearCache);

module.exports = router;
