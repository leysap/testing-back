import { AuthServices } from './auth.js'; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { secret } from '../config.js';
import { HttpError } from '../types/http.error.js'; 

jest.mock('jsonwebtoken');
jest.mock('bcrypt'); 

describe('AuthServices', () => {
  beforeEach(() => {
    // Resetea los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('createJWT', () => {
    it('debería crear un JWT correctamente', () => {
      const payload = { userId: 1 };
      const expectedToken = 'fake_token';

      jwt.sign.mockReturnValue(expectedToken); 

      const result = AuthServices.createJWT(payload);
      expect(result).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(payload, secret); 
    });
  });

  describe('verifyJWTGettingPayload', () => {
    it('debería verificar un JWT y devolver el payload', () => {
      const token = 'fake_token';
      const expectedPayload = { userId: 1 };

      jwt.verify.mockReturnValue(expectedPayload); 

      const result = AuthServices.verifyJWTGettingPayload(token);
      expect(result).toBe(expectedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, secret); 
    });

    it('debería lanzar un error si el token es inválido', () => {
      const token = 'invalid_token';
      const errorMessage = 'Invalid Token';

      jwt.verify.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Verifica que se lanza un error y que el mensaje del error es el esperado
      const error = AuthServices.verifyJWTGettingPayload.bind(AuthServices, token);
      expect(error).toThrow(HttpError);
      expect(error).toThrow('Invalid Token'); 
    });
    it('debería lanzar un HttpError si el payload es un string', () => {
        const token = 'fake_token';
        const resultString = 'Invalid Token'; 

        jwt.verify.mockReturnValue(resultString); 

        // Verifica que se lanza un error de tipo HttpError y que el mensaje es correcto
        expect(() => AuthServices.verifyJWTGettingPayload(token)).toThrow(HttpError);
        expect(() => AuthServices.verifyJWTGettingPayload(token)).toThrow('Invalid Token');
    });
    
  });

  describe('hash', () => {
    it('debería devolver un hash al hashear un valor', async () => {
      const value = 'password';
      const hashedValue = 'hashed_password';

      bcrypt.hash.mockResolvedValue(hashedValue);

      const result = await AuthServices.hash(value);
      expect(result).toBe(hashedValue);
      expect(bcrypt.hash).toHaveBeenCalledWith(value, AuthServices.salt);
    });
  });

  describe('compare', () => {
    it('debería comparar un valor y un hash correctamente', async () => {
      const value = 'password';
      const hashedValue = 'hashed_password';

      bcrypt.compare.mockResolvedValue(true); 

      const result = await AuthServices.compare(value, hashedValue);
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(value, hashedValue);
    });
  });
});
