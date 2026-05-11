const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
        len: [3, 30],
        is: /^[a-zA-Z0-9_]+$/ 
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    favoriteDriver: {
        type: DataTypes.STRING(3)  //3 harfli driver kodu (VER, NOR, LEC gibi)
      },
      favoriteTeam: {
        type: DataTypes.STRING(50)
      },
      bio: {
        type: DataTypes.STRING(280),
        validate: {
          len: [0, 280]
        }
      },
      avatarUrl: {
        type: DataTypes.STRING,
        validate: {
          isUrl: true  // geçerli URL formatı
        }
      }
}, {
    tableName: 'users'
});
module.exports = User;