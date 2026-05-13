/**
 * Scoring Service
 * 
 * Pure functions — DB veya HTTP'ye bağımlı değil, izole test edilebilir.
 * 
 * Puanlama kuralları:
 *   - Top-10'da pozisyon tam doğru: 10 puan
 *   - 1 pozisyon sapma: 5 puan
 *   - 2 pozisyon sapma: 2 puan
 *   - Top-10'da ama 3+ sapma: 1 puan
 *   - Pole sitter tam doğru: 15 puan
 *   - Fastest lap tam doğru: 10 puan
 *   - DNF sayısı tam doğru: 15 puan
 *   - DNF sayısı 1 sapma: 5 puan
 * 
 * Maksimum bir yarıştan: 10*10 + 15 + 10 + 15 = 140 puan
 */
const POINTS = {
    EXACT_POSITION: 10,
    OFF_BY_ONE: 5,
    OFF_BY_TWO: 2,
    IN_TOP_10: 1,
    POLE_EXACT: 15,
    FASTEST_LAP_EXACT: 10,
    DNF_EXACT: 15,
    DNF_OFF_BY_ONE: 5
  };

// top-10 podium tahminlerini puanla
function scorePodium(predictedTop10, actualResults){
    if(!Array.isArray(predictedTop10) || predictedTop10.length !== 10){
        throw new Error('Tahmin tam 10 sürücü içermeli');
    }
    if (!Array.isArray(actualResults) || actualResults.length < 10) {
        throw new Error('Gerçek sonuç en az 10 sürücü içermeli');
    }
    const actualTop10 = actualResults.slice(0,10);
    let total = 0;

    for (let predictedPos = 0; predictedPos < 10; predictedPos++){
        const driver = predictedTop10[predictedPos];
        const actualPos = actualTop10.indexOf(driver);

        if (actualPos === -1){
            continue; //sürücü top 10de değil, puan yok
        }
        const diff = Math.abs(predictedPos - actualPos);

        if (diff === 0) total += POINTS.EXACT_POSITION;
        else if (diff === 1) total += POINTS.OFF_BY_ONE;
        else if (diff === 2) total += POINTS.OFF_BY_TWO;
        else total += POINTS.IN_TOP_10;

    }
    return total;
}

    //DNF sayısı tahminini puanla
    function scoreDnf(predicted, actual){
        if(typeof predicted !== 'number' || typeof actual !== 'number'){
            throw new Error('DNF sayıları number olmalı');
        }
        const diff = Math.abs(predicted - actual);
        if (diff === 0) return POINTS.DNF_EXACT;
        if (diff === 1) return POINTS.DNF_OFF_BY_ONE;
        return 0;
    }
    //pole sitter tahminini puanla
    function scorePole(predicted, actual){
        return predicted === actual ? POINTS.POLE_EXACT : 0;
    }
    //fastest lap tahminini puanla
    function scoreFastestLap(predicted, actual){
        return predicted === actual ? POINTS.FASTEST_LAP_EXACT : 0;
    }
    /**
     * Tüm puanları hesaplayıp kırılımı döndür.
     * @param {Object} prediction - { podiumOrder, poleSitter, fastestLap, dnfCount }
     * @param {Object} actual - { finalResults, poleSitter, fastestLap, dnfCount }
     * @returns {Object} - { podium, pole, fastestLap, dnf, total }
     */
    function calculatePoints(prediction, actual){
        if(!prediction || !actual) {
            throw new Error('Tahmin ve gerçek sonuç gerekli');
        }
        const podium = scorePodium(prediction.podiumOrder, actual.finalResults);
        const pole = scorePole(prediction.poleSitter, actual.poleSitter);
        const fastestLap = scoreFastestLap(prediction.fastestLap, actual.fastestLap);
        const dnf = scoreDnf(prediction.dnfCount, actual.dnfCount);

        return {
            podium,
            pole,
            fastestLap,
            dnf,
            total: podium + pole + fastestLap + dnf
        };

    }
    //tahmin yapma süresi açık mı kontrol et
    function isPredictionOpen(race, now = new Date()){
        if(!race || !race.predictionLockAt) return false;
        return now < new Date(race.predictionLockAt);
    }
    /**
     * Lig sıralaması hesapla.
     * @param {Array} members - [{ userId, username, totalPoints }, ...]
     * @returns {Array} - Sıralanmış, rank eklenmiş liste
     */
    function computeStandings(members){
        if(!Array.isArray(members)) return[];

        return [...members]
        .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        return (a.username || '').localeCompare(b.username || '');
        })
        .map((member, index) => ({
        rank: index + 1,
        userId: member.userId,
        username: member.username,
        totalPoints: member.totalPoints
        }));
    }
    module.exports = {
        calculatePoints,
        scorePodium,
        scorePole,
        scoreFastestLap,
        scoreDnf,
        isPredictionOpen,
        computeStandings,
        POINTS
      };

