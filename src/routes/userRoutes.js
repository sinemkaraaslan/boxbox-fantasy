const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/auth');

router.use(authenticate);
router.get('/me/stats', userController.getStats);
router.get('/me/predictions', userController.getMyPredictions);

module.exports = router;