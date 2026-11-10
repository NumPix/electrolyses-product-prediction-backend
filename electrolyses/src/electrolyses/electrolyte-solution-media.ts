import { randomUUID } from 'node:crypto';

export const DEFAULT_IMAGE_KEY = 'default-compound.jpg';
export const DEFAULT_VIDEO_KEY = 'default-compound.mp4';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export function generateMediaKey(kind: 'image' | 'video', extension: string): string {
  return `electrolyte-solution-${kind}-${randomUUID()}.${extension}`;
}
