const leagueService = require('../services/leagueService');

/**
 * @swagger
 * /leagues:
 *   post:
 *     summary: Yeni lig oluştur
 *     tags: [Leagues]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               isPublic:    { type: boolean }
 *               season:      { type: integer }
 *     responses:
 *       201: { description: Lig oluşturuldu }
 */
async function create(req, res) {
  try {
    const league = await leagueService.createLeague(req.user.id, req.body);
    res.status(201).json(league);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * @swagger
 * /leagues:
 *   get:
 *     summary: Kullanıcının üye olduğu lig listesi
 *     tags: [Leagues]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lig listesi }
 */
async function list(req, res) {
  try {
    const leagues = await leagueService.getUserLeagues(req.user.id);
    res.json(leagues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /leagues/{id}:
 *   get:
 *     summary: Lig detayı
 *     tags: [Leagues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lig detayı }
 *       403: { description: Erişim yetkin yok }
 *       404: { description: Lig bulunamadı }
 */
async function detail(req, res) {
  try {
    const league = await leagueService.getLeagueById(req.params.id, req.user.id);
    res.json(league);
  } catch (err) {
    if (err.message === 'LEAGUE_NOT_FOUND') {
      return res.status(404).json({ error: 'Lig bulunamadı' });
    }
    if (err.message === 'ACCESS_DENIED') {
      return res.status(403).json({ error: 'Bu lige erişim yetkin yok' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /leagues/join:
 *   post:
 *     summary: Davet kodu ile lige katıl
 *     tags: [Leagues]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inviteCode]
 *             properties:
 *               inviteCode: { type: string }
 *     responses:
 *       201: { description: Katılım başarılı }
 *       404: { description: Geçersiz davet kodu }
 *       409: { description: Zaten üye }
 */
async function join(req, res) {
  try {
    const league = await leagueService.joinLeague(req.user.id, req.body.inviteCode);
    res.status(201).json({
      message: 'Lige başarıyla katıldın',
      league: { id: league.id, name: league.name }
    });
  } catch (err) {
    if (err.message === 'INVITE_CODE_REQUIRED') {
      return res.status(400).json({ error: 'Davet kodu gerekli' });
    }
    if (err.message === 'INVALID_INVITE_CODE') {
      return res.status(404).json({ error: 'Geçersiz davet kodu' });
    }
    if (err.message === 'ALREADY_MEMBER') {
      return res.status(409).json({ error: 'Bu lige zaten üyesin' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /leagues/{id}:
 *   delete:
 *     summary: Ligi sil (sadece owner)
 *     tags: [Leagues]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200: { description: Silindi }
 *       403: { description: Sadece owner silebilir }
 *       404: { description: Lig bulunamadı }
 */
async function remove(req, res) {
  try {
    await leagueService.deleteLeague(req.params.id, req.user.id);
    res.json({ message: 'Lig silindi' });
  } catch (err) {
    if (err.message === 'LEAGUE_NOT_FOUND') {
      return res.status(404).json({ error: 'Lig bulunamadı' });
    }
    if (err.message === 'NOT_OWNER') {
      return res.status(403).json({ error: 'Sadece lig sahibi silebilir' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { create, list, detail, join, remove };