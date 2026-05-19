jest.mock('../../models', () => ({
    User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    League: {},
    LeagueMember: {},
    Race: {},
    Prediction: {},
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'fake-jwt-token'),
}));

const { loginUser, getUserProfile, updateUserProfile } = require('../authService');
const { User } = require('../../models');
const bcrypt = require('bcrypt');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('loginUser', () => {
    test('kullanıcı yoksa INVALID_CREDENTIALS', async () => {
      User.findOne.mockResolvedValue(null);
      
      await expect(
        loginUser({ email: 'yok@test.com', password: 'abc12345' })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  
    test('yanlış şifre INVALID_CREDENTIALS', async () => {
      User.findOne.mockResolvedValue({ id: 'user-1', passwordHash: 'hash' });
      bcrypt.compare.mockResolvedValue(false);
      
      await expect(
        loginUser({ email: 'sinem@test.com', password: 'wrong' })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  
    test('doğru şifre token döner', async () => {
      User.findOne.mockResolvedValue({
        id: 'user-1',
        username: 'sinem',
        email: 'sinem@test.com',
        passwordHash: 'hash',
      });
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await loginUser({ email: 'sinem@test.com', password: 'abc12345' });
      
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.username).toBe('sinem');
    });
});

describe('loginUser', () => {
    test('kullanıcı yoksa INVALID_CREDENTIALS', async () => {
      User.findOne.mockResolvedValue(null);
      
      await expect(
        loginUser({ email: 'yok@test.com', password: 'abc12345' })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  
    test('yanlış şifre INVALID_CREDENTIALS', async () => {
      User.findOne.mockResolvedValue({ id: 'user-1', passwordHash: 'hash' });
      bcrypt.compare.mockResolvedValue(false);
      
      await expect(
        loginUser({ email: 'sinem@test.com', password: 'wrong' })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  
    test('doğru şifre token döner', async () => {
      User.findOne.mockResolvedValue({
        id: 'user-1',
        username: 'sinem',
        email: 'sinem@test.com',
        passwordHash: 'hash',
      });
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await loginUser({ email: 'sinem@test.com', password: 'abc12345' });
      
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.username).toBe('sinem');
    });
});

describe('updateUserProfile', () => {
    test('kullanıcı yoksa hata', async () => {
      User.findByPk.mockResolvedValue(null);
      
      await expect(
        updateUserProfile('user-1', { bio: 'test' })
      ).rejects.toThrow('USER_NOT_FOUND');
    });
  
    test('whitelist dışı alanları yoksayar', async () => {
      const updateMock = jest.fn();
      User.findByPk.mockResolvedValue({
        id: 'user-1',
        username: 'sinem',
        update: updateMock,
      });
      
      await updateUserProfile('user-1', {
        bio: 'Yeni bio',
        username: 'hacker',  //whitelist dışı
        email: 'hack@test.com', //whitelist dışı
      });
      
      expect(updateMock).toHaveBeenCalledWith({ bio: 'Yeni bio' });
    });
});