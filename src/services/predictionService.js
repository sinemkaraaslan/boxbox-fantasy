const { Prediction, League, LeagueMember, Race, User } = require('../models');
const { isPredictionOpen, calculatePoints } = require('./scoringService');

//TAHMİN OLUŞTUR -tüm kontrollerle birlikte
async function createPrediction(userId, leagueId, raceId, data) {
  //Lig var mı
  const league = await League.findByPk(leagueId);
  if(!league) {
    throw new Error('LEAGUE_NOT_FOUND');
  }

  //Kullanıcı üye mi
  const membership = await LeagueMember.findOne({
    where: { userId, leagueId }
  });
  if(!membership) {
    throw new Error('NOT_LEAGUE_MEMBER');
  }

  //Yarış var mı
  const race = await Race.findByPk(raceId);
  if(!race){
    throw new Error('RACE_NOT_FOUND');
  }

  //Tahmin süresi açık mı
  if(!isPredictionOpen(race)){
    throw new Error('PREDICTION_CLOSED');
  }

  //Zaten tahmin var mı
  const existing = await Prediction.findOne({
    where: { userId, raceId, leagueId }
  });
  if(existing){
    throw new Error('ALREADY_PREDICTED');
  }

  //Oluştur
  const prediction = await Prediction.create({
    userId,
    raceId,
    leagueId,
    ...data
  });

  return prediction;
}

//KULLANICININ BELİRLİ YARIŞ + LİG İÇİN TAHMİNİ
async function getMyPrediction(userId, leagueId, raceId) {
  const prediction = await Prediction.findOne({
    where: { userId, raceId, leagueId }
  });
  if (!prediction) {
    throw new Error('PREDICTION_NOT_FOUND');
  }
  return prediction;
}

//BİR YARIŞ İÇİN LİGDEKİ TÜM TAHMİNLER -yarış sonrası
async function getRacePredictions(userId, leagueId, raceId) {
  //Üyelik kontrolü
  const membership = await LeagueMember.findOne({
    where: { userId, leagueId }
  });
  if(!membership){
    throw new Error('NOT_LEAGUE_MEMBER');
  }

  const race = await Race.findByPk(raceId);
  if(!race){
    throw new Error('RACE_NOT_FOUND');
  }

  //Tahmin süresi hâlâ açıksa diğerlerini gösterme
  if (isPredictionOpen(race)) {
    throw new Error('PREDICTIONS_LOCKED');
  }

  return await Prediction.findAll({
    where: { leagueId, raceId },
    include: [{
      model: User,
      attributes: ['id', 'username']
    }],
    order: [['pointsAwarded', 'DESC']]
  });
}

//TAHMİN GÜNCELLE -sadece sahibi, kilit açıksa
async function updatePrediction(predictionId, userId, updates) {
  const prediction = await Prediction.findByPk(predictionId);
  if (!prediction){
    throw new Error('PREDICTION_NOT_FOUND');
  }

  if (prediction.userId !== userId) {
    throw new Error('NOT_OWNER');
  }

  const race = await Race.findByPk(prediction.raceId);
  if (!isPredictionOpen(race)) {
    throw new Error('PREDICTION_CLOSED');
  }

  //Whitelist -- güvenlik fln
  const allowed = ['podiumOrder', 'poleSitter', 'fastestLap', 'dnfCount'];
  const safe = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safe[key] = updates[key];
  }

  await prediction.update(safe);
  return prediction;
}

//TAHMİNİ SİL
async function deletePrediction(predictionId, userId) {
  const prediction = await Prediction.findByPk(predictionId);
  if (!prediction) {
    throw new Error('PREDICTION_NOT_FOUND');
  }

  if (prediction.userId !== userId) {
    throw new Error('NOT_OWNER');
  }

  const race = await Race.findByPk(prediction.raceId);
  if (!isPredictionOpen(race)) {
    throw new Error('PREDICTION_CLOSED');
  }

  await prediction.destroy();
  return true;
}

//KULLANICININ TÜM TAHMİNLERİ -her ligden
async function getUserAllPredictions(userId) {
  return await Prediction.findAll({
    where: { userId },
    include: [
      { model: Race, attributes: ['id', 'name', 'season', 'round', 'raceDate', 'isCompleted'] },
      { model: League, attributes: ['id', 'name'] }
    ],
    order: [[Race, 'raceDate', 'DESC']]
  });
}

//BİR YARIŞTAKİ TÜM TAHMİNLERİ PUANLA
async function calculateRacePoints(raceId) {
  const race = await Race.findByPk(raceId);
  if(!race){
    throw new Error('RACE_NOT_FOUND');
  }

  if (!race.isCompleted || !race.finalResults) {
    throw new Error('RACE_NOT_COMPLETED');
  }

  const predictions = await Prediction.findAll({ where: { raceId } });

  if (predictions.length === 0) {
    return { scored: 0, results: [] };
  }

  const actual = {
    finalResults: race.finalResults,
    poleSitter: race.poleSitter,
    fastestLap: race.fastestLap,
    dnfCount: race.dnfCount
  };

  const results = [];

  for (const prediction of predictions) {
    const points = calculatePoints(
      {
        podiumOrder: prediction.podiumOrder,
        poleSitter: prediction.poleSitter,
        fastestLap: prediction.fastestLap,
        dnfCount: prediction.dnfCount
      },
      actual
    );

    await prediction.update({
      pointsAwarded: points.total,
      pointsBreakdown: points
    });

    const member = await LeagueMember.findOne({
      where: { userId: prediction.userId, leagueId: prediction.leagueId }
    });

    if (member) {
      await member.update({
        totalPoints: member.totalPoints + points.total
      });
    }

    results.push({
      predictionId: prediction.id,
      userId: prediction.userId,
      points: points.total,
      breakdown: points
    });
  }

  return { raceName: race.name, scored: results.length, results };
}

module.exports = {
  createPrediction,
  getMyPrediction,
  getRacePredictions,
  updatePrediction,
  deletePrediction,
  getUserAllPredictions,
  calculateRacePoints
};