const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();

//Güvenlik headerları
app.use(helmet());

//Genel rate limit: IP başına 15 dakikada 100 istek
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Çok fazla istek, lütfen biraz sonra dene' }
});
app.use('/api/', generalLimiter);

//Login/register için daha sıkı: 15 dakikada 10 istek
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Çok fazla giriş denemesi' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use(express.json());
app.use(cookieParser());

//Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'BoxBox Fantasy API Docs'
  }));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

//Routeları bağla
const authRoutes = require('./routes/authRoutes');
const leagueRoutes = require('./routes/leagueRoutes');
const raceRoutes = require('./routes/raceRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const predictionStandaloneRoutes = require('./routes/predictionStandaloneRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/leagues/:leagueId/races/:raceId/predictions', predictionRoutes);
app.use('/api/predictions', predictionStandaloneRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/users', userRoutes);

//404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

module.exports = app;