import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Get all registrations with event info
    const registrations = await db.registration.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, date: true, priceRange: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by date range if provided
    const filteredRegs = registrations.filter((r) => {
      const regDate = new Date(r.createdAt)
      if (from && regDate < new Date(from)) return false
      if (to && regDate > new Date(to + 'T23:59:59')) return false
      return true
    })

    // Get total events count
    const totalEvents = await db.event.count()
    const totalUsers = await db.user.count()
    const totalRegistrations = filteredRegs.length

    // Estimate revenue (extract average price from priceRange)
    let estimatedRevenue = 0
    filteredRegs.forEach((r) => {
      const priceStr = r.event.priceRange
      // Try to extract numeric values from price range like "₱500.00 – ₱1,800.00"
      const prices = priceStr.match(/[\d,]+/g)
      if (prices && prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + parseInt(p.replace(/,/g, ''), 10), 0) / prices.length
        estimatedRevenue += avgPrice
      }
    })

    // Event-wise registration breakdown
    const eventBreakdown: Record<string, { title: string; count: number; revenue: number }> = {}
    filteredRegs.forEach((r) => {
      if (!eventBreakdown[r.eventId]) {
        eventBreakdown[r.eventId] = { title: r.event.title, count: 0, revenue: 0 }
      }
      eventBreakdown[r.eventId].count++
      const priceStr = r.event.priceRange
      const prices = priceStr.match(/[\d,]+/g)
      if (prices && prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + parseInt(p.replace(/,/g, ''), 10), 0) / prices.length
        eventBreakdown[r.eventId].revenue += avgPrice
      }
    })

    // Monthly registration trends
    const monthlyTrends: Record<string, number> = {}
    filteredRegs.forEach((r) => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7) // YYYY-MM
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        totalEvents,
        totalUsers,
        totalRegistrations,
        estimatedRevenue: Math.round(estimatedRevenue),
      },
      eventBreakdown: Object.entries(eventBreakdown).map(([eventId, data]) => ({
        eventId,
        ...data,
      })),
      monthlyTrends: Object.entries(monthlyTrends)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      registrations: filteredRegs.map((r) => ({
        id: r.id,
        userName: r.user.name,
        userEmail: r.user.email,
        eventTitle: r.event.title,
        eventDate: r.event.date,
        distance: r.distance,
        createdAt: r.createdAt,
        priceRange: r.event.priceRange,
      })),
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
