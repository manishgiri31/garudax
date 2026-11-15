// Crew photo: picked on this device, resized to 256x256 in a canvas, kept in localStorage.
// Nothing is fetched or uploaded. The photo never leaves the browser.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'outpost.crewPhoto';
export const CREW_PHOTO_SIZE = 256;
export const CREW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const CHANGE_EVENT = 'outpost-crew-photo-change';

export function loadCrewPhoto(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function notifyCrewPhotoChanged(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeCrewPhoto(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function removeCrewPhoto(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing to remove.
  }
  notifyCrewPhotoChanged();
}

/** Checks type and size before any reading happens. Returns an error message, or null if OK. */
export function validateCrewPhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file (PNG, JPG, or WebP).';
  }
  if (file.size > CREW_PHOTO_MAX_BYTES) {
    return 'That image is over 5 MB. Please choose a smaller one.';
  }
  return null;
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = objectUrl;
  });
}

/** Centre-crops the image to a square and draws it at 256x256. Returns a JPEG data URL. */
export async function resizeToCrewPhoto(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = CREW_PHOTO_SIZE;
    canvas.height = CREW_PHOTO_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, CREW_PHOTO_SIZE, CREW_PHOTO_SIZE);
    return canvas.toDataURL('image/jpeg', 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Saves a data URL. Returns an error message if storage is full or blocked. */
export function saveCrewPhoto(dataUrl: string): string | null {
  try {
    window.localStorage.setItem(STORAGE_KEY, dataUrl);
  } catch {
    return 'Could not save the photo on this device. Storage may be full.';
  }
  notifyCrewPhotoChanged();
  return null;
}

/** Reads the saved photo and updates whenever it changes, in any component. */
export function useCrewPhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(() => loadCrewPhoto());
  useEffect(() => subscribeCrewPhoto(() => setPhoto(loadCrewPhoto())), []);
  return photo;
}
