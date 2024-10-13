import { AuthInterceptor } from './auth.interceptor.js';
import { HttpError } from '../types/http.error.js';
import { AuthServices } from '../services/auth.js';

jest.mock('../services/auth.js');

describe('AuthInterceptor', () => {
  let authInterceptor;
  let filmRepoMock;
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Mock del repositorio de películas
    filmRepoMock = {
      queryById: jest.fn(),
    };

    // Instanciamos el interceptor con el mock del repo
    authInterceptor = new AuthInterceptor(filmRepoMock);

    // Mock de req, res, y next
    req = {
      get: jest.fn(),
      body: {},
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  describe('logged', () => {
    it('should throw error if Authorization header is missing', () => {
      req.get.mockReturnValue(undefined);

      authInterceptor.logged(req, res, next);

      expect(next).toHaveBeenCalledWith(new HttpError(401, 'Not Authorized', 'Not Authorization header'));
    });

    it('should throw error if Authorization header does not start with Bearer', () => {
      req.get.mockReturnValue('Basic abc123');

      authInterceptor.logged(req, res, next);

      expect(next).toHaveBeenCalledWith(new HttpError(401, 'Not Authorized', 'Not Bearer in Authorization header'));
    });

    it('should attach token payload to req.body if valid token', () => {
      const mockPayload = { id: 'user123' };
      AuthServices.verifyJWTGettingPayload.mockReturnValue(mockPayload);
      req.get.mockReturnValue('Bearer validtoken');

      authInterceptor.logged(req, res, next);

      expect(req.body.tokenPayload).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should call next with error if token is invalid', () => {
      AuthServices.verifyJWTGettingPayload.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      req.get.mockReturnValue('Bearer invalidtoken');

      authInterceptor.logged(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Invalid token'));
    });
  });

  describe('authorizedForFilms', () => {
    it('should throw error if tokenPayload is missing', () => {
      authInterceptor.authorizedForFilms(req, res, next);

      expect(next).toHaveBeenCalledWith(new HttpError(498, 'Token not found', 'Token not found in Authorized interceptor'));
    });

    it('should throw error if user is not owner of the film', async () => {
      req.body.tokenPayload = { id: 'user123' };
      req.params.id = 'film1';
      filmRepoMock.queryById.mockResolvedValue({ owner: { id: 'anotherUser' } });

      await authInterceptor.authorizedForFilms(req, res, next);

      expect(next).toHaveBeenCalledWith(new HttpError(401, 'Not authorized', 'Not authorized'));
    });

    it('should call next if user is the owner of the film', async () => {
      req.body.tokenPayload = { id: 'user123' };
      req.params.id = 'film1';
      filmRepoMock.queryById.mockResolvedValue({ owner: { id: 'user123' } });

      await authInterceptor.authorizedForFilms(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next with error if there is an error querying the film', async () => {
      req.body.tokenPayload = { id: 'user123' };
      req.params.id = 'film1';
      filmRepoMock.queryById.mockRejectedValue(new Error('Database error'));

      await authInterceptor.authorizedForFilms(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Database error'));
    });
  });
});
