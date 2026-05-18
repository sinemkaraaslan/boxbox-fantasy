const{
    scorePodium,
    scorePole,
    scoreFastestLap,
    scoreDnf,
    calculatePoints,
    isPredictionOpen,
    computeStandings

} = require('../scoringService');

//scorePodium --TOP 10 PUANLAMA
describe('scorePodium', () => {
    test('mükemmel tahmin 100 puan döner', () => {
      const predicted = ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'];
      const actual = ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'];
      expect(scorePodium(predicted, actual)).toBe(100);
    });

    test('ilk iki sıra yer değişirse 90 puan', () => {
        //her değişim 1 sapma= 5 puan (10), 8 doğru = 80,  (90)
        const predicted = ['NOR','VER','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'];
        const actual = ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'];
        expect(scorePodium(predicted, actual)).toBe(90);
    })
    
    test('top 10 dışı sürücü 0 puan getirir', () => {
        //lawson top 10 de olmasın. 0 puan ordan, diğer 9 sürücüde 1 sapma 9*5=45
        const predicted = ['LAW','VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS'];
        const actual = ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'];
        expect(scorePodium(predicted, actual)).toBe(45);
    })

    test('eksik tahmin, array hata fırlatır', () => {
        expect(() => scorePodium(['VER'], ['VER', ['NOR']])).toThrow();
    })

});

//scorePole --POLE SITTER PUANLAMASI
describe('scorePole', () => {
    test('tam doğru 15 puan', () => {
        expect(scorePole('VER', 'VER')).toBe(15);
    })

    test('yanlış tahmin 0 puan', () => {
        expect(scorePole('VER', 'NOR')).toBe(0);
    })
    
    test('null ise 0 puan', () => {
        expect(scorePole('VER', null)).toBe(0);
    })
})

//scoreFastestLap --FASTEST LAP PUANLAMASI
describe('scoreFastestLap', () => {
    test('tam doğru tahmin 10 puan', () => {
        expect(scoreFastestLap('NOR', 'NOR')).toBe(10);
    })

    test('yanlış tahmin 0 puan', () => {
        expect(scoreFastestLap('VER', 'NOR')).toBe(0);
    })
})

//scoreDnf --DNF SAYISI PUANLAMASI
describe('scoreDnf', () => {
    test('tam doğru 15 puan', () => {
      expect(scoreDnf(3, 3)).toBe(15);
    })
  
    test('1 sapma 5 puan', () => {
      expect(scoreDnf(3, 4)).toBe(5);
    })
  
    test('2 sapma 0 puan', () => {
      expect(scoreDnf(3, 5)).toBe(0);
    })
  
    test('5 sapma 0 puan', () => {
      expect(scoreDnf(3, 8)).toBe(0);
    })
});

//calculatePoints --TOPLAM PUANLAMA
describe('calculatePoints', () => {
    test('her şeyi tutturmuşsa 140 puan', () => {
      const prediction = {
        podiumOrder: ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'],
        poleSitter: 'VER',
        fastestLap: 'NOR',
        dnfCount: 3
      };
      const actual = {
        finalResults: ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'],
        poleSitter: 'VER',
        fastestLap: 'NOR',
        dnfCount: 3
      };
      const result = calculatePoints(prediction, actual);
      expect(result.total).toBe(140);
      expect(result.podium).toBe(100);
      expect(result.pole).toBe(15);
      expect(result.fastestLap).toBe(10);
      expect(result.dnf).toBe(15);
    });
  
    test('hiçbir şey doğru değilse 0 puan', () => {
      const prediction = {
        podiumOrder: ['BOT','MAG','HUL','OCO','GAS','ALO','SAI','ALB','PER','STR'],
        poleSitter: 'STR',
        fastestLap: 'ALO',
        dnfCount: 10
      };
      const actual = {
        finalResults: ['VER','NOR','LEC','HAM','RUS','PIA','SAI','ALO','GAS','OCO'],
        poleSitter: 'VER',
        fastestLap: 'NOR',
        dnfCount: 3
      };
      const result = calculatePoints(prediction, actual);
      expect(result.pole).toBe(0);
      expect(result.fastestLap).toBe(0);
      expect(result.dnf).toBe(0);
    });
});

//isPredictionOpen --TAHMİN KİLİDİ KONTROLÜ 
describe('isPredictionOpen', () => {
    test('kilit zamanından önce açık', () => {
      const race = { predictionLockAt: new Date('2026-12-31T14:00:00Z') };
      const now = new Date('2026-12-31T13:00:00Z');
      expect(isPredictionOpen(race, now)).toBe(true);
    });
  
    test('kilit zamanından sonra kapalı', () => {
      const race = { predictionLockAt: new Date('2026-12-31T14:00:00Z') };
      const now = new Date('2026-12-31T15:00:00Z');
      expect(isPredictionOpen(race, now)).toBe(false);
    });
  
    test('kilit anında kapalı', () => {
      const race = { predictionLockAt: new Date('2026-12-31T14:00:00Z') };
      const now = new Date('2026-12-31T14:00:00Z');
      expect(isPredictionOpen(race, now)).toBe(false);
    });
});

//computeStandings --LİG SIRALAMASI
describe('computeStandings', () => {
    test('puana göre azalan sıralar', () => {
      const members = [
        { userId: 'a', username: 'arianaGrande', totalPoints: 50 },
        { userId: 'b', username: 'billieEilish', totalPoints: 100 },
        { userId: 'c', username: 'chaseAtlantic', totalPoints: 75 }
      ];
      const result = computeStandings(members);
      expect(result[0].username).toBe('billieEilish');
      expect(result[1].username).toBe('chaseAtlantic');
      expect(result[2].username).toBe('arianaGrande');
    });
  
    test('rank alanı 1\'den başlar', () => {
      const members = [
        { userId: 'a', username: 'arianaGrande', totalPoints: 50 },
        { userId: 'b', username: 'billieEilish', totalPoints: 100 }
      ];
      const result = computeStandings(members);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
    });
  
    test('boş array boş döner', () => {
      expect(computeStandings([])).toEqual([]);
    });
});
