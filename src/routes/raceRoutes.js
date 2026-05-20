const express = require('express');
const router = express.Router();
const raceController = require('../controllers/raceController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { seedSeasonRules, raceIdRules, listRacesRules } = require('../validators/raceValidator');

router.use(authenticate);

router.get('/', listRacesRules, validate, raceController.list);
router.get('/:id', raceIdRules, validate, raceController.detail);
router.post('/seed/:season', seedSeasonRules, validate, raceController.seed);
router.post('/:id/fetch-results', raceIdRules, validate, raceController.fetchResults);
router.post('/:id/calculate-points', raceIdRules, validate, raceController.calculatePoints);

module.exports = router;