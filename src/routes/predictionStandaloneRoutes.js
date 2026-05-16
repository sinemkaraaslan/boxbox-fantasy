const express = require('express');
const router = express.Router();

const predictionController = require('../controllers/predictionController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updatePredictionRules } = require('../validators/predictionValidator');

router.use(authenticate);

router.put('/:id', predictionController.update);
router.delete('/:id', predictionController.remove);

module.exports = router;