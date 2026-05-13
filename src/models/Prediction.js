const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prediction = sequelize.define('Prediction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // userId, raceId, leagueId associationlardan gelecek
  
  // Top 10 tahmin
  podiumOrder: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('podiumOrder bir array olmalı');
        }
        if (value.length !== 10) {
          throw new Error('podiumOrder tam 10 sürücü içermeli');
        }
        if (new Set(value).size !== 10) {
          throw new Error('podiumOrder içinde tekrar eden sürücü olamaz');
        }
        if (!value.every(code => typeof code === 'string' && code.length === 3)) {
          throw new Error('Her sürücü kodu 3 karakterli string olmalı');
        }
      }
    }
  },
  poleSitter: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  fastestLap: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  dnfCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 20
    }
  },
  // Yarış sonrası hesaplanacak
  pointsAwarded: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pointsBreakdown: {
    // podium: 50, pole: 15, fastestLap: 10, dnf: 5, total: 80 gibi 
    type: DataTypes.JSONB
  }
}, {
  tableName: 'predictions',
  indexes: [
    // Bir kullanıcı bir lig'de bir yarış için tek tahmin yapabilir
    { unique: true, fields: ['userId', 'raceId', 'leagueId'] }
  ]
});

module.exports = Prediction;