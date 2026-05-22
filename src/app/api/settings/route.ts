import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const defaults: Record<string, string> = {
  siteTagline: 'Dumaguete',
  siteTitle: 'DAPA RUN - Dumaguete',
  siteDescription: "Philippines' premier running event organizer",
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export async function GET() {
  try {
    const settings = await db.systemSetting.findMany()
    const settingsMap: Record<string, string> = {}

    // First pass: add all DB values, normalizing keys to camelCase
    settings.forEach((s) => {
      const camelKey = snakeToCamel(s.key)
      settingsMap[camelKey] = s.value
      // Also keep the original key for backward compatibility
      settingsMap[s.key] = s.value
    })

    // Apply defaults for any missing camelCase keys
    Object.entries(defaults).forEach(([key, value]) => {
      if (!settingsMap[key]) settingsMap[key] = value
    })

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({
      siteTagline: 'Dumaguete',
      siteTitle: 'DAPA RUN - Dumaguete',
      siteDescription: "Philippines' premier running event organizer"
    })
  }
}
