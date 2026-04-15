import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, locale: string = 'ar-EG') {
  return new Intl.NumberFormat(locale).format(num);
}
