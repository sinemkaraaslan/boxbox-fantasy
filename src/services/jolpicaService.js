const axios = require('axios');

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'

/**
 * Bir sezonun yarış takvimini Jolpica'dan çeker.
 * @param {number} season 2025 2026 gibi
 * @returns {Array} - normalize edilmiş yarış objelerinin listesi
 */
async function fetchSeasonRaces(season) {
    const url = `${JOLPICA_BASE}/${season}.json`;

    try{
        const response = await axios.get(url);
        const races = response.data.MRData.RaceTable.Races;

        //JOPLICANIN FORMATINI MODELE UYDURMAK İÇİN
        return races.map(race => ({
            season: parseInt(race.season),
            round: parseInt(race.round),
            name: race.raceName,
            circuit: race.Circuit.Location.country,
            raceDate: new Date(`${race.date}T${race.time || '14:00:00Z'}`),
            //tahmin kilidi -yarışın başlangıcından 1 saat önce
            predictionLockAt: new Date(
                new Date(`${race.date}T${race.time || '14:00:00Z'}`).getTime() - 60 * 60 * 1000
              )
        }))
    } catch(err){
        console.error('Joplica API hatası:', err.message);
        throw new Error('Yarış verileri çekilemedi');
    }

}
/**
 * Bir yarışın sonuçlarını Jolpica'dan çeker.
 * @param {number} season
 * @param {number} round
 * @returns {Object} - { finalResults, poleSitter, fastestLap, dnfCount }
 */
async function fetchRaceResults(season, round){
    const resultsUrl = `${JOLPICA_BASE}/${season}/${round}/results.json`;
    const qualifyingUrl = `${JOLPICA_BASE}/${season}/${round}/qualifying.json`;

    try{
        //yarış sonuçları
        const resultsRes = await axios.get(resultsUrl);
        const raceData = resultsRes.data.MRData.RaceTable.Races[0];

        if(!raceData){
            throw new Error('Yarış sonucu henüz yok');
        }

        const results = raceData.Results;

        // Top 10 sıralama (driver kodları)
        const finalResults = results
        .slice(0, 10)
        .map(r => r.Driver.code);

        //fastest lap olan sürücüyü al
        const fastestLapDriver = results.find(r => r.FastestLap?.rank === '1');
        const fastestLap = fastestLapDriver ? fastestLapDriver.Driver.code : null;

        //DNF sayısı - statusu "Finished" veya "+X Lap" olmayan herkes
        const dnfCount = results.filter(r => {
            const status = r.status;
            return status !== 'Finished' && !status.startsWith('+');
        }).length;

        //Pole sitter - sıralama turlarından
        let poleSitter = null;
        try{
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
