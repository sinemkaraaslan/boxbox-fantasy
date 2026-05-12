const sequelize = require('../config/database');
//Modelleri yükle
const User = require('./User');
const League = require('./League');
const LeagueMember = require('./LeagueMember');
const Race = require('./Race');

// User -- League (many to many through LeagueMember)
User.belongsToMany(League, { through: LeagueMember, foreignKey: 'userId', as: 'leagues' });
League.belongsToMany(User, { through: LeagueMember, foreignKey: 'leagueId', as: 'members' });

//League - User (owner ilişkisi one to many)
League.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(League, { as: 'ownedLeagues', foreignKey: 'ownerId' });

module.exports = {
    sequelize,
    User,
    League,
    LeagueMember,
    Race
};