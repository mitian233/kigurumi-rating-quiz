import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function safeToFixed(value: number | undefined | null, digits = 2): string {
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(digits);
  }
  return '-';
}
