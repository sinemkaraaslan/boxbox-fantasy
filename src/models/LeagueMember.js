const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeagueMember = sequelize.define('LeagueMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('owner', 'member'),
    defaultValue: 'member'
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'league_members'
});

module.exports = LeagueMember;