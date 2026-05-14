require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/database');
const { User, League, LeagueMember, Race, Prediction } = require('./src/models');
const { fetchSeasonRaces, fetchRaceResults } = require('./src/services/jolpicaService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('./src/middlewares/auth');
const { generateInviteCode } = require('./src/utils/inviteCode');
const { isPredictionOpen } = require('./src/services/scoringService');
const { calculatePoints } = require('./src/services/scoringService');


const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } =req.body;
        const passwordHash = await bcrypt.hash(password, 12);
        //kullanıcıyı db'ye kaydet
        const user = await User.create({
            username,
            email,
            passwordHash
        });
        //cevap olarak hash döndür --güvenlik
        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    }
    catch(err){
    console.error(err);
    res.status(400).json({ error: err.message });
    }
    
})

app.post('/api/auth/login', async (req,res) =>{
    try{
        const { email, password} = req.body;

        //kullanıcıyı emaile göre bul
        const user = await User.findOne({ where: { email }});
        if(!user){
            return res.status(401).json({ error: 'Geçersiz email veya şifre'});
        }
        //şifreyi karşılaştır
        const valid = await bcrypt.compare(password, user.passwordHash);
        if(!valid){
            return res.status(401).json({error: 'Geçersiz email veya şifre'});
        }
        // JWT üret
        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err){
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})

app.get('/api/auth/me', authenticate, async (req, res) => {
    try{
        const user = await User.findByPk(req.user.id);
        if(!user){
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email
        })
    }catch (err){
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})
//profil güncelleme
app.patch('/api/auth/me', authenticate, async (req,res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if(!user){
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        //bu alanlar güncellenebilir
        const allowed = ['favoriteDriver', 'favoriteTeam', 'bio', 'avatarUrl'];
        const updates = {};
        for (const key of allowed) {
            if(req.body[key] !== undefined){
                updates[key] = req.body[key];
            }
        }
        await user.update(updates);

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            favoriteDriver: user.favoriteDriver,
            favoriteTeam: user.favoriteTeam,
            bio: user.bio,
            avatarUrl: user.avatarUrl
          });
    } catch(err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
})

app.post('/api/leagues', authenticate, async (req, res) => {
    try{
        const { name, description, isPublic } = req.body;

        //benzersiz davet kodu üret
        let InviteCode;
        let attempts = 0;
        do {
            inviteCode = generateInviteCode();
            const exists = await League.findOne({ where: {inviteCode} })
            if (!exists) break;
            attempts++;
        }while(attempts < 5);

        //ligi oluştur
        const league = await League.create({
            name,
            description,
            isPublic: isPublic || false,
            inviteCode,
            ownerId: req.user.id
        });
        //kurucu otomatik owner rolünde
        await LeagueMember.create({
            userId: req.user.id,
            leagueId: league.id,
            role: 'owner'
        });
        res.status(201).json(league);
    }catch(err){
        console.error(err);
        res.status(400).json({ error: err.message });

    }
});
//kullanıcının liglerini listele
app.get('/api/leagues', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: League,
                as: 'leagues',
                through: { attributes: ['role', 'totalPoints']}
            }]
        });
        res.json(user.leagues);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})
//lig detay
app.get('/api/leagues/:id', authenticate, async (req, res) => {
    try {
        const league = await League.findByPk(req.params.id, {
            include: [
                { model: User, as: 'owner', attributes: ['id', 'username'] },
                { 
                  model: User, 
                  as: 'members', 
                  attributes: ['id', 'username'],
                  through: { attributes: ['role', 'totalPoints'] }
                }
            ]
        })
        if (!league) {
            return res.status(404).json({ error: 'Lig bulunamadı' })
        }
        //kullanıcı bu ligin üyesi mi ?
        const isMember = league.members.some(m => m.id === req.user.id);
        if( !isMember && !league.isPublic) {
            return res.status(403).json({ error: 'Bu lige erişim yetkin yok' })
        }
        res.json(league);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message});
    }
});
// lige katıl (davet kodu ile)
app.post('/api/leagues/join', authenticate, async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if(!inviteCode) {
            return res.status(400).json({ error: 'Davet kodu gerekli' });
        }
        const league = await League.findOne({ where: {inviteCode} });
        if(!league) {
            return res.status(404).json({ error: 'Geçersiz davet kodu'});
        }
        // zaten üye mi kontrol et
        const existing = await LeagueMember.findOne({ where: { userId: req.user.id, leagueId: league.id}});
        if (existing) {
            return res.status(409).json({ error: 'Bu lige zaten üyesiniz'})
        }
        // yeni üye olarak ekle
        await LeagueMember.create({
            userId: req.user.id,
            leagueId: league.id,
            role: 'member'
        });

        res.status(201).json({
            message: 'Lige başarıyla katıldın',
            league: { id: league.id, name: league.name }
        });
    }catch (err){
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})
//ligi sil
app.delete('/api/leagues/:id', authenticate, async (req, res) => {
    try{
        const league = await League.findByPk(req.params.id);

        if(!league){
            return res.status(404).json({ error: 'Lig bulunamadı' });
        }
        // ownership check --sadece owner silebilir
        if(league.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Sadece lig sahibi silebilir'})
        }
        await league.destroy();
        res.json({ message: 'Lig silindi' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})
// ---------- YARIŞLARI LISTELE ----------
app.get('/api/races', authenticate, async (req, res) => {
    try {
      const season = req.query.season ? parseInt(req.query.season) : null;
  
      const where = season ? { season } : {};
  
      const races = await Race.findAll({
        where,
        order: [['season', 'DESC'], ['round', 'ASC']]
      });
  
      res.json(races);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // ---------- TEK YARIŞ DETAY ----------
  app.get('/api/races/:id', authenticate, async (req, res) => {
    try {
      const race = await Race.findByPk(req.params.id);
      if (!race) {
        return res.status(404).json({ error: 'Yarış bulunamadı' });
      }
      res.json(race);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  
  //SEZON YARIŞLARINI JOLPICADAN ÇEK VE KAYDET
  // (admin/seed endpoint — demo için)
  app.post('/api/races/seed/:season', authenticate, async (req, res) => {
    try {
      const season = parseInt(req.params.season);
      
      if (!season || season < 2020 || season > 2026) {
        return res.status(400).json({ error: 'Geçersiz sezon' });
      }
  
      const racesData = await fetchSeasonRaces(season);
  
      const created = [];
      const skipped = [];
  
      for (const raceData of racesData) {
        // Zaten var mı kontrol et
        const existing = await Race.findOne({
          where: { season: raceData.season, round: raceData.round }
        });
  
        if (existing) {
          skipped.push(`Round ${raceData.round}: ${raceData.name}`);
        } else {
          const race = await Race.create(raceData);
          created.push(race);
        }
      }
  
      res.json({
        message: `${season} sezonu yüklendi`,
        created: created.length,
        skipped: skipped.length,
        skippedDetails: skipped
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  
  //BIR YARIŞIN SONUÇLARINI JOLPICA'DAN ÇEK VE KAYDET
  app.post('/api/races/:id/fetch-results', authenticate, async (req, res) => {
    try {
      const race = await Race.findByPk(req.params.id);
      if (!race) {
        return res.status(404).json({ error: 'Yarış bulunamadı' });
      }
  
      if (race.isCompleted) {
        return res.status(409).json({ error: 'Yarış zaten sonuçlanmış' });
      }
  
      //Jolpicadan sonuçları çek
      const results = await fetchRaceResults(race.season, race.round);
  
      //Race'i güncelle
      await race.update({
        finalResults: results.finalResults,
        poleSitter: results.poleSitter,
        fastestLap: results.fastestLap,
        dnfCount: results.dnfCount,
        isCompleted: true
      });
  
      res.json({
        message: 'Sonuçlar başarıyla kaydedildi',
        race
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

//yeni tahmin oluştur
app.post('/api/leagues/:leagueId/races/:raceId/predictions', authenticate, async (req,res) => {
    try {
        const { leagueId, raceId } = req.params;
        const { podiumOrder, poleSitter, fastestLap, dnfCount } = req.body;

        //lig var mı
        const league = await League.findByPk(leagueId);
        if(!league){
            return res.status(404).json({ error: 'Lig bulunamadı' })
        }

        //kullanıcı bu ligin üyesi mi
        const membership = await LeagueMember.findOne({
            where: { userId: req.user.id, leagueId }
        });

        //yarış var mı
        const race = await Race.findByPk(raceId);
        if(!race){
            return res.status(404).json({ error: 'Yarış bulunamadı'});
        }

        //tahmin süresi hala açık mı
        if (!isPredictionOpen(race)){
            return res.status(403).json({ error: 'Tahmin süresi kapandı'})
        }

        //zaten tahmin yapmış mı
        const existing = await Prediction.findOne({
            where: { userId: req.user.id, raceId, leagueId }
        });
        if (existing) {
            return res.status(409).json({ error: 'Bu yarış için zaten tahmin yapmışsın. Güncellemek için PUT kullan'});     
        }

        //tahmini oluştur
        const prediction = await Prediction.create({
            userId: req.user.id,
            raceId,
            leagueId,
            podiumOrder,
            poleSitter,
            fastestLap,
            dnfCount
        });
        res.status(201).json(prediction);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

//Kullanıcının bir yarış için tahminini getir
app.get('/api/leagues/:leagueId/races/:raceId/predictions/me', authenticate, async (req, res) => {
    try {
        const { leagueId, raceId } = req.params;

        const prediction = await Prediction.findOne({
            where: { userId: req.user.id, raceId, leagueId }
        });

        if(!prediction){
            return res.status(404).json({ error: 'Bu yarış için henüz tahmin yapmadın.'});
        }
        res.json(prediction);
    } catch(err){
        res.status(500).json({ error: err.message });
    }
});

//bir yarış için ligdeki tüm tahminleri getir -yarış sonrası
app.get('/api/leagues/:leagueId/races/:raceId/predictions', authenticate, async (req, res) => {
    try {
        const { leagueId, raceId } = req.params;
        
        //üyelik kontrolü
        const membership = await LeagueMember.findOne({
            where: { userId: req.user.id, leagueId }
        });
        if(!membership){
            return res.status(403).json({ error: 'Bu lige üye değilsin' })
        }

        //yarış kontrol
        const race = await Race.findByPk(raceId);
        if(!race){
            return res.status(404).json({ error: 'Yarış bulunamadı'})
        }

        //yarış başlamadıysa diğer tahminleri gösterme -haksızlık olmasın fln
        if(isPredictionOpen(race)){
            return res.status(403).json({ error: 'Diğer tahminler yarış kilitlenmeden gösterilmez' });
        }
        const predictions = await Prediction.findAll({
            where: { leagueId, raceId },
            include: [{
                model: User,
                attributes: ['id', 'username']
            }],
            order: [['pointsAwarded', 'DESC']]
        });
        res.json(predictions);
    } catch(err){
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})
//tahmini güncelle (kilit açıksa)
app.put('/api/predictions/:id', authenticate, async (req, res) => {
    try {
        const prediction = await Prediction.findByPk(req.params.id);
        if(!prediction){
            return res.status(404).json({ error: 'Tahmin bulunamadı' });
        }
        //ownership check
        if(prediction.userId !== req.user.id){
            return res.status(403).json({ error: 'Sadece kendi tahminini güncelleyebilirsin' });
        }
        //racei çek, kilit durumunu kontrol et
        const race = await Race.findByPk(prediction.raceId);
        if(!isPredictionOpen(race)){
            return res.status(403).json({ error: 'Tahmin süresi kapandı, güncelleyemezsin' });
        }
        //whitelist update
        const allowed = ['podiumOrder', 'poleSitter', 'fastestLap', 'dnfCount'];
        const updates = {};
        for (const key of allowed){
            if (req.body[key] !== undefined){
                updates[key] = req.body[key];
            }
        }
        await prediction.update(updates);
        res.json(prediction);
    } catch(err){
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});
//Tahmini sil (kilit açıksa)
app.delete('/api/predictions/:id', authenticate, async (req, res) => {
    try {
        const prediction = await Prediction.findByPk(req.params.id);
        if (!prediction) {
            return res.status(404).json({ error: 'Tahmin bulunamadı' });
        }
        // ownership check
        if (prediction.userId !== req.user.id) {
            return res.status(403).json({ error: 'Sadece kendi tahminini silebilirsin' });
        }
      
        const race = await Race.findByPk(prediction.raceId);
        if (!isPredictionOpen(race)) {
            return res.status(403).json({ error: 'Tahmin süresi kapandı, silinemez' });
        }
      
        await prediction.destroy();
        res.json({ message: 'Tahmin silindi' });

    } catch(err){
        console.error(err);
        res.status(500).json({ error: err.message });
    }
})
//kullanıcının tüm tahminleri (tüm liglerden)
app.get('/api/users/me/predictions', authenticate, async (req, res) => {
    try {
      const predictions = await Prediction.findAll({
        where: { userId: req.user.id },
        include: [
          { model: Race, attributes: ['id', 'name', 'season', 'round', 'raceDate', 'isCompleted'] },
          { model: League, attributes: ['id', 'name'] }
        ],
        order: [[Race, 'raceDate', 'DESC']]
      });
  
      res.json(predictions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

// BİR YARIŞ İÇİN TÜM TAHMİNLERİ PUANLA 
/**
 * Yarışın sonuçları girilmiş olmalı
 * Bu yarıştaki tüm tahminleri çek
 * her biri için scoring service ile puan hesapla
 * LeaugeMember.totalPoints i güncelle
 */
app.post('/api/races/:id/calculate-points', authenticate, async (req, res) => {
    try {
        const race = await Race.findByPk(req.params.id);
        if(!race) {
            return res.status(404).json({ error: 'Yarış bulunamadı' });
        }
        //yarış sonuçlanmamışsa puan hesaplanamaz
        if(!race.isCompleted || !race.finalResults){
            return res.status(400).json({ error: 'Yarış henüz sonuçlanmamış. Önce sonuçları çek.'})
        }
        //bu yarış için yapılmış tüm tahminleri çek 
        const predictions = await Prediction.findAll({
            where: { raceId: race.id }
        });
        if(predictions.length === 0){
            return res.json({
                message: 'Bu yarış için tahmin yapılmamış',
                scored: 0
            });
        }
        //her tahmin için puan hesapla
        const actual = {
            finalResults: race.finalResults,
            poleSitter: race.poleSitter,
            fastestLap: race.fastestLap,
            dnfCount: race.dnfCount
        };
        const results = [];

        for (const prediction of predictions){
            const points = calculatePoints({
                podiumOrder: prediction.podiumOrder,
                poleSitter: prediction.poleSitter,
                fastestLap: prediction.fastestLap,
                dnfCount: prediction.dnfCount
            },
            actual
            )
             //tahmin kaydını güncelle
            await prediction.update({
                pointsAwarded: points.total,
                pointsBreakdown: points
            })
            //LeagueMember.totalPointsi arttır
            const member = await LeagueMember.findOne({
                where: {
                    userId: prediction.userId,
                    leagueId: prediction.leagueId
                }
            });
            if(member) {
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
        res.json({
            message: 'Puanlar hesaplandı',
            raceName: race.name,
            scored: results.length,
            results
        });
    } catch(err){
        console.error(err);
        res.status(500).json({ error: err.message});
    }
});

async function start(){
    try{
        await sequelize.authenticate();
        console.log('DB bağlantısı başarılı');

        await sequelize.sync({ alter: true}); //sonra migrationa geç
        console.log('Modeller DB ile senkronize'); 

        app.listen(PORT, () => {
            console.log(`Sunucu http://localhost:${PORT}`);
          });
    }catch (err){
        console.log('HATA:', err);
    }
}
start();