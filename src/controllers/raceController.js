const raceService = require('../services/raceService');
const predictionService = require('../services/predictionService');

/**
 * @swagger
 * /races:
 *   get:
 *     summary: Yarışları listele
 *     tags: [Races]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: season
 *         schema: { type: integer }
 *         description: Sezona göre filtrele
 *     responses:
 *       200: { description: Yarış listesi }
 */
async function list(req, res) {
  try{
    const season = req.query.season ? parseInt(req.query.season) : null;
    const races = await raceService.listRaces(season);
    res.json(races);
  }catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /races/{id}:
 *   get:
 *     summary: Yarış detayı
 *     tags: [Races]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Yarış detayı }
 *       404: { description: Yarış bulunamadı }
 */
async function detail(req, res) {
  try {
    const race = await raceService.getRaceById(req.params.id);
    res.json(race);
  } catch (err) {
    if (err.message === 'RACE_NOT_FOUND') {
      return res.status(404).json({ error: 'Yarış bulunamadı' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /races/seed/{season}:
 *   post:
 *     summary: Bir sezonun yarış takvimini Jolpica'dan çek
 *     tags: [Races]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: season
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Sezon yüklendi }
 *       400: { description: Geçersiz sezon }
 */
async function seed(req, res) {
  try{
    const season = parseInt(req.params.season);
    const result = await raceService.seedSeason(season);
    res.json({ message: `${season} sezonu yüklendi`, ...result });
  } catch(err) {
    if (err.message === 'INVALID_SEASON') {
      return res.status(400).json({ error: 'Geçersiz sezon' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /races/{id}/fetch-results:
 *   post:
 *     summary: Yarışın sonuçlarını Jolpica'dan çek
 *     tags: [Races]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Sonuçlar kaydedildi }
 *       404: { description: Yarış bulunamadı }
 *       409: { description: Yarış zaten sonuçlandırılmış }
 */
async function fetchResults(req, res) {
  try{
    const race = await raceService.fetchAndSaveResults(req.params.id);
    res.json({ message: 'Sonuçlar başarıyla kaydedildi', race });
  }catch(err) {
    if (err.message === 'RACE_NOT_FOUND') {
      return res.status(404).json({ error: 'Yarış bulunamadı' });
    }
    if (err.message === 'ALREADY_COMPLETED') {
      return res.status(409).json({ error: 'Yarış zaten sonuçlanmış' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /races/{id}/calculate-points:
 *   post:
 *     summary: Yarıştaki tüm tahminleri puanla
 *     tags: [Races]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Puanlar hesaplandı }
 *       400: { description: Yarış henüz sonuçlanmamış }
 *       404: { description: Yarış bulunamadı }
 */
async function calculatePoints(req,res) {
    try{
      const result = await predictionService.calculateRacePoints(req.params.id);
      res.json({ message: 'Puanlar hesaplandı', ...result });
    } catch(err) {
      if (err.message === 'RACE_NOT_FOUND') {
        return res.status(404).json({ error: 'Yarış bulunamadı' });
      }
      if (err.message === 'RACE_NOT_COMPLETED') {
        return res.status(400).json({ error: 'Yarış henüz sonuçlanmamış' });
      }
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }

module.exports = { list, detail, seed, fetchResults, calculatePoints };