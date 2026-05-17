const predictionService = require('../services/predictionService');

//service hatalarını HTTP'ye çeviriyor
function handleError(err, res) {
  const errorMap = {
    'LEAGUE_NOT_FOUND': [404, 'Lig bulunamadı'],
    'RACE_NOT_FOUND': [404, 'Yarış bulunamadı'],
    'PREDICTION_NOT_FOUND': [404, 'Tahmin bulunamadı'],
    'NOT_LEAGUE_MEMBER': [403, 'Bu lige üye değilsin'],
    'NOT_OWNER': [403, 'Sadece kendi tahminini değiştirebilirsin'],
    'PREDICTION_CLOSED': [403, 'Tahmin süresi kapandı'],
    'PREDICTIONS_LOCKED': [403, 'Diğer tahminler yarış kilitlenmeden gösterilemez'],
    'ALREADY_PREDICTED': [409, 'Bu yarış için zaten tahmin yapmışsın'],
    'RACE_NOT_COMPLETED': [400, 'Yarış henüz sonuçlanmamış']
  };

  const mapping = errorMap[err.message];
  if(mapping) {
    return res.status(mapping[0]).json({ error: mapping[1] });
  }
  console.error(err);
  res.status(500).json({ error: err.message });
}

/**
 * @swagger
 * /leagues/{leagueId}/races/{raceId}/predictions:
 *   post:
 *     summary: Yeni tahmin
 *     tags: [Predictions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tahmin oluşturuldu }
 */
async function create(req, res) {
  try {
    const { leagueId, raceId } = req.params;
    const prediction = await predictionService.createPrediction(req.user.id, leagueId, raceId, req.body);
    res.status(201).json(prediction);
  } catch(err){
    handleError(err,res);
  }
}

/**
 * @swagger
 * /leagues/{leagueId}/races/{raceId}/predictions/me:
 *   get:
 *     summary: Bu yarış için kendi tahminim
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: raceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Tahmin detayları }
 *       404: { description: Tahmin yok }
 */
async function getMine(req,res) {
  try {
    const { leagueId, raceId } = req.params;
    const prediction = await predictionService.getMyPrediction(req.user.id, leagueId, raceId);
    res.json(prediction);
  } catch(err){
    handleError(err,res);
  }
}

async function getAll(req,res) {
  try {
    const { leagueId, raceId } = req.params;
    const predictions = await predictionService.getRacePredictions(req.user.id, leagueId, raceId);
    res.json(predictions);
  } catch (err) {
    handleError(err,res);
  }
}

/**
 * @swagger
 * /predictions/{id}:
 *   put:
 *     summary: Tahmini güncelle (lock kapanmadan)
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Güncellendi }
 *       403: { description: Sahibi değilsin veya kilit kapandı }
 *       404: { description: Tahmin bulunamadı }
 */
async function update(req,res) {
  try {
    const prediction = await predictionService.updatePrediction(req.params.id, req.user.id, req.body);
    res.json(prediction);
  } catch(err) {
    handleError(err, res);
  }
}


/**
 * @swagger
 * /predictions/{id}:
 *   delete:
 *     summary: Tahmini sil (lock kapanmadan)
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Silindi }
 *       403: { description: Sahibi değilsin }
 *       404: { description: Bulunamadı }
 */
async function remove(req,res) {
  try {
    await predictionService.deletePrediction(req.params.id, req.user.id);
    res.json({ message: 'Tahmin silindi' });
  } catch(err) {
    handleError(err,res);
  }
}

async function getUserAll(req,res) {
  try {
    const predictions = await predictionService.getUserAllPredictions(req.user.id);
    res.json(predictions);
  } catch (err) {
    handleError(err, res);
  }
}

async function calculatePoints(req,res) {
  try {
    const result = await predictionService.calculateRacePoints(req.params.id);
    res.json({ message: 'Puanlar hesaplandı', ...result });
  } catch(err) {
    handleError(err,res);
  }
}

module.exports = { create, getMine, getAll, update, remove, getUserAll, calculatePoints };