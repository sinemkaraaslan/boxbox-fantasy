const cron = require('node-cron');
const { Race } = require('../models');
const { Op } = require('sequelize');
const raceService = require('../services/raceService');


//Cron job — her 6 saatte bir çalışsın ok.
//Tamamlanmamış ama tahmini bitiş zamanı geçmiş yarışları otomatik fetch eder.

function startRaceResultsCron() {
  // Her 6 saatte bir: 00:00, 06:00, 12:00, 18:00
  cron.schedule('0 */6 * * *', async () => {
    console.log('Cron: Yarış sonuçları kontrolü başladı');
    
    try {
      //Bitmemiş + yarış bitiş zamanı 3 saat önce olmuş yarışları bul
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      
      const pendingRaces = await Race.findAll({
        where: {
          isCompleted: false,
          raceDate: { [Op.lte]: threeHoursAgo }
        }
      });
      
      if (pendingRaces.length === 0) {
        console.log('Cron: Bekleyen yarış yok');
        return;
      }
      
      for (const race of pendingRaces) {
        try {
          console.log(`Cron: ${race.name} sonuçları çekiliyor...`);
          await raceService.fetchAndSaveResults(race.id);
          console.log(`Cron: ${race.name} tamamlandı`);
        } catch (err) {
          console.error(`Cron: ${race.name} hata: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Cron hatası:', err.message);
    }
  });
  
  console.log('Cron job aktif: Her 6 saatte bir yarış sonuçları kontrol edilecek');
}

module.exports = { startRaceResultsCron };