import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - POS Analytics data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "all" // today, week, month, all

    // Build date filter
    const now = new Date()
    let dateFilter: Date | null = null

    if (period === "today") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === "week") {
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Start from Monday
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
    } else if (period === "month") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const whereClause = dateFilter
      ? { createdAt: { gte: dateFilter } }
      : {}

    // Fetch all orders with items for the period
    const orders = await db.pOSOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    })

    // Calculate summary stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalTransactions = orders.length
    const avgTransactionValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0

    // Payment method breakdown
    const paymentBreakdown = orders.reduce((acc, order) => {
      const method = order.paymentMethod
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 }
      }
      acc[method].count += 1
      acc[method].revenue += order.totalAmount
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    // Best-selling items
    const itemSalesMap = new Map<string, {
      itemId: string
      itemName: string
      totalQuantity: number
      totalRevenue: number
      category: string
    }>()

    // We need to look up merch items for category info
    const allMerchItems = await db.merchItem.findMany()
    const merchCategoryMap = new Map(allMerchItems.map(m => [m.id, m.category]))

    for (const order of orders) {
      for (const item of order.items) {
        const key = `${item.itemId}-${item.size || 'no-size'}`
        const existing = itemSalesMap.get(key)
        if (existing) {
          existing.totalQuantity += item.quantity
          existing.totalRevenue += item.price * item.quantity
        } else {
          itemSalesMap.set(key, {
            itemId: item.itemId,
            itemName: item.itemName,
            totalQuantity: item.quantity,
            totalRevenue: item.price * item.quantity,
            category: merchCategoryMap.get(item.itemId) || 'unknown',
          })
        }
      }
    }

    // Sort best-selling by quantity
    const bestSellingItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)

    // Category breakdown
    const categoryBreakdown = new Map<string, { quantity: number; revenue: number }>()
    for (const item of bestSellingItems) {
      const cat = item.category
      const existing = categoryBreakdown.get(cat) || { quantity: 0, revenue: 0 }
      existing.quantity += item.totalQuantity
      existing.revenue += item.totalRevenue
      categoryBreakdown.set(cat, existing)
    }

    // Daily sales for chart (last 30 days or period)
    const dailySalesMap = new Map<string, { date: string; revenue: number; transactions: number }>()
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      const existing = dailySalesMap.get(dateKey) || { date: dateKey, revenue: 0, transactions: 0 }
      existing.revenue += order.totalAmount
      existing.transactions += 1
      dailySalesMap.set(dateKey, existing)
    }
    const dailySales = Array.from(dailySalesMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    // Recent orders (last 50)
    const recentOrders = orders.slice(0, 50).map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      staffName: order.staffName,
      createdAt: order.createdAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      })),
    }))

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalTransactions,
        avgTransactionValue,
      },
      paymentBreakdown,
      bestSellingItems,
      categoryBreakdown: Object.fromEntries(categoryBreakdown),
      dailySales,
      recentOrders,
    })
  } catch (error) {
    console.error("POS analytics fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
