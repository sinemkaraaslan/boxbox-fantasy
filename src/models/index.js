const sequelize = require('../config/database');
//Modelleri yükle
const User = require('./User');
const League = require('./League');
const LeagueMember = require('./LeagueMember');
const Race = require('./Race');
const Prediction = require('./Prediction');

// User -- League (many to many through LeagueMember)
User.belongsToMany(League, { through: LeagueMember, foreignKey: 'userId', as: 'leagues' });
League.belongsToMany(User, { through: LeagueMember, foreignKey: 'leagueId', as: 'members' });

//League - User (owner ilişkisi one to many)
League.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(League, { as: 'ownedLeagues', foreignKey: 'ownerId' });

//User - Prediction (one-to-many)
User.hasMany(Prediction, { foreignKey: 'userId' });
Prediction.belongsTo(User, { foreignKey: 'userId' });

//Race - Prediction (one to many)
Race.hasMany(Prediction, { foreignKey: 'raceId' });
Prediction.belongsTo(Race, { foreignKey: 'raceId' });

//League - Prediction (one-to-many) — tahminler lig içinde
League.hasMany(Prediction, { foreignKey: 'leagueId' });
Prediction.belongsTo(League, { foreignKey: 'leagueId' });

module.exports = {
    sequelize,
    User,
    League,
    LeagueMember,
    Race,
    Prediction
};