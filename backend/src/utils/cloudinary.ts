import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Detect whether Cloudinary is actually configured with real credentials.
// Placeholder values (from .env.example) or missing vars mean we fall back to
// saving uploads to local disk, served via the /uploads static route.
const isPlaceholder = (v?: string) =>
  !v || v.startsWith('<<') || v.startsWith('your_');

const cloudinaryConfigured =
  !!process.env.CLOUDINARY_URL ||
  (!isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
    !isPlaceholder(process.env.CLOUDINARY_API_KEY) &&
    !isPlaceholder(process.env.CLOUDINARY_API_SECRET));

if (cloudinaryConfigured) {
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('[Cloudinary] Configured from individual env vars, cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  } else {
    console.log('[Cloudinary] CLOUDINARY_URL detected — SDK auto-config active');
  }
} else {
  console.log('[Cloudinary] Not configured — uploads will be saved to local disk (/uploads)');
}

// Local-disk upload directory (served statically by server.ts at /uploads)
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const saveToLocalDisk = (buffer: Buffer): string => {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  const filename = `${randomUUID()}.png`;
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  // Return an absolute URL so the frontend can load it directly from the backend.
  const base = process.env.PUBLIC_API_BASE || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${filename}`;
};

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = 'linksports/profiles'
): Promise<string> => {
  // Fall back to local disk when Cloudinary isn't configured (e.g. local dev).
  if (!cloudinaryConfigured) {
    return Promise.resolve(saveToLocalDisk(buffer));
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (err, result) => {
        if (err || !result) {
          console.error('[Cloudinary] Upload stream error:', JSON.stringify(err));
          return reject(err ?? new Error('Upload failed'));
        }
        resolve(result.secure_url);
      })
      .end(buffer);
  });
};
