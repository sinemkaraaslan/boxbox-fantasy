require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB bağlantısı başarılı');

    await sequelize.sync({ alter: true });
    console.log('Modeller senkronize');

    app.listen(PORT, () => {
      console.log(`Sunucu http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Hata:', err);
  }
}

start();