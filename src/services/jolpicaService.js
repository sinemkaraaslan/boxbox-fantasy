const axios = require('axios');
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'

/**
 * Bir sezonun yarış takvimini Jolpica'dan çeker.
 * @param {number} season 2025 2026 gibi
 * @returns {Array} - normalize edilmiş yarış objelerinin listesi
 */
async function fetchSeasonRaces(season) {
  const url = `${JOLPICA_BASE}/${season}.json`;
  try {
    const response = await axios.get(url);
    const races = response.data.MRData.RaceTable.Races;
    
    return races.map(race => {
      // Yarış zamanı
      const raceDateTime = new Date(`${race.date}T${race.time || '14:00:00Z'}`);
      
      // Qualifying zamanı — Jolpica'dan varsa kullan, yoksa 1 gün önce fallback
      let qualifyingLockAt;
      if (race.Qualifying && race.Qualifying.date) {
        const qualTime = race.Qualifying.time || '14:00:00Z';
        qualifyingLockAt = new Date(`${race.Qualifying.date}T${qualTime}`);
      } else {
        qualifyingLockAt = new Date(raceDateTime.getTime() - 24 * 60 * 60 * 1000);
      }
      
      return {
        season: parseInt(race.season),
        round: parseInt(race.round),
        name: race.raceName,
        circuit: race.Circuit.Location.country,
        raceDate: raceDateTime,
        //tahmin kilidi -yarışın başlangıcından 1 saat önce
        predictionLockAt: new Date(raceDateTime.getTime() - 60 * 60 * 1000),
        //pole kilidi - qualifying başlangıcı
        qualifyingLockAt
      };
    });
  } catch(err) {
    console.error('Jolpica API hatası:', err.message);
    throw new Error('Yarış verileri çekilemedi');
  }
}

/**
 * Bir yarışın sonuçlarını Jolpica'dan çeker.
 */
async function fetchRaceResults(season, round){
  const resultsUrl = `${JOLPICA_BASE}/${season}/${round}/results.json`;
  const qualifyingUrl = `${JOLPICA_BASE}/${season}/${round}/qualifying.json`;
  try {
    const resultsRes = await axios.get(resultsUrl);
    const raceData = resultsRes.data.MRData.RaceTable.Races[0];
    if(!raceData){
      throw new Error('Yarış sonucu henüz yok');
    }
    const results = raceData.Results;
    
    const finalResults = results
      .slice(0, 10)
      .map(r => r.Driver.code);
    
    const fastestLapDriver = results.find(r => r.FastestLap?.rank === '1');
    const fastestLap = fastestLapDriver ? fastestLapDriver.Driver.code : null;
    
    //DNF sayısı - "Finished", "Lapped" veya "+X Lap" olmayan herkes
    const dnfCount = results.filter(r => {
      const status = r.status;
      return status !== 'Finished' && status !== 'Lapped' && !status.startsWith('+');
    }).length;
    
    let poleSitter = null;
    try {
      const qualRes = await axios.get(qualifyingUrl);
      const qualResults = qualRes.data.MRData.RaceTable.Races[0]?.QualifyingResults;
      if (qualResults?.length > 0) {
        poleSitter = qualResults[0].Driver.code;
      }
    } catch(qualErr){
      console.warn('Qualifying verisi alınamadı:', qualErr.message);
    }
    
    return {
      finalResults,
      poleSitter,
      fastestLap,
      dnfCount
    };
  } catch (err){
    console.error('Jolpica sonuç hatası:', err.message);
    throw new Error('Yarış sonuçları çekilemedi');
  }
}

module.exports = {
  fetchSeasonRaces,
  fetchRaceResults
};