const { param, query } = require('express-validator');

const seedSeasonRules = [
  param('season')
    .isInt({ min: 2020, max: 2030 }).withMessage('Sezon 2020-2030 arası olmalı')
];

const raceIdRules = [
  param('id')
    .isUUID().withMessage('Geçerli bir yarış ID gerekli')
];

const listRacesRules = [
  query('season')
    .optional()
    .isInt({ min: 2020, max: 2030 }).withMessage('Sezon 2020-2030 arası olmalı')
];

module.exports = { seedSeasonRules, raceIdRules, listRacesRules };