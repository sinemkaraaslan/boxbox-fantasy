const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Race = sequelize.define('Race', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  season: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  round: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  circuit: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(50)
  },
  raceDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  predictionLockAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Yarış sonuçları (yarış bitince doldurulacak)
  finalResults: {
    type: DataTypes.JSONB  // sıralı driver kodları: ["VER", "NOR", "LEC" gibi]
  },
  poleSitter: {
    type: DataTypes.STRING(3)
  },
  fastestLap: {
    type: DataTypes.STRING(3)
  },
  dnfCount: {
    type: DataTypes.INTEGER
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'races',
  indexes: [
    { unique: true, fields: ['season', 'round'] }  // aynı sezonda iki round olmasın
  ]
});

module.exports = Race;