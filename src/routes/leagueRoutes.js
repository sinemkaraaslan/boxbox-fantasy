const express = require('express');
const router = express.Router();

const leagueController = require('../controllers/leagueController');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createLeagueRules, joinLeagueRules } = require('../validators/leagueValidator');

// Tüm routelar korumalı
router.use(authenticate);

router.post('/', createLeagueRules, validate, leagueController.create);
router.get('/', leagueController.list);
router.post('/join', joinLeagueRules, validate, leagueController.join); 
router.get('/:id', leagueController.detail);
router.delete('/:id', leagueController.remove);
router.get('/:id/standings', leagueController.standings);

module.exports = router;