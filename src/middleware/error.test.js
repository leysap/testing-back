import { handleError } from './error.js'; 
import { HttpError } from '../types/http.error.js';
import mongoose from 'mongoose';
import { mongo } from 'mongoose';

describe('handleError middleware', () => { 
    let req
    let res
    let next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            statusMessage: ''
        };
        next = jest.fn();
        // Mockear console.error para evitar que aparezca en la salida de las pruebas
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restaurar console.error después de cada test
        console.error.mockRestore();
    });

    it('should handle HttpError correctly', () => {
        const error = new HttpError(404, 'Not Found', 'Resource not found');

        handleError(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.statusMessage).toBe('Resource not found');
        expect(res.send).toHaveBeenCalledWith({ status: 404 });
    });

    it('should handle mongoose ValidationError correctly', () => {
        const error = new mongoose.Error.ValidationError();

        handleError(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.statusMessage).toBe('Bad Request');
        expect(res.send).toHaveBeenCalledWith({ status: '400 Bad Request' });
    });

    it('should handle mongo.MongoServerError correctly', () => {
        const error = new mongo.MongoServerError({ message: 'MongoDB error' });

        handleError(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(406);
        expect(res.statusMessage).toBe('Not accepted');
        expect(res.send).toHaveBeenCalledWith({ status: '406 Not accepted' });
    });

    it('should handle generic errors correctly', () => {
        const error = new Error('Internal server error');

        handleError(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
});
