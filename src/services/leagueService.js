const { User, League, LeagueMember } = require('../models');
const { generateInviteCode } = require('../utils/inviteCode');


//LİG OLUŞTUR OWNER OTOMATİK EKLENİR
async function createLeague(userId, { name, description, isPublic, season }) {
  //benzersiz davet kodu üret
  let inviteCode;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const exists = await League.findOne({ where: { inviteCode } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  const league = await League.create({
    name,
    description,
    isPublic: isPublic || false,
    season: season || 2026,
    inviteCode,
    ownerId: userId
  });

  await LeagueMember.create({
    userId,
    leagueId: league.id,
    role: 'owner'
  });

  return league;
}

//KULLANICININ ÜYE OLDUĞU LİGLERİ GETİR
async function getUserLeagues(userId) {
  const user = await User.findByPk(userId, {
    include: [{
      model: League,
      as: 'leagues',
      through: { attributes: ['role', 'totalPoints'] }
    }]
  });
  return user.leagues;
}

//LİG DETAYINI GETİR --owner + members
async function getLeagueById(leagueId, userId) {
  const league = await League.findByPk(leagueId, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'username'] },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'username'],
        through: { attributes: ['role', 'totalPoints'] }
      }
    ]
  });

  if (!league) {
    throw new Error('LEAGUE_NOT_FOUND');
  }

  //üye değilse ve private ise erişim yok
  const isMember = league.members.some(m => m.id === userId);
  if (!isMember && !league.isPublic) {
    throw new Error('ACCESS_DENIED');
  }

  return league;
}

//DAVET KODU İLE LİGE KATIL
async function joinLeague(userId, inviteCode) {
  if (!inviteCode) {
    throw new Error('INVITE_CODE_REQUIRED');
  }

  const league = await League.findOne({ where: { inviteCode } });
  if (!league) {
    throw new Error('INVALID_INVITE_CODE');
  }

  const existing = await LeagueMember.findOne({
    where: { userId, leagueId: league.id }
  });
  if (existing) {
    throw new Error('ALREADY_MEMBER');
  }

  await LeagueMember.create({
    userId,
    leagueId: league.id,
    role: 'member'
  });

  return league;
}

//LİGİ SİL -- sadece owner
async function deleteLeague(leagueId, userId) {
  const league = await League.findByPk(leagueId); //instance geldi

  if (!league){
    throw new Error('LEAGUE_NOT_FOUND');
  }

  if (league.ownerId !== userId) {
    throw new Error('NOT_OWNER');
  }

  await league.destroy(); //dbden sil
  return true;
}

async function getStandings(leagueId) {
    const league = await League.findByPk(leagueId);
    if (!league) throw new Error('LEAGUE_NOT_FOUND');
  
    const members = await LeagueMember.findAll({
      where: { leagueId },
      include: [{ model: User, attributes: ['id', 'username'] }],
      order: [['totalPoints', 'DESC']]
    });
  
    const standings = members.map((m, i) => ({
      rank: i + 1,
      userId: m.User.id,
      username: m.User.username,
      totalPoints: m.totalPoints
    }));
  
    return { standings };
  }

module.exports = {
  createLeague,
  getUserLeagues,
  getLeagueById,
  joinLeague,
  deleteLeague,
  getStandings
};