const { League } = require("../../models");
const { fetchSeasonRaces, fetchRaceResults } = require("../jolpicaService");

jest.mock('../../models', () => ({
    Race: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
    League: {},
    LeagueMember: {},
    User: {},
    Prediction: {}
}))

jest.mock('../jolpicaService', () => ({
    fetchSeasonRaces: jest.fn(),
    fetchRaceResults: jest.fn(),
}))

const { getRaceById, seedSeason, fetchAndSaveResults } = require('../raceService');
const { Race }= require('../../models');

beforeEach(() => {
    jest.clearAllMocks();
})

describe('getRaceById', () => {
    test('yarış yoksa hata', async () => {
        Race.findByPk.mockResolvedValue(null);
        await expect(getRaceById('race-1')).rejects.toThrow('RACE_NOT_FOUND');
    })

    test('yarış varsa onu döndürür', async () => {
    const fakeRace = { id: 'race-1', name: 'Bahrain GP' };
    Race.findByPk.mockResolvedValue(fakeRace);
    
    const result = await getRaceById('race-1');
    expect(result).toBe(fakeRace);
  })
})

describe('seedSeason', () => {
  test('sezon yoksa hata', async () => {
    await expect(seedSeason(null)).rejects.toThrow('INVALID_SEASON');
  })

  test('2020den önceki sezon hata', async () => {
    await expect(seedSeason(2019)).rejects.toThrow('INVALID_SEASON');
  });

  test('2026dan sonraki sezon hata', async () => {
    await expect(seedSeason(2027)).rejects.toThrow('INVALID_SEASON');
  });
})

describe('fetchAndSaveResults', () => {
  test('yarış yoksa hata', async () => {
    Race.findByPk.mockResolvedValue(null);
    
    await expect(fetchAndSaveResults('race-1')).rejects.toThrow('RACE_NOT_FOUND');
  })

  test('yarış zaten tamamlanmışsa hata', async () => {
    Race.findByPk.mockResolvedValue({ id: 'race-1', isCompleted: true });
    
    await expect(fetchAndSaveResults('race-1')).rejects.toThrow('ALREADY_COMPLETED');
  })
})
