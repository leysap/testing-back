import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { FileMiddleware } from './files';
import { FireBase } from '../services/firebase';
import { HttpError } from '../types/http.error';

jest.mock('multer');
jest.mock('crypto');
jest.mock('path');
jest.mock('../services/firebase');
jest.mock('../types/http.error');

describe('FileMiddleware', () => {
  let fileMiddleware;

  beforeEach(() => {
    fileMiddleware = new FileMiddleware();
  });

  describe('singleFileStore', () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    let middleware;

    beforeEach(() => {
      multer.mockReturnValue({
        single: jest.fn(() => (req, res, next) => next())
      });
      crypto.randomUUID.mockReturnValue('random-uuid');
      middleware = fileMiddleware.singleFileStore('file', 8_000_000);
    });

    it('should call multer with the correct options', () => {
      const mockCallback = jest.fn();
      const mockFile = { originalname: 'test.png' };

      // Mock para path
      path.extname.mockReturnValue('.png');
      path.basename.mockReturnValue('test');

      const storage = multer.diskStorage.mock.calls[0][0];
      storage.filename({}, mockFile, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, 'test-random-uuid.png');
    });

    it('should call next() when middleware is called', () => {
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('saveDataImage', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let mockFirebase;

    beforeEach(() => {
      mockReq = {
        file: {
          filename: 'test.png',
          originalname: 'test.png',
          mimetype: 'image/png',
          size: 1024,
          fieldname: 'image'
        },
        body: {}
      };
      mockRes = {};
      mockNext = jest.fn();
      mockFirebase = {
        uploadFile: jest.fn().mockResolvedValue('https://firebase.com/test.png')
      };

      FireBase.mockImplementation(() => mockFirebase);
    });

    it('should save image data in req.body and call next()', async () => {
      await fileMiddleware.saveDataImage(mockReq, mockRes, mockNext);

      expect(mockFirebase.uploadFile).toHaveBeenCalledWith('test.png');
      expect(mockReq.body.image).toEqual({
        urlOriginal: 'test.png',
        url: 'https://firebase.com/test.png',
        mimetype: 'image/png',
        size: 1024
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw HttpError when no file is provided', async () => {
      mockReq.file = null;

      await fileMiddleware.saveDataImage(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(HttpError)
      );
    });

    it('should pass errors to next when an exception is thrown', async () => {
      mockFirebase.uploadFile.mockRejectedValue(new Error('Firebase error'));

      await fileMiddleware.saveDataImage(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
