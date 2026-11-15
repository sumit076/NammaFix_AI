import type { ImageMeta, StoredImage } from '../types';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 720;

/** Validates an image file and returns a down-scaled JPEG data-URL (keeps localStorage small) plus its metadata. */
export function readImage(file: File): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file (JPG, PNG or WebP).'));
    if (file.size > MAX_BYTES) return reject(new Error('Image is larger than 10 MB. Please choose a smaller photo.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Could not process the image in this browser.'));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const meta: ImageMeta = { name: file.name, type: file.type, sizeKB: Math.round(file.size / 1024), width: img.width, height: img.height };
      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      URL.revokeObjectURL(url);
      resolve({ dataUrl, meta });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}
