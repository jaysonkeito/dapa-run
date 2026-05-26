import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bib = searchParams.get('bib')

    if (!bib) {
      return NextResponse.json({ error: 'Bib number is required' }, { status: 400 })
    }

    // Search through all race results for the bib number
    const results = await db.raceResult.findMany({
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
          },
        },
      },
    })

    let foundFinisher = null
    let foundEvent = null
    let foundDistance = ''

    for (const result of results) {
      try {
        const finishers = JSON.parse(result.finishers)
        if (!Array.isArray(finishers)) continue

        const finisher = finishers.find((f: { bib?: string }) => f.bib === bib.trim())
        if (finisher) {
          foundFinisher = finisher
          foundEvent = result.event
          foundDistance = result.distance
          break
        }
      } catch {
        continue
      }
    }

    if (!foundFinisher || !foundEvent) {
      return NextResponse.json({ error: 'No runner found with that bib number' }, { status: 404 })
    }

    // Calculate ranks
    const allFinishersForDistance = results
      .filter(r => r.eventId === foundEvent.id && r.distance === foundDistance)
      .flatMap(r => {
        try {
          return JSON.parse(r.finishers)
        } catch {
          return []
        }
      })

    const overallRank = allFinishersForDistance
      .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
      .findIndex((f: { bib: string }) => f.bib === bib.trim()) + 1

    const genderFinishers = allFinishersForDistance.filter(
      (f: { gender: string }) => f.gender === foundFinisher.gender
    )
    const genderRank = genderFinishers
      .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
      .findIndex((f: { bib: string }) => f.bib === bib.trim()) + 1

    return NextResponse.json({
      name: foundFinisher.name,
      bib: foundFinisher.bib,
      gender: foundFinisher.gender,
      distance: foundDistance,
      time: foundFinisher.time,
      eventName: foundEvent.title,
      eventDate: foundEvent.date,
      eventLocation: foundEvent.location,
      genderRank: genderRank > 0 ? genderRank : foundFinisher.rank,
      overallRank: overallRank > 0 ? overallRank : foundFinisher.rank,
    })
  } catch (error) {
    console.error('Certificate search error:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
