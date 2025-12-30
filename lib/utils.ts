import { Paste } from './types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function getCurrentTime(testMode: boolean, testNowMs?: string): number {
  if (testMode && testNowMs) {
    const testTime = parseInt(testNowMs, 10);
    if (!isNaN(testTime)) {
      return testTime;
    }
  }
  return Date.now();
}

export function isPasteExpired(paste: Paste, currentTime: number): boolean {
  if (!paste.ttlSeconds) {
    return false;
  }
  const expiryTime = paste.createdAt + paste.ttlSeconds * 1000;
  return currentTime >= expiryTime;
}

export function isViewLimitExceeded(paste: Paste): boolean {
  if (!paste.maxViews) {
    return false;
  }
  return paste.views >= paste.maxViews;
}

export function isPasteAvailable(paste: Paste, currentTime: number): boolean {
  return !isPasteExpired(paste, currentTime) && !isViewLimitExceeded(paste);
}

export function getRemainingViews(paste: Paste): number | null {
  if (!paste.maxViews) {
    return null;
  }
  return Math.max(0, paste.maxViews - paste.views);
}

export function getExpiresAt(paste: Paste): string | null {
  if (!paste.ttlSeconds) {
    return null;
  }
  const expiryTime = paste.createdAt + paste.ttlSeconds * 1000;
  return new Date(expiryTime).toISOString();
}

