import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/lib/jwt';
import { Errors } from './error';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed types: client-declared MIME → { stored extension, magic-byte check }.
// The extension comes from this table (never from the client's filename), and
// the magic-byte check runs against the stored file's first bytes, so a
// renamed executable or script cannot enter the uploads directory just by
// lying about its Content-Type.
// Audio formats exist for E-Simaan recitation uploads (MediaRecorder produces
// audio/webm on Chromium/Firefox and audio/mp4 on WebKit).
interface AllowedType {
  extension: string;
  matches: (buf: Buffer) => boolean;
}

const ascii = (s: string) => Buffer.from(s, 'ascii');

const isRiff = (buf: Buffer, format: string) =>
  buf.length >= 12 &&
  buf.subarray(0, 4).equals(ascii('RIFF')) &&
  buf.subarray(8, 12).equals(ascii(format));

// ISO-BMFF (MP4/M4A): box size (4 bytes) then 'ftyp'.
const isIsoBmff = (buf: Buffer) => buf.length >= 8 && buf.subarray(4, 8).equals(ascii('ftyp'));

// EBML header — WebM and Matroska containers.
const isEbml = (buf: Buffer) =>
  buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;

const ALLOWED_TYPES: Record<string, AllowedType> = {
  'image/jpeg': {
    extension: '.jpg',
    matches: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  'image/png': {
    extension: '.png',
    matches: (buf) =>
      buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  },
  'image/webp': {
    extension: '.webp',
    matches: (buf) => isRiff(buf, 'WEBP'),
  },
  'application/pdf': {
    extension: '.pdf',
    matches: (buf) => buf.length >= 4 && buf.subarray(0, 4).equals(ascii('%PDF')),
  },
  'video/mp4': { extension: '.mp4', matches: isIsoBmff },
  'audio/mp4': { extension: '.m4a', matches: isIsoBmff },
  'audio/webm': { extension: '.webm', matches: isEbml },
  'audio/ogg': {
    extension: '.ogg',
    matches: (buf) => buf.length >= 4 && buf.subarray(0, 4).equals(ascii('OggS')),
  },
  'audio/mpeg': {
    extension: '.mp3',
    // ID3v2 tag, or a bare MPEG frame sync (11 set bits).
    matches: (buf) =>
      (buf.length >= 3 && buf.subarray(0, 3).equals(ascii('ID3'))) ||
      (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0),
  },
  'audio/wav': {
    extension: '.wav',
    matches: (buf) => isRiff(buf, 'WAVE'),
  },
};

/** True when the buffer's leading bytes are plausible for the declared MIME type. */
export function matchesMagicBytes(mimetype: string, buf: Buffer): boolean {
  const allowed = ALLOWED_TYPES[mimetype];
  return allowed ? allowed.matches(buf) : false;
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Unique name; extension comes from the MIME table above, never from the
    // client-supplied filename (which could smuggle .php, .html, ...).
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = ALLOWED_TYPES[file.mimetype]?.extension ?? '.bin';
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// Configure file filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPG, PNG, WebP, PDF, MP4, audio'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Read the stored file's first bytes and verify they match the declared MIME
 * type. Deletes the file and returns false on mismatch, so nothing that fails
 * the check survives on disk.
 */
export async function verifyStoredFile(file: Express.Multer.File): Promise<boolean> {
  const head = Buffer.alloc(16);
  const fd = await fs.promises.open(file.path, 'r');
  try {
    const { bytesRead } = await fd.read(head, 0, head.length, 0);
    if (matchesMagicBytes(file.mimetype, head.subarray(0, bytesRead))) {
      return true;
    }
  } finally {
    await fd.close();
  }
  await fs.promises.unlink(file.path).catch(() => undefined);
  return false;
}

// Middleware to map uploaded file to body.fileUrl
export const handleSingleUpload = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      void (async () => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'UPLOAD_ERROR',
              message: err.message,
            },
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'UPLOAD_ERROR',
              message: err.message,
            },
          });
        }

        // If file uploaded, map path to fileUrl in body
        if (req.file) {
          // Content check: the declared MIME type got the file past the
          // filter; now the actual bytes have to back it up.
          if (!(await verifyStoredFile(req.file))) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'UPLOAD_ERROR',
                message: 'File content does not match its declared type',
              },
            });
          }

          // Construct public URL
          const protocol = req.protocol;
          const host = req.get('host');
          const filename = req.file.filename;
          req.body.fileUrl = `${protocol}://${host}/uploads/${filename}`;

          // Also map other metadata if needed
          if (!req.body.fileName) {
            req.body.fileName = req.file.originalname;
          }
          if (!req.body.fileType) {
            if (req.file.mimetype.startsWith('image/')) req.body.fileType = 'image';
            else if (req.file.mimetype.startsWith('video/')) req.body.fileType = 'video';
            else req.body.fileType = 'document';
          }
        }

        next();
      })().catch(next);
    });
  };
};

/**
 * Authentication gate for serving stored uploads. Files contain personal data
 * (student photos, documents — UU 27/2022 PDP territory), so /uploads is no
 * longer an anonymous public directory.
 *
 * Browsers fetch these via <img src>/<a href>, which cannot send an
 * Authorization header, so a valid access token is also accepted as a
 * `?token=` query parameter (appended by the web client's authFileUrl helper).
 */
export function uploadsAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length);
    } else if (typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      throw Errors.unauthorized('Authentication required to access uploaded files');
    }

    const payload = verifyToken(token);
    if (payload.type !== 'access' || payload.isTemp) {
      throw Errors.unauthorized('Invalid token');
    }

    next();
  } catch (error) {
    next(error instanceof Error && 'statusCode' in error ? error : Errors.unauthorized());
  }
}
