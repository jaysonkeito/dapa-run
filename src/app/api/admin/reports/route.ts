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

    // === Events Summary ===
    const allEvents = await db.event.findMany()
    const now = new Date()
    const upcomingEvents = allEvents.filter((e) => new Date(e.date) >= now).length
    const pastEvents = allEvents.filter((e) => new Date(e.date) < now).length

    // Get all registrations with event info
    const registrations = await db.registration.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, date: true, priceRange: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // On-site registrations
    const onsiteRegistrations = await db.onSiteRegistration.findMany({
      include: {
        event: { select: { id: true, title: true, date: true, priceRange: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by date range if provided
    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr)
      if (from && d < new Date(from)) return false
      if (to && d > new Date(to + 'T23:59:59')) return false
      return true
    }

    const filteredRegs = registrations.filter((r) => filterByDate(r.createdAt))
    const filteredOnsiteRegs = onsiteRegistrations.filter((r) => filterByDate(r.createdAt))

    // Events revenue (from online registrations)
    let eventsRevenue = 0
    filteredRegs.forEach((r) => {
      eventsRevenue += r.totalAmount || 0
    })

    // On-site revenue
    let onsiteRevenue = 0
    filteredOnsiteRegs.forEach((r) => {
      onsiteRevenue += r.amountPaid || 0
    })

    // Total registrations per event
    const eventBreakdown: Record<string, { title: string; count: number; revenue: number }> = {}
    filteredRegs.forEach((r) => {
      if (!eventBreakdown[r.eventId]) {
        eventBreakdown[r.eventId] = { title: r.event.title, count: 0, revenue: 0 }
      }
      eventBreakdown[r.eventId].count++
      eventBreakdown[r.eventId].revenue += r.totalAmount || 0
    })
    filteredOnsiteRegs.forEach((r) => {
      if (!eventBreakdown[r.eventId]) {
        eventBreakdown[r.eventId] = { title: r.event.title, count: 0, revenue: 0 }
      }
      eventBreakdown[r.eventId].count++
      eventBreakdown[r.eventId].revenue += r.amountPaid || 0
    })

    // === Merchandise Summary ===
    const merchItems = await db.merchItem.findMany()
    const totalMerchItems = merchItems.length
    const totalSold = merchItems.reduce((sum, m) => sum + (m.soldCount || 0), 0)

    // POS orders for merch revenue
    const posOrders = await db.pOSOrder.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    const filteredPosOrders = posOrders.filter((o) => filterByDate(o.createdAt))

    let merchRevenueFromPOS = 0
    filteredPosOrders.forEach((o) => {
      merchRevenueFromPOS += o.totalAmount
    })

    const lowStockItems = merchItems.filter((m) => m.stock <= 10).map((m) => ({
      id: m.id,
      name: m.name,
      stock: m.stock,
      soldCount: m.soldCount,
    }))

    // === POS Summary ===
    const totalPOSOrders = filteredPosOrders.length
    const totalPOSRevenue = filteredPosOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const posByPaymentMethod: Record<string, { count: number; revenue: number }> = {}
    filteredPosOrders.forEach((o) => {
      if (!posByPaymentMethod[o.paymentMethod]) {
        posByPaymentMethod[o.paymentMethod] = { count: 0, revenue: 0 }
      }
      posByPaymentMethod[o.paymentMethod].count++
      posByPaymentMethod[o.paymentMethod].revenue += o.totalAmount
    })

    // === Users Summary ===
    const allUsers = await db.user.findMany()
    const totalUsers = allUsers.length
    const usersByRole: Record<string, number> = {}
    allUsers.forEach((u) => {
      usersByRole[u.role] = (usersByRole[u.role] || 0) + 1
    })

    // Monthly registration trends
    const monthlyTrends: Record<string, number> = {}
    filteredRegs.forEach((r) => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7)
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1
    })
    filteredOnsiteRegs.forEach((r) => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7)
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        totalEvents: allEvents.length,
        totalUsers,
        totalRegistrations: filteredRegs.length + filteredOnsiteRegs.length,
        estimatedRevenue: eventsRevenue + onsiteRevenue,
      },
      eventsSummary: {
        totalEvents: allEvents.length,
        upcoming: upcomingEvents,
        past: pastEvents,
        totalRegistrations: filteredRegs.length + filteredOnsiteRegs.length,
        totalRevenue: eventsRevenue + onsiteRevenue,
      },
      registrationsSummary: {
        totalOnline: filteredRegs.length,
        totalOnsite: filteredOnsiteRegs.length,
        totalRevenue: eventsRevenue + onsiteRevenue,
        onlineRevenue: eventsRevenue,
        onsiteRevenue,
      },
      merchandiseSummary: {
        totalItems: totalMerchItems,
        totalSold,
        totalRevenueFromPOS: merchRevenueFromPOS,
        lowStockItems,
      },
      posSummary: {
        totalOrders: totalPOSOrders,
        totalRevenue: totalPOSRevenue,
        byPaymentMethod: Object.entries(posByPaymentMethod).map(([method, data]) => ({
          method,
          count: data.count,
          revenue: data.revenue,
        })),
      },
      usersSummary: {
        totalUsers,
        byRole: Object.entries(usersByRole).map(([role, count]) => ({ role, count })),
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
        totalAmount: r.totalAmount,
      })),
      onsiteRegistrations: filteredOnsiteRegs.map((r) => ({
        id: r.id,
        participantName: r.participantName,
        participantEmail: r.participantEmail,
        participantPhone: r.participantPhone,
        eventTitle: r.event?.title || 'Unknown Event',
        distance: r.distance,
        paymentMethod: r.paymentMethod,
        amountPaid: r.amountPaid,
        createdAt: r.createdAt,
      })),
      posOrders: filteredPosOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        customerName: o.customerName,
        staffName: o.staffName,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          itemName: i.itemName,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
        })),
      })),
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
