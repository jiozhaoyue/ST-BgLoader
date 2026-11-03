import { MediaType } from '../types';

/**
 * The single media-type detector for the whole extension (uploads, URL imports, native
 * background listing, public API). Previously duplicated in five files whose extension
 * lists had already drifted (NativeBgAugmenter was missing m4v/aac/m4a and mislabeled
 * such files as images).
 */
export function detectMediaType(filename: string, mimeType: string = ''): MediaType {
    const ext = filename.split('.').pop()?.toLowerCase().split('?')[0] || '';
    if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext) || mimeType.startsWith('video/')) {
        return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext) || mimeType.startsWith('audio/')) {
        return 'audio';
    }
    if (ext === 'html' || ext === 'htm') {
        return 'html';
    }
    if (ext === 'svg') {
        return 'svg';
    }
    return 'image';
}
