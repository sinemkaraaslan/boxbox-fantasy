const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { registerRules, loginRules, updateProfileRules } = require('../validators/authValidator');

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);

router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, updateProfileRules, validate, authController.updateMe);

module.exports = router;