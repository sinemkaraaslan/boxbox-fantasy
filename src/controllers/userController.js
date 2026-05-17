const userService = require('../services/userService');
const predictionService = require('../services/predictionService');

/**
 * @swagger
 * /users/me/stats:
 *   get:
 *     summary: Kullanıcının istatistiklerini getir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toplam puan, tahmin sayısı, lig sayısı
 *       404: { description: Kullanıcı bulunamadı }
 */
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

/**
 * @swagger
 * /users/me/predictions:
 *   get:
 *     summary: Kullanıcının tüm tahminleri (lig ve yarış bilgisiyle)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Tahmin geçmişi }
 */
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