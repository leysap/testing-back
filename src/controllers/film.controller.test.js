import { FilmController } from './film.controller';

// Creamos mocks para los repositorios
const mockRepo = {
  create: jest.fn(),
  query: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  queryById: jest.fn(),
  update: jest.fn(),
};

const mockUserRepo = {
  queryById: jest.fn(),
  update: jest.fn(),
};

describe('FilmController', () => {
  let filmController;

  beforeEach(() => {
    // Creamos una instancia del controlador con los repositorios mockeados
    filmController = new FilmController(mockRepo, mockUserRepo);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpia todos los mocks después de cada test
  });

  describe('post', () => {
    it('debería crear una película y asociarla con el usuario', async () => {
      const mockFilm = { id: 1, title: 'New Film' };
      const mockUser = { id: 1, films: [] };

      // Simulamos las respuestas de los repos
      mockRepo.create.mockResolvedValue(mockFilm);
      mockUserRepo.queryById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue(true);

      const req = {
        body: {
          title: 'New Film',
          tokenPayload: { id: 1 },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next = jest.fn();

      await filmController.post(req, res, next);

      // Verificamos que el método "create" del repo fue llamado correctamente
      expect(mockRepo.create).toHaveBeenCalledWith({
        title: 'New Film',
        owner: 1,
      });
      // Verificamos que la película fue agregada al array de películas del usuario
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        ...mockUser,
        films: [mockFilm],
      });
      // Verificamos que la respuesta de estado sea 201
      expect(res.status).toHaveBeenCalledWith(201);
      // Verificamos que la película creada fue enviada en la respuesta
      expect(res.send).toHaveBeenCalledWith(mockFilm);
    });
    it('should call next function when an error occurs in post', async () => {
        const error = new Error('An error occurred');
        mockRepo.create.mockRejectedValue(error);
  
        // Mockeamos el request, response y next
        const req = {
          body: {
            title: 'New Film',
            tokenPayload: { id: 1 },
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };
        const next = jest.fn();
  
        await filmController.post(req, res, next);
  
        expect(next).toHaveBeenCalledWith(error);
      });
  });

  describe('getAll', () => {
    it('debería devolver todas las películas con paginación', async () => {
        const mockFilms = [
          { id: 1, title: 'Film 1' },
          { id: 2, title: 'Film 2' },
        ];
        const mockCount = 2;
    
        // Simulamos las respuestas del repositorio
        mockRepo.query.mockResolvedValue(mockFilms);
        mockRepo.count.mockResolvedValue(mockCount);
    
        const req = {
          query: { page: '1', genre: 'Action' },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost'),
          baseUrl: '/films',
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
    
        await filmController.getAll(req, res, next);
    
        // Verificamos que el método "query" del repositorio fue llamado correctamente
        expect(mockRepo.query).toHaveBeenCalledWith(1, 6, 'Action');
        // Verificamos que la respuesta sea enviada correctamente con la estructura adecuada
        expect(res.send).toHaveBeenCalledWith({
          items: mockFilms,
          count: mockCount,
          previous: null,
          next: null,
        });
      });
    
      it('debería devolver la página siguiente si hay más películas', async () => {
        const mockFilms = [
          { id: 1, title: 'Film 1' },
          { id: 2, title: 'Film 2' },
          { id: 3, title: 'Film 3' },
          { id: 4, title: 'Film 4' },
          { id: 5, title: 'Film 5' },
          { id: 6, title: 'Film 6' },
          { id: 7, title: 'Film 7' },
        ];
        const mockCount = 12; // Más de 6 para tener más de una página
    
        mockRepo.query.mockResolvedValue(mockFilms);
        mockRepo.count.mockResolvedValue(mockCount);
    
        const req = {
          query: { page: '1', genre: 'Action' },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost'),
          baseUrl: '/films',
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
    
        await filmController.getAll(req, res, next);
    
        expect(mockRepo.query).toHaveBeenCalledWith(1, 6, 'Action');
        expect(res.send).toHaveBeenCalledWith({
          items: mockFilms,
          count: mockCount,
          previous: null,
          next: 'http://localhost/films?genre=Action&page=2',
        });
      });
      it('debería usar la página 1 si req.query.page no está definida', async () => {
        const mockFilms = [{ id: 1, title: 'Film 1' }];
        const mockCount = 10;
      
        // Simulamos las respuestas del repositorio
        mockRepo.query.mockResolvedValue(mockFilms);
        mockRepo.count.mockResolvedValue(mockCount);
      
        const req = {
          query: {}, 
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost'),
          baseUrl: '/films',
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
      
        await filmController.getAll(req, res, next);
      
        // Verificamos que la consulta haya usado la página 1 por defecto
        expect(mockRepo.query).toHaveBeenCalledWith(1, 6);
        expect(res.send).toHaveBeenCalledWith({
          items: mockFilms,
          count: mockCount,
          previous: null,
          next: 'http://localhost/films?page=2',
        });
      });
      
      it('debería devolver la página anterior si hay una', async () => {
        const mockFilms = [
            { id: 7, title: 'Film 7' },
            { id: 8, title: 'Film 8' },
        ];
        const mockCount = 12; 
    
        mockRepo.query.mockResolvedValue(mockFilms);
        mockRepo.count.mockResolvedValue(mockCount);
    
        const req = {
            query: { page: '2', genre: 'Action' }, 
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost'),
            baseUrl: '/films',
        };
        const res = {
            send: jest.fn(),
        };
        const next = jest.fn();
    
        await filmController.getAll(req, res, next);
    
        expect(mockRepo.query).toHaveBeenCalledWith(2, 6, 'Action');

        expect(res.send).toHaveBeenCalledWith({
            items: mockFilms,
            count: mockCount,
            previous: 'http://localhost/films?genre=Action&page=1', 
            next: null, // No debería haber una página siguiente ya que totalPages es 2 y estamos en la página 2
        });
      });
    
      it('debería devolver null para previous si está en la primera página', async () => {
        const mockFilms = [{ id: 1, title: 'Film 1' }];
        const mockCount = 10; // Más de 1 para tener varias páginas
    
        mockRepo.query.mockResolvedValue(mockFilms);
        mockRepo.count.mockResolvedValue(mockCount);
    
        const req = {
          query: { page: '1' },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost'),
          baseUrl: '/films',
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
    
        await filmController.getAll(req, res, next);
    
        expect(res.send).toHaveBeenCalledWith({
          items: mockFilms,
          count: mockCount,
          previous: null,
          next: 'http://localhost/films?page=2',
        });
      });
    
      it('debería devolver null para next si está en la última página', async () => {
        const mockFilms = [{ id: 7, title: 'Film 7' }];
        const mockCount = 7; // Total de 7 películas, por lo que sólo habrá una página más
    
        mockRepo.query.mockResolvedValue(mockFilms);
        mockRepo.count.mockResolvedValue(mockCount);
    
        const req = {
          query: { page: '2' },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost'),
          baseUrl: '/films',
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
    
        await filmController.getAll(req, res, next);
    
        expect(res.send).toHaveBeenCalledWith({
          items: mockFilms,
          count: mockCount,
          previous: 'http://localhost/films?page=1',
          next: null,
        });
      });
    
      it('debería llamar a next si ocurre un error', async () => {
        const error = new Error('An error occurred');
        mockRepo.query.mockRejectedValue(error);
    
        const req = {
          query: { page: '1', genre: 'Action' },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost'),
          baseUrl: '/films',
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
    
        await filmController.getAll(req, res, next);
    
        expect(next).toHaveBeenCalledWith(error);
      });
  });

  describe('deleteById', () => {
    it('debería eliminar una película y actualizar el usuario', async () => {
      const mockUser = {
        id: 1,
        films: [{ id: 1, title: 'Film 1' }],
      };

      // Simulamos las respuestas de los repositorios
      mockRepo.delete.mockResolvedValue(true);
      mockUserRepo.queryById.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue(true);

      const req = {
        params: { id: 1 },
        body: {
          tokenPayload: { id: 1 },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next = jest.fn();

      await filmController.deleteById(req, res, next);

      // Verificamos que el método "delete" del repositorio fue llamado con el ID correcto
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
      // Verificamos que el usuario fue actualizado correctamente (sin la película eliminada)
      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        id: 1,
        films: [],
      });
      // Verificamos que la respuesta de estado sea 204
      expect(res.status).toHaveBeenCalledWith(204);
      // Verificamos que la respuesta no devuelva datos (solo estado)
      expect(res.send).toHaveBeenCalled();
    });
    it('debería llamar a next si no hay tokenPayload', async () => {
        const req = {
          params: { id: 1 },
          body: {},
        };
        const res = {};
        const next = jest.fn();
  
        await filmController.deleteById(req, res, next);
  
        expect(next).toHaveBeenCalledWith(new Error('No token payload was found'));
    });
    it('should call next function when an error occurs in deleteById', async () => {
        const error = new Error('An error occurred');
        mockRepo.delete.mockRejectedValue(error);
  
        const req = {
          params: { id: 1 },
          body: {
            tokenPayload: { id: 1 },
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };
        const next = jest.fn();
  
        await filmController.deleteById(req, res, next);
  
        expect(next).toHaveBeenCalledWith(error);
      });
  });

  describe('addComment', () => {
    it('debería agregar un comentario a la película', async () => {
      const mockFilm = {
        id: 1,
        title: 'Film 1',
        comments: [],
      };
      const mockUser = { id: 1, name: 'User 1' };

      // Simulamos las respuestas de los repos
      mockRepo.queryById.mockResolvedValue(mockFilm);
      mockUserRepo.queryById.mockResolvedValue(mockUser);
      mockRepo.update.mockResolvedValue({
        ...mockFilm,
        comments: [{ comment: 'Nice movie!', owner: mockUser }],
      });

      const req = {
        params: { id: 1 },
        body: {
          comment: 'Nice movie!',
          tokenPayload: { id: 1 },
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await filmController.addComment(req, res, next);

      // Verificamos que se haya consultado la película y el usuario correctos
      expect(mockRepo.queryById).toHaveBeenCalledWith(1);
      expect(mockUserRepo.queryById).toHaveBeenCalledWith(1);
      // Verificamos que el comentario fue agregado correctamente y la película actualizada
      expect(mockRepo.update).toHaveBeenCalledWith(1, {
        ...mockFilm,
        comments: [{ comment: 'Nice movie!', owner: mockUser }],
      });
      // Verificamos que la respuesta sea enviada correctamente
      expect(res.send).toHaveBeenCalledWith({
        ...mockFilm,
        comments: [{ comment: 'Nice movie!', owner: mockUser }],
      });
    });
    it('should call next function when an error occurs in addComment', async () => {
        const error = new Error('An error occurred');
        mockRepo.queryById.mockRejectedValue(error);
  
        const req = {
          params: { id: 1 },
          body: {
            comment: 'Nice movie!',
            tokenPayload: { id: 1 },
          },
        };
        const res = {
          send: jest.fn(),
        };
        const next = jest.fn();
  
        await filmController.addComment(req, res, next);
  
        expect(next).toHaveBeenCalledWith(error);
      });
  });
});
