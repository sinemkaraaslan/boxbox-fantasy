require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('./src/middlewares/auth');


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