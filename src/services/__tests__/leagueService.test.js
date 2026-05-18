jest.mock('../../models', () => ({
    League: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    LeagueMember: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
    User: {},
    Prediction: {},
    Race: {},
  }));
  
  jest.mock('../../utils/inviteCode', () => ({
    generateInviteCode: () => 'TESTCODE',
  }));
  
  const { createLeague, joinLeague, deleteLeague } = require('../leagueService');
  const { League, LeagueMember } = require('../../models');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createLeague', () => {
    test('lig oluşturur', async () => {
      League.findOne.mockResolvedValue(null);
      League.create.mockResolvedValue({ id: 'league-1' });
      LeagueMember.create.mockResolvedValue({});
  
      const result = await createLeague('user-1', { name: 'Test', season: 2026 });
  
      expect(result.id).toBe('league-1');
    });
  });
  
  describe('joinLeague', () => {
    test('invite code yoksa hata', async () => {
      await expect(joinLeague('user-1', null)).rejects.toThrow('INVITE_CODE_REQUIRED');
    });
  
    test('geçersiz code', async () => {
      League.findOne.mockResolvedValue(null);
      await expect(joinLeague('user-1', 'WRONG')).rejects.toThrow('INVALID_INVITE_CODE');
    });
  
    test('zaten üyeyse hata', async () => {
      League.findOne.mockResolvedValue({ id: 'league-1' });
      LeagueMember.findOne.mockResolvedValue({ userId: 'user-1' });
      
      await expect(joinLeague('user-1', 'CODE')).rejects.toThrow('ALREADY_MEMBER');
    });
  });
  
  describe('deleteLeague', () => {
    test('lig yoksa hata', async () => {
      League.findByPk.mockResolvedValue(null);
      await expect(deleteLeague('league-1', 'user-1')).rejects.toThrow('LEAGUE_NOT_FOUND');
    });
  
    test('sahibi değilse hata', async () => {
      League.findByPk.mockResolvedValue({ ownerId: 'other-user' });
      await expect(deleteLeague('league-1', 'user-1')).rejects.toThrow('NOT_OWNER');
    });
  });