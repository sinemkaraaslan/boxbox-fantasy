const express = require('express');
const app = express();

app.use(express.json());

//Routeları bağla
const authRoutes = require('./routes/authRoutes');
const leagueRoutes = require('./routes/leagueRoutes');
const raceRoutes = require('./routes/raceRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const predictionStandaloneRoutes = require('./routes/predictionStandaloneRoutes');
const path = require('path');
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