import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAction } from "@/lib/system-logger"

// Helper to generate order number: POS-YYYYMMDD-XXXX
async function generateOrderNumber(): Promise<string> {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0")

  const prefix = `POS-${dateStr}-`

  // Find the latest order with today's prefix
  const latestOrder = await db.pOSOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  })

  let nextNum = 1
  if (latestOrder) {
    const lastNumStr = latestOrder.orderNumber.slice(prefix.length)
    nextNum = parseInt(lastNumStr, 10) + 1
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`
}

// GET - List all POS orders with items
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orders = await db.pOSOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            id: true,
            itemName: true,
            price: true,
            quantity: true,
            size: true,
          },
        },
      },
    })

    const formatted = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName,
      staffName: order.staffName,
      createdAt: order.createdAt,
      items: order.items,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("POS orders fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new POS order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items, paymentMethod, customerName, staffName } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required and must not be empty" }, { status: 400 })
    }

    if (!paymentMethod || !["cash", "gcash", "card"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Payment method must be cash, gcash, or card" }, { status: 400 })
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: "Each item must have itemId and a positive quantity" }, { status: 400 })
      }
    }

    // Look up all merch items by their IDs
    const itemIds = items.map((item: { itemId: string }) => item.itemId)
    const merchItems = await db.merchItem.findMany({
      where: { id: { in: itemIds } },
    })

    // Build a lookup map
    const merchMap = new Map(merchItems.map((m) => [m.id, m]))

    // Validate all items exist
    for (const item of items) {
      if (!merchMap.has(item.itemId)) {
        return NextResponse.json({ error: `Merch item with ID ${item.itemId} not found` }, { status: 400 })
      }
    }

    // Calculate total amount and build order items data
    let totalAmount = 0
    const orderItemsData = items.map((item: { itemId: string; quantity: number; size?: string }) => {
      const merch = merchMap.get(item.itemId)!
      const itemTotal = merch.price * item.quantity
      totalAmount += itemTotal

      return {
        itemId: item.itemId,
        itemName: merch.name,
        price: merch.price,
        quantity: item.quantity,
        size: item.size || null,
      }
    })

    // Generate order number
    const orderNumber = await generateOrderNumber()

    // Create the order with items in a transaction
    const order = await db.pOSOrder.create({
      data: {
        orderNumber,
        totalAmount,
        paymentMethod,
        customerName: customerName || "Walk-in Customer",
        staffName: staffName || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          select: {
            id: true,
            itemName: true,
            price: true,
            quantity: true,
            size: true,
          },
        },
      },
    })

    // Decrement stock and increment soldCount for each item
    for (const item of items) {
      try {
        const merchItem = await db.merchItem.findUnique({ where: { id: item.itemId } })
        if (merchItem) {
          await db.merchItem.update({
            where: { id: item.itemId },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          })
        }
      } catch (e) {
        console.error('Failed to update stock for item:', item.itemId, e)
      }
    }

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'POS_SALE',
      category: 'pos',
      description: `POS sale ${orderNumber} - ₱${totalAmount.toLocaleString()}`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { orderId: order.id, orderNumber, totalAmount, paymentMethod, itemCount: items.length },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("POS order create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
