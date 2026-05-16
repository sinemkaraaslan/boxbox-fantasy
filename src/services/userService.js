const { User, LeagueMember, Prediction } = require('../models');

async function getUserStats(userId) {
  const predictions = await Prediction.findAll({ where: { userId } });
  const totalPredictions = predictions.length;

  let totalPoints = 0;
  for (const p of predictions) totalPoints += p.pointsAwarded || 0;

  const leagueCount = await LeagueMember.count({ where: { userId } });

  const user = await User.findByPk(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  return {
    username: user.username,
    favoriteDriver: user.favoriteDriver,
    favoriteTeam: user.favoriteTeam,
    totalPredictions,
    totalPoints,
    leagueCount
  };
}

module.exports = { getUserStats };