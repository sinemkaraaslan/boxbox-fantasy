const express = require('express');
const router = express.Router();

const raceController = require('../controllers/raceController');
const authenticate = require('../middlewares/auth');

router.use(authenticate);

router.get('/', raceController.list);
router.get('/:id', raceController.detail);
router.post('/seed/:season', raceController.seed);
router.post('/:id/fetch-results', raceController.fetchResults);
router.post('/:id/calculate-points', raceController.calculatePoints);

module.exports = router;