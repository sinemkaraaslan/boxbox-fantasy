const { body } = require('express-validator');

const DRIVER_CODE_REGEX = /^[A-Z]{3}$/;

const predictionRules = [
  body('podiumOrder')
    .isArray({ min: 10, max: 10 }).withMessage('Tam 10 sürücü gerekli'),
  body('podiumOrder.*')
    .matches(DRIVER_CODE_REGEX).withMessage('Sürücü kodu 3 büyük harf olmalı'),

  body('poleSitter')
    .matches(DRIVER_CODE_REGEX).withMessage('Pole kodu 3 büyük harf olmalı'),

  body('fastestLap')
    .matches(DRIVER_CODE_REGEX).withMessage('Fastest lap kodu 3 büyük harf olmalı'),

  body('dnfCount')
    .isInt({ min: 0, max: 20 }).withMessage('DNF sayısı 0-20 arası olmalı')
];

const updatePredictionRules = [
  body('podiumOrder')
    .optional()
    .isArray({ min: 10, max: 10 }).withMessage('Tam 10 sürücü gerekli'),
  body('podiumOrder.*')
    .optional()
    .matches(DRIVER_CODE_REGEX),

  body('poleSitter').optional().matches(DRIVER_CODE_REGEX),
  body('fastestLap').optional().matches(DRIVER_CODE_REGEX),
  body('dnfCount').optional().isInt({ min: 0, max: 20 })
];

module.exports = { predictionRules, updatePredictionRules };