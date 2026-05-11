const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const League = sequelize.define('League', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name:{
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: {
            len: [3,60]
        }
    },
    description: {
        type: DataTypes.STRING(280)
    },
    inviteCode: {
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    season: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2026
    }
}, {
    tableName: 'leagues'
});

module.exports = League;