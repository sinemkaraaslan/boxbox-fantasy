const { body } = require('express-validator');

const registerRules = [
  body('username')
    .isString().withMessage('Username string olmalı')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username 3-30 karakter olmalı')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username sadece harf, rakam ve alt çizgi içerebilir'),

  body('email')
    .isEmail().withMessage('Geçerli bir email gerekli')
    .normalizeEmail(),

  body('password')
    .isString().withMessage('Şifre string olmalı')
    .isLength({ min: 8, max: 128 }).withMessage('Şifre en az 8 karakter olmalı')
];

const loginRules = [
  body('email')
    .isEmail().withMessage('Geçerli bir email gerekli')
    .normalizeEmail(),
  body('password')
    .isString().notEmpty().withMessage('Şifre gerekli')
];

const updateProfileRules = [
  body('favoriteDriver').optional().isString().isLength({ max: 3 }),
  body('favoriteTeam').optional().isString().isLength({ max: 50 }),
  body('bio').optional().isString().isLength({ max: 280 }),
  body('avatarUrl').optional().isURL().withMessage('Geçerli URL gerekli')
];

module.exports = { registerRules, loginRules, updateProfileRules };