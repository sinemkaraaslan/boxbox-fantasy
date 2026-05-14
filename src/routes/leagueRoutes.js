const express = require('express');
const router = express.Router();

const leagueController = require('../controllers/leagueController');
const authenticate = require('../middlewares/auth');

// Tüm routelar korumalı
router.use(authenticate);

router.post('/', leagueController.create);
router.get('/', leagueController.list);
router.post('/join', leagueController.join);
router.get('/:id', leagueController.detail);
router.delete('/:id', leagueController.remove);

module.exports = router;