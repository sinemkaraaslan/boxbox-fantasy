const express = require('express');
const app = express();

app.use(express.json());

//Routeları bağla
const authRoutes = require('./routes/authRoutes');
const leagueRoutes = require('./routes/leagueRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);

//404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

module.exports = app;