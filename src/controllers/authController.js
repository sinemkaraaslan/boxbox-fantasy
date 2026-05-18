const authService = require('../services/authService');

// Cookie ayarları 
const COOKIE_OPTIONS = {
  httpOnly: true,                    //JavaScript erişemez (XSS koruması fln)
  secure: false,                     
  sameSite: 'strict',                //CSRF koruması
  maxAge: 24 * 60 * 60 * 1000        //24 saat (millisaniye)
};

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
 *       201: { description: Kullanıcı oluşturuldu, token cookie olarak set edildi }
 *       400: { description: Validation hatası }
 */
async function register(req, res) {
  try {
    const result = await authService.registerUser(req.body);

    //Tokenı httpOnly cookie olarak set et
    if (result.token) {
      res.cookie('boxbox_token', result.token, COOKIE_OPTIONS);
    }

    //Tokenı response body'de göndermiyoruz, sadece user dönüyor
    res.status(201).json({ user: result.user });
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
 *       200: { description: Kullanıcı bilgisi, token cookie olarak set edildi }
 *       401: { description: Geçersiz email veya şifre }
 */
async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);

    //Tokenı httpOnly cookie olarak set et
    res.cookie('boxbox_token', result.token, COOKIE_OPTIONS);

    //Sadece user dön
    res.json({ user: result.user });
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
 * /auth/logout:
 *   post:
 *     summary: Çıkış yap (cookie'yi temizler)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Çıkış yapıldı }
 */
async function logout(req, res) {
  res.clearCookie('boxbox_token');
  res.json({ message: 'Çıkış yapıldı' });
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

module.exports = { register, login, logout, getMe, updateMe };