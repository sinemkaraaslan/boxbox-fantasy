const express = require('express');
const app = express();

app.use(express.json());

//Routeları bağla
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

//404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

module.exports = app;