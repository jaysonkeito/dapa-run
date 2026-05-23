import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const defaults: Record<string, string> = {
  siteTagline: '',
  site_name_suffix: 'Dumaguete',
  siteTitle: 'DAPA RUN - Dumaguete',
  siteDescription: "Philippines' premier running event organizer",
  site_hero_heading: '',
  site_hero_description: '',
  site_featured_heading: 'Featured Event',
  site_featured_subheading: "Don't miss our upcoming race",
  site_upcoming_heading: 'Upcoming Events',
  site_upcoming_subheading: 'Find your next race',
  site_merch_heading: 'Shop Merch',
  site_merch_subheading: 'Gear up for your next run',
  site_merch_banner_heading: 'New Collection Available',
  site_merch_banner_description: 'Check out our latest running gear — from professional racing shoes to performance apparel and accessories.',
  site_cta_heading: 'Ready to Run?',
  site_cta_description: "Join thousands of runners who have made DAPA RUN their go-to race organizer. Whether you're a beginner or a seasoned runner, we have an event for you.",
  site_footer_description: "Philippines' premier running event organizer. We create unforgettable race experiences that inspire and challenge runners of all levels.",
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
      siteTagline: '',
      site_name_suffix: 'Dumaguete',
      siteNameSuffix: 'Dumaguete',
      siteTitle: 'DAPA RUN - Dumaguete',
      siteDescription: "Philippines' premier running event organizer",
      site_hero_heading: '',
      site_hero_description: '',
      site_featured_heading: 'Featured Event',
      site_featured_subheading: "Don't miss our upcoming race",
      site_upcoming_heading: 'Upcoming Events',
      site_upcoming_subheading: 'Find your next race',
      site_merch_heading: 'Shop Merch',
      site_merch_subheading: 'Gear up for your next run',
      site_merch_banner_heading: 'New Collection Available',
      site_merch_banner_description: 'Check out our latest running gear — from professional racing shoes to performance apparel and accessories.',
      site_cta_heading: 'Ready to Run?',
      site_cta_description: "Join thousands of runners who have made DAPA RUN their go-to race organizer. Whether you're a beginner or a seasoned runner, we have an event for you.",
      site_footer_description: "Philippines' premier running event organizer. We create unforgettable race experiences that inspire and challenge runners of all levels.",
    })
  }
}
