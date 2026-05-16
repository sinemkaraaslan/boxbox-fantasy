const userService = require('../services/userService');
const predictionService = require('../services/predictionService');

async function getStats(req, res) {
  try{
    const stats = await userService.getUserStats(req.user.id);
    res.json(stats);
  }catch(err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getMyPredictions(req, res) {
  try{
    const predictions = await predictionService.getUserAllPredictions(req.user.id);
    res.json(predictions);
  }catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStats, getMyPredictions };