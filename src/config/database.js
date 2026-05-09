const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    'boxbox_dev',  //db adı
    'sinem', 
    null, //şifre yok (default)
    {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: console.log //şu an görmek istiyorum sonra kapa!!
    }
);
module.exports = sequelize;