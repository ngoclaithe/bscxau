import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_URL } from './api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('https')) return path;

  // Ensure we don't double slash if API_URL ends with /
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(date: string | number | Date): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export function formatCurrency(num: number, currency: string = '₫'): string {
  return `${formatNumber(num)} ${currency}`;
}

export function formatAddress(address: string | null | undefined): string {
  if (!address) return 'N/A';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPercent(num: number, decimals: number = 2): string {
  return `${formatNumber(num, decimals)}%`;
}

export function calculateTimeLeft(expiryTime: number): number {
  return Math.max(0, expiryTime - Date.now());
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatSymbol(symbol: string | null | undefined): string {
  if (!symbol) return '';
  if (symbol === 'BTC/USD') return 'XAU/BSC';
  if (symbol === 'WTI/USD') return 'WTI/BSC';
  return symbol;
}
