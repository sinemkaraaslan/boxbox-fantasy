const express = require('express');
const router = express.Router({ mergeParams: true }); 

const predictionController = require('../controllers/predictionController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { predictionRules } = require('../validators/predictionValidator');

router.use(authenticate);

router.post('/', predictionRules, validate, predictionController.create); 
router.get('/me', predictionController.getMine);
router.get('/', predictionController.getAll);

module.exports = router;