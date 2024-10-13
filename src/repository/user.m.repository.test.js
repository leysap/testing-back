import { UserRepo } from './user.m.repository.js'; 
import { UserModel } from './user.m.model.js'; 
import { HttpError } from '../types/http.error.js';
jest.mock('./user.m.model.js'); 

describe('UserRepo', () => {
    let userRepo;

    beforeEach(() => {
        userRepo = new UserRepo();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should instantiate UserRepo', () => {
        expect(userRepo).toBeInstanceOf(UserRepo);
    });

    test('query should return all users', async () => {
        const mockUsers = [{ name: 'User1' }, { name: 'User2' }];
        UserModel.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUsers),
            }),
        });

        const users = await userRepo.query();
        expect(users).toEqual(mockUsers);
        expect(UserModel.find).toHaveBeenCalledTimes(1);
    });

    test('queryById should return a user by ID', async () => {
        const mockUser = { name: 'User1', _id: '12345' };
        UserModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            }),
        });

        const user = await userRepo.queryById('12345');
        expect(user).toEqual(mockUser);
        expect(UserModel.findById).toHaveBeenCalledWith('12345');
    });

    test('queryById should throw HttpError if user not found', async () => {
        UserModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            }),
        });

        await expect(userRepo.queryById('non-existing-id')).rejects.toThrow(HttpError);
    });

    test('search should return users based on key and value', async () => {
        const mockUsers = [{ name: 'User1' }, { name: 'User2' }];
        UserModel.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUsers),
            }),
        });

        const users = await userRepo.search({ key: 'name', value: 'User1' });
        expect(users).toEqual(mockUsers);
        expect(UserModel.find).toHaveBeenCalledWith({ name: 'User1' });
    });

    test('create should add a new user', async () => {
        const newUser = { name: 'User1' };
        UserModel.create.mockResolvedValue(newUser);

        const createdUser = await userRepo.create(newUser);
        expect(createdUser).toEqual(newUser);
        expect(UserModel.create).toHaveBeenCalledWith(newUser);
    });

    test('update should return updated user', async () => {
        const updatedUser = { name: 'Updated User' };
        UserModel.findByIdAndUpdate.mockReturnValue({
            exec: jest.fn().mockResolvedValue(updatedUser),
        });

        const user = await userRepo.update('12345', updatedUser);
        expect(user).toEqual(updatedUser);
        expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('12345', updatedUser, { new: true });
    });

    test('update should throw HttpError if user not found', async () => {
        UserModel.findByIdAndUpdate.mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
        });

        await expect(userRepo.update('non-existing-id', {})).rejects.toThrow(HttpError);
    });

    test('delete should delete a user', async () => {
        UserModel.findByIdAndDelete.mockReturnValue({
            exec: jest.fn().mockResolvedValue({}),
        });

        await userRepo.delete('12345');
        expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith('12345');
    });

    test('delete should throw HttpError if user not found', async () => {
        UserModel.findByIdAndDelete.mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
        });

        await expect(userRepo.delete('non-existing-id')).rejects.toThrow(HttpError);
    });

    test('count should return number of users', async () => {
        UserModel.countDocuments.mockReturnValue({
            exec: jest.fn().mockResolvedValue(5),
        });

        const count = await userRepo.count();
        expect(count).toBe(5);
        expect(UserModel.countDocuments).toHaveBeenCalled();
    });
});