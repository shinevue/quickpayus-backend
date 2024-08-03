import multer, { StorageEngine, FileFilterCallback } from 'multer';
import { Request } from 'express';
import ErrorHandler from '../utils/errorHandler';

const generateUniqueFilename = (file: Express.Multer.File): string => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileExtension = file.originalname.split('.').pop();
  return uniqueSuffix + '.' + fileExtension;
};

const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, 'uploads/kyc/'); // Define your destination folder
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    cb(null, generateUniqueFilename(file));
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ErrorHandler('Invalid file type. Only images are allowed.', 401));
  }
};

const imageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB file size limit
});

export {
  imageUpload,
};
