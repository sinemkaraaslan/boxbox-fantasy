require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/database');
const { User, League, LeagueMember } = require('./src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('./src/middlewares/auth');
const { generateInviteCode } = require('./src/utils/inviteCode');


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