jest.mock('../../models', () => ({
    Prediction: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    League: { findByPk: jest.fn() },
    LeagueMember: { findOne: jest.fn() },
    Race: { findByPk: jest.fn() },
    User: {},
}));
  
const { createPrediction, updatePrediction } = require('../predictionService');
const { Prediction, League, LeagueMember, Race } = require('../../models');
  
beforeEach(() => {
  jest.clearAllMocks();
});
  
describe('createPrediction', () => {
  test('lig yoksa hata', async () => {
    League.findByPk.mockResolvedValue(null);
      
    await expect(
      createPrediction('user-1', 'league-1', 'race-1', {})
    ).rejects.toThrow('LEAGUE_NOT_FOUND');
  });
  
  test('üye değilse hata', async () => {
    League.findByPk.mockResolvedValue({ id: 'league-1' });
    LeagueMember.findOne.mockResolvedValue(null);
    
    await expect(
      createPrediction('user-1', 'league-1', 'race-1', {})
    ).rejects.toThrow('NOT_LEAGUE_MEMBER');
  });
  
  test('yarış yoksa hata', async () => {
    League.findByPk.mockResolvedValue({ id: 'league-1' });
    LeagueMember.findOne.mockResolvedValue({ userId: 'user-1' });
    Race.findByPk.mockResolvedValue(null);
      
    await expect(
      createPrediction('user-1', 'league-1', 'race-1', {})
    ).rejects.toThrow('RACE_NOT_FOUND');
  });
  
  test('tahmin süresi kapalıysa hata', async () => {
    League.findByPk.mockResolvedValue({ id: 'league-1' });
    LeagueMember.findOne.mockResolvedValue({ userId: 'user-1' });
    Race.findByPk.mockResolvedValue({ predictionLockAt: new Date('2020-01-01') });
    
    await expect(
      createPrediction('user-1', 'league-1', 'race-1', {})
    ).rejects.toThrow('PREDICTION_CLOSED');
  });
  
  test('zaten tahmin varsa hata', async () => {
    League.findByPk.mockResolvedValue({ id: 'league-1' });
    LeagueMember.findOne.mockResolvedValue({ userId: 'user-1' });
    Race.findByPk.mockResolvedValue({ predictionLockAt: new Date('2099-12-31') });
    Prediction.findOne.mockResolvedValue({ id: 'existing' });
      
    await expect(
      createPrediction('user-1', 'league-1', 'race-1', {})
    ).rejects.toThrow('ALREADY_PREDICTED');
  });
});
  
describe('updatePrediction', () => {
  test('tahmin yoksa hata', async () => {
    Prediction.findByPk.mockResolvedValue(null);
      
    await expect(
      updatePrediction('pred-1', 'user-1', {})
    ).rejects.toThrow('PREDICTION_NOT_FOUND');
  });
  
  test('sahibi değilse hata', async () => {
    Prediction.findByPk.mockResolvedValue({ userId: 'other-user' });
      
    await expect(
      updatePrediction('pred-1', 'user-1', {})
    ).rejects.toThrow('NOT_OWNER');
  });
});