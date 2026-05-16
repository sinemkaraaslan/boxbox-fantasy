const { Race } = require('../models');
const { fetchSeasonRaces, fetchRaceResults } = require('./jolpicaService');


//Yarışları listele -opsiyonel
async function listRaces(season) {
  const where = season ? { season } : {};
  return await Race.findAll({
    where,
    order: [['season', 'DESC'], ['round', 'ASC']]
  });
}

//tek yarış detayı
async function getRaceById(id) {
  const race = await Race.findByPk(id);
  if(!race) {
    throw new Error('RACE_NOT_FOUND');
  }
  return race;
}

//bir sezonun yarış takvimini Jolpicadan çek ve db ye kaydet
async function seedSeason(season) {
  if (!season || season < 2020 || season > 2026) {
    throw new Error('INVALID_SEASON');
  }

  const racesData = await fetchSeasonRaces(season);
  const created = [];
  const skipped = [];

  for(const raceData of racesData) {
    const existing = await Race.findOne({
      where: { season: raceData.season, round: raceData.round }
    });

    if (existing) {
      skipped.push(`Round ${raceData.round}: ${raceData.name}`);
    }else{
      const race = await Race.create(raceData);
      created.push(race);
    }
  }

  return { season, created: created.length, skipped: skipped.length };
}

//bir yarışın sonuçlarını jolpicadan çek ve kaydet
async function fetchAndSaveResults(raceId) {
  const race = await Race.findByPk(raceId);
  if(!race){
    throw new Error('RACE_NOT_FOUND');
  }

  if (race.isCompleted) {
    throw new Error('ALREADY_COMPLETED');
  }

  const results = await fetchRaceResults(race.season, race.round);

  await race.update({
    finalResults: results.finalResults,
    poleSitter: results.poleSitter,
    fastestLap: results.fastestLap,
    dnfCount: results.dnfCount,
    isCompleted: true
  });

  return race;
}

module.exports = {
  listRaces,
  getRaceById,
  seedSeason,
  fetchAndSaveResults
};