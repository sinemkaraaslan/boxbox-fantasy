const { body } = require('express-validator');

const createLeagueRules = [
  body('name')
    .isString().trim()
    .isLength({ min: 3, max: 60 }).withMessage('Lig adı 3-60 karakter olmalı'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 280 }).withMessage('Açıklama max 280 karakter'),
  body('isPublic')
    .optional()
    .isBoolean().withMessage('isPublic boolean olmalı'),
  body('season')
    .optional()
    .isInt({ min: 2020, max: 2030 }).withMessage('Sezon 2020-2030 arası olmalı')
];

const joinLeagueRules = [
  body('inviteCode')
    .isString().trim()
    .isLength({ min: 8, max: 8 }).withMessage('Davet kodu 8 karakter olmalı')
    .matches(/^[A-Z2-9]+$/).withMessage('Davet kodu sadece büyük harf ve rakam içerir')
];

module.exports = { createLeagueRules, joinLeagueRules };