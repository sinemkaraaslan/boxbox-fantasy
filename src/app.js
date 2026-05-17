const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
app.use(express.json());
//Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'BoxBox Fantasy API Docs'
  }));

app.use(cors());

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