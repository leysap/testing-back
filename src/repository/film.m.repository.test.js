import { FilmRepo } from './film.m.repository.js';
import { FilmModel } from './film.m.model.js';
import { HttpError } from '../../src/types/http.error.js';

jest.mock('../../src/repository/film.m.model.js', () => ({
  FilmModel: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

describe('FilmRepo Tests', () => {
  let filmRepository;

  beforeEach(() => {
    filmRepository = new FilmRepo();
  });

  describe('Fetch Films', () => {
    it('should fetch films with pagination', async () => {
      const sampleFilms = [{ title: 'Film 1' }, { title: 'Film 2' }];
      FilmModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sampleFilms),
      });

      const films = await filmRepository.query(1, 6, 'Action');
      expect(films).toEqual(sampleFilms);
      expect(FilmModel.find).toHaveBeenCalledWith({ genre: 'Action' });
      expect(FilmModel.find().skip).toHaveBeenCalledWith(0);
      expect(FilmModel.find().limit).toHaveBeenCalledWith(6);
      expect(FilmModel.find().populate).toHaveBeenCalledWith('owner');
    });

    it('should fetch all films without genre filter', async () => {
      const sampleFilms = [{ title: 'Film 1' }, { title: 'Film 2' }];
      FilmModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sampleFilms),
      });

      const films = await filmRepository.query(2, 6);
      expect(films).toEqual(sampleFilms);
      expect(FilmModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('Film Count', () => {
    it('should count films filtered by genre', async () => {
      FilmModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const count = await filmRepository.count('Action');
      expect(count).toBe(5);
      expect(FilmModel.countDocuments).toHaveBeenCalledWith({ genre: 'Action' });
    });

    it('should count all films when no genre filter is applied', async () => {
      FilmModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(10),
      });

      const count = await filmRepository.count();
      expect(count).toBe(10);
      expect(FilmModel.countDocuments).toHaveBeenCalledWith({});
    });
  });

  describe('Fetch Film by ID', () => {
    it('should retrieve a film by its ID', async () => {
      const sampleFilm = { title: 'Film 1' };

      FilmModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sampleFilm),
      });

      const film = await filmRepository.queryById('someId');
      expect(film).toEqual(sampleFilm);
      expect(FilmModel.findById).toHaveBeenCalledWith('someId');
      expect(FilmModel.findById().populate).toHaveBeenCalledWith('owner', { films: 0 });
    });

    it('should throw an HttpError if film is not found', async () => {
      FilmModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(filmRepository.queryById('someId')).rejects.toThrow(HttpError);
      await expect(filmRepository.queryById('someId')).rejects.toThrow('Wrong id for the query');
    });
  });

  describe('Search Films', () => {
    it('should search for films by specified key and value', async () => {
      const sampleFilms = [{ title: 'Film 1' }];

      FilmModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(sampleFilms),
      });

      const films = await filmRepository.search({ key: 'title', value: 'Film 1' });
      expect(films).toEqual(sampleFilms);
      expect(FilmModel.find).toHaveBeenCalledWith({ title: 'Film 1' });
      expect(FilmModel.find().populate).toHaveBeenCalledWith('owner', { films: 0 });
    });
  });

  describe('Create Film', () => {
    it('should successfully create a new film', async () => {
      const sampleFilm = { title: 'Film 1' };

      FilmModel.create.mockResolvedValue(sampleFilm);

      const film = await filmRepository.create({ title: 'Film 1' });
      expect(film).toEqual(sampleFilm);
      expect(FilmModel.create).toHaveBeenCalledWith({ title: 'Film 1' });
    });
  });

  describe('Update Film', () => {
    it('should update an existing film by ID', async () => {
      const updatedFilm = { title: 'Film Updated' };

      FilmModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedFilm),
      });

      const film = await filmRepository.update('someId', { title: 'Film Updated' });
      expect(film).toEqual(updatedFilm);
      expect(FilmModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'someId',
        { title: 'Film Updated' },
        { new: true }
      );
      expect(FilmModel.findByIdAndUpdate().populate).toHaveBeenCalledWith('owner', { films: 0 });
    });

    it('should throw an HttpError if film is not found during update', async () => {
      FilmModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(filmRepository.update('someId', { title: 'Film Updated' })).rejects.toThrow(HttpError);
      await expect(filmRepository.update('someId', { title: 'Film Updated' })).rejects.toThrow('Wrong id for the update');
    });
  });

  describe('Delete Film', () => {
    it('should delete a film by id', async () => {
        FilmModel.findByIdAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue(true),
        });
  
        await filmRepository.delete('someId');
        expect(FilmModel.findByIdAndDelete).toHaveBeenCalledWith('someId');
      });
  
      it('should throw HttpError if film not found for delete', async () => {
        FilmModel.findByIdAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });
  
        await expect(filmRepository.delete('someId')).rejects.toThrow(HttpError);
        await expect(filmRepository.delete('someId')).rejects.toThrow(
          'Wrong id for the delete'
        );
    })
  });
});
