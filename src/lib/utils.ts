import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { sha256 } from 'js-sha256';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const canUseWebCrypto =
  typeof globalThis !== 'undefined' &&
  typeof globalThis.crypto !== 'undefined' &&
  typeof globalThis.crypto.subtle !== 'undefined';

async function hashWithWebCrypto(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Password hashing utility
export async function hashPassword(password: string): Promise<string> {
  if (canUseWebCrypto) {
    try {
      return await hashWithWebCrypto(password);
    } catch (error) {
      console.warn('Falling back to polyfill hashing:', error);
    }
  }
  return sha256(password);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}