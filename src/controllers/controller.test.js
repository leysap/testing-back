import { Controller } from './controller'; 

describe('Controller', () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = new Controller();
    controller.repo = {
      query: jest.fn(),
      count: jest.fn(),
      queryById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    req = { params: {}, body: {} };
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('getAll', () => {
    it('should send all items and count', async () => {
      const mockItems = [{ id: 1, name: 'Item 1' }];
      controller.repo.query.mockResolvedValue(mockItems);
      controller.repo.count.mockResolvedValue(1);

      await controller.getAll(req, res, next);

      expect(res.send).toHaveBeenCalledWith({
        items: mockItems,
        count: 1,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Error fetching items');
      controller.repo.query.mockRejectedValue(error);

      await controller.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should send item by ID', async () => {
      req.params.id = '1';
      const mockItem = { id: 1, name: 'Item 1' };
      controller.repo.queryById.mockResolvedValue(mockItem);

      await controller.getById(req, res, next);

      expect(res.send).toHaveBeenCalledWith(mockItem);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      req.params.id = '1';
      const error = new Error('Error fetching item by ID');
      controller.repo.queryById.mockRejectedValue(error);

      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('patch', () => {
    it('should update item and respond with status 202', async () => {
      req.params.id = '1';
      req.body = { name: 'Updated Item' };
      const mockUpdatedItem = { id: 1, name: 'Updated Item' };
      controller.repo.update.mockResolvedValue(mockUpdatedItem);

      await controller.patch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.send).toHaveBeenCalledWith(mockUpdatedItem);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      req.params.id = '1';
      req.body = { name: 'Updated Item' };
      const error = new Error('Error updating item');
      controller.repo.update.mockRejectedValue(error);

      await controller.patch(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteById', () => {
    it('should delete item and respond with status 204', async () => {
      req.params.id = '1';
      controller.repo.delete.mockResolvedValue();

      await controller.deleteById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      req.params.id = '1';
      const error = new Error('Error deleting item');
      controller.repo.delete.mockRejectedValue(error);

      await controller.deleteById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
