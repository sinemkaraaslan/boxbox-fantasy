const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Yeni kullanıcı kaydı.
 * @param {Object} data - { username, email, password }
 * @returns {Object} - { id, username, email }
 */
async function registerUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });

  return {
    id: user.id,
    username: user.username,
    email: user.email
  };
}

/**
 * Giriş yap.
 * @param {Object} data - { email, password }
 * @returns {Object} - { token, user }
 * @throws {Error} - Kimlik bilgileri geçersizse
 */
async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email }
  };
}

/**
 * Kullanıcının kendi profilini getir.
 */
async function getUserProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    favoriteDriver: user.favoriteDriver,
    favoriteTeam: user.favoriteTeam,
    bio: user.bio,
    avatarUrl: user.avatarUrl
  };
}

/**
 * Profili güncelle. Sadece izinli alanlar.
 */
async function updateUserProfile(userId, updates) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const allowed = ['favoriteDriver', 'favoriteTeam', 'bio', 'avatarUrl'];
  const safe = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safe[key] = updates[key];
  }

  await user.update(safe);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    favoriteDriver: user.favoriteDriver,
    favoriteTeam: user.favoriteTeam,
    bio: user.bio,
    avatarUrl: user.avatarUrl
  };
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};