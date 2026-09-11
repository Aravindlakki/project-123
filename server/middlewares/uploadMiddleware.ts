import multer from 'multer';
import { RequestHandler } from 'express';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const uploadFile: RequestHandler = upload.single('file') as any;
