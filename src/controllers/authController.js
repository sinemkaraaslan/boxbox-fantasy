const authService = require('../services/authService');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: "sinem" }
 *               email:    { type: string, example: "sinem@test.com" }
 *               password: { type: string, example: "abc12345" }
 *     responses:
 *       201: { description: Kullanıcı oluşturuldu }
 *       400: { description: Validation hatası }
 */
async function register(req, res) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Giriş yap
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Token ve kullanıcı bilgisi }
 *       401: { description: Geçersiz email veya şifre }
 */
async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Mevcut kullanıcının profili
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profil }
 *       401: { description: Geçersiz token }
 *       404: { description: Kullanıcı bulunamadı }
 */
async function getMe(req, res) {
  try {
    const result = await authService.getUserProfile(req.user.id);
    res.json(result);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Profili güncelle
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               favoriteDriver: { type: string }
 *               favoriteTeam:   { type: string }
 *               bio:            { type: string }
 *               avatarUrl:      { type: string }
 *     responses:
 *       200: { description: Güncellenmiş profil }
 */
async function updateMe(req, res) {
  try {
    const result = await authService.updateUserProfile(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = { register, login, getMe, updateMe };