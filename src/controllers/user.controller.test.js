import { UserController } from './user.controller.js';
import { AuthServices } from '../services/auth.js';
import { HttpError } from '../types/http.error.js';

jest.mock('../services/auth.js'); 

describe('UserController', () => {
  let mockRepo;
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      search: jest.fn(),
    };
    controller = new UserController(mockRepo);

    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const mockUser = { username: 'testUser', password: '123456' };
      req.body = mockUser;
      const hashedPassword = 'hashedPassword';

      AuthServices.hash.mockResolvedValue(hashedPassword);
      mockRepo.create.mockResolvedValue(mockUser);

      await controller.register(req, res, next);

      expect(AuthServices.hash).toHaveBeenCalledWith('123456');
      expect(req.body.password).toBe(hashedPassword);
      expect(mockRepo.create).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockUser);
    });

    it('should handle errors during registration', async () => {
      const error = new Error('Registration failed');
      AuthServices.hash.mockRejectedValue(error);

      await controller.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const mockUser = { id: 1, userName: 'testUser', password: 'hashedPassword' };
      req.body = { user: 'testUser', password: '123456' };

      mockRepo.search.mockResolvedValue([mockUser]);
      AuthServices.compare.mockResolvedValue(true);
      const token = 'mockToken';
      AuthServices.createJWT.mockReturnValue(token);

      await controller.login(req, res, next);

      expect(mockRepo.search).toHaveBeenCalledWith({ key: 'userName', value: 'testUser' });
      expect(AuthServices.compare).toHaveBeenCalledWith('123456', 'hashedPassword');
      expect(AuthServices.createJWT).toHaveBeenCalledWith({
        id: mockUser.id,
        userName: mockUser.userName,
      });
      expect(res.send).toHaveBeenCalledWith({
        token,
        user: mockUser,
      });
    });

    it('should handle invalid user or password', async () => {
      req.body = { user: 'testUser', password: '123456' };

      mockRepo.search.mockResolvedValue([]);

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        new HttpError(400, 'Bad Request', 'Invalid user or password')
      );
    });

    it('should handle password comparison failure', async () => {
      const mockUser = { id: 1, userName: 'testUser', password: 'hashedPassword' };
      req.body = { user: 'testUser', password: '123456' };

      mockRepo.search.mockResolvedValue([mockUser]);
      AuthServices.compare.mockResolvedValue(false);

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        new HttpError(400, 'Bad Request', 'Invalid user or password')
      );
    });

    it('should handle errors during login', async () => {
        const error = new HttpError(400, 'Bad Request', 'Invalid user or password');
        mockRepo.search.mockRejectedValue(error);
      
        await controller.login(req, res, next);
      
        expect(next).toHaveBeenCalledWith(error);
      });      
  });
});
