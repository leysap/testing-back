import { FireBase } from './firebase'; 
import { readFile } from 'fs/promises';
import { uploadBytes, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

jest.mock('fs/promises');
jest.mock('firebase/storage');
jest.mock('firebase/app');

describe('FireBase class', () => {
  let fireBase;

  beforeAll(() => {
    initializeApp.mockReturnValue({});
    getStorage.mockReturnValue({});
    
    // Se crea una instancia de FireBase
    fireBase = new FireBase();
  });

  it('should initialize Firebase correctly', () => {
    expect(initializeApp).toHaveBeenCalledWith(expect.any(Object)); 
    expect(getStorage).toHaveBeenCalledWith(fireBase.app); 
  });

  it('should upload a file and return its download URL', async () => {
    const mockFileBuffer = Buffer.from('mock file content');
    const mockDownloadURL = 'http://mock.url/download';

    // Simular el comportamiento de las funciones de fs/promises y Firebase
    readFile.mockResolvedValue(mockFileBuffer);
    uploadBytes.mockResolvedValue();
    getDownloadURL.mockResolvedValue(mockDownloadURL);

    const fileName = 'test.txt';
    const downloadURL = await fireBase.uploadFile(fileName);

    expect(readFile).toHaveBeenCalledWith(`public/uploads/${fileName}`);
    expect(ref).toHaveBeenCalledWith(fireBase.storage, `public/uploads/${fileName}`);
    expect(uploadBytes).toHaveBeenCalled();
    expect(downloadURL).toBe(mockDownloadURL);
  });

  it('should throw an error when the file does not exist', async () => {
    readFile.mockRejectedValue(new Error('File not found'));

    await expect(fireBase.uploadFile('nonexistent.txt')).rejects.toThrow('File not found');
  });
});
