import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a reference number in the format: MMDDYYYYHHMMRRR
 * Where: MM=month, DD=day, YYYY=year, HH=24h hour, MM=minute, RRR=random 3 digits
 * Example: January 01, 2001 at 01:00 → 010120010100123
 */
export function generateReferenceNumber(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const year = String(now.getFullYear())
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `${month}${day}${year}${hour}${minute}${random}`
}
