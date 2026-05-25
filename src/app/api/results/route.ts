import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bib = searchParams.get("bib")

    if (!bib) {
      // Return all results if no bib search
      const results = await db.raceResult.findMany({
        include: {
          event: {
            select: { id: true, title: true, date: true, location: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(results)
    }

    // Search by bib number across all race results
    const raceResults = await db.raceResult.findMany({
      include: {
        event: {
          select: { id: true, title: true, date: true, location: true },
        },
      },
    })

    const searchResults: Array<{
      name: string
      bib: string
      gender: string
      distance: string
      time: string
      genderRank: number
      overallRank: number
      eventName: string
      eventDate: string
      eventLocation: string
      eventId: string
    }> = []

    for (const result of raceResults) {
      try {
        const finishers = JSON.parse(result.finishers)
        if (!Array.isArray(finishers)) continue

        for (const f of finishers) {
          if (String(f.bib).toLowerCase() === bib.toLowerCase() || String(f.bib) === bib) {
            searchResults.push({
              name: f.name || 'Unknown',
              bib: String(f.bib),
              gender: f.gender || 'unknown',
              distance: result.distance,
              time: f.time || '—',
              genderRank: f.genderRank || f.rank || 0,
              overallRank: f.rank || 0,
              eventName: result.event?.title || 'Unknown Event',
              eventDate: result.event?.date || '',
              eventLocation: result.event?.location || '',
              eventId: result.eventId,
            })
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("Results search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
