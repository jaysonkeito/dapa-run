import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a reference number in the format: MMDDYYYYHHMMRRR
 * Where: MM=month, DD=day, YYYY=year, HH=24h hour, MM=minute, RRR=random 3 digits
 * Uses Asia/Manila timezone (UTC+8) so the reference matches the user's local time.
 * Example: January 01, 2001 at 01:00 PM → 010120011300123
 */
export function generateReferenceNumber(): string {
  const now = new Date()
  // Use Asia/Manila timezone so the reference number matches the user's local time
  const manilaParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const getPart = (type: string) => manilaParts.find(p => p.type === type)?.value ?? '00'

  const month = getPart('month')
  const day = getPart('day')
  const year = getPart('year')
  const hour = getPart('hour')
  const minute = getPart('minute')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `${month}${day}${year}${hour}${minute}${random}`
}
