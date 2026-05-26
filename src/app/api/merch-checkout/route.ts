import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ""
const SITE_URL = process.env.NEXTAUTH_URL || "https://dapa-run.space-z.ai"

// Map payment method names to PayMongo source types
const PAYMONGO_SOURCE_TYPES: Record<string, string> = {
  gcash: "gcash",
  maya: "paymaya",
  grabpay: "grab_pay",
}

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `DR-${timestamp}-${random}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to place an order" },
        { status: 401 }
      )
    }

    const userId = (session.user as Record<string, unknown>).id as string
    const userName = (session.user as Record<string, unknown>).name as string
    const userEmail = (session.user as Record<string, unknown>).email as string

    const body = await req.json()
    const { items, totalAmount, paymentMethod } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required" },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      )
    }

    // Validate payment method
    if (!PAYMONGO_SOURCE_TYPES[paymentMethod]) {
      return NextResponse.json(
        { error: "Invalid payment method. Supported: gcash, maya, grabpay" },
        { status: 400 }
      )
    }

    // Validate items exist and compute server-side total
    let computedTotal = 0
    const validatedItems = []

    for (const item of items) {
      const merchItem = await db.merchItem.findUnique({
        where: { id: item.id },
      })

      if (!merchItem) {
        return NextResponse.json(
          { error: `Item not found: ${item.name}` },
          { status: 404 }
        )
      }

      // Check stock
      if (merchItem.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${merchItem.name}. Available: ${merchItem.stock}` },
          { status: 400 }
        )
      }

      const itemTotal = merchItem.price * item.quantity
      computedTotal += itemTotal

      validatedItems.push({
        itemId: merchItem.id,
        itemName: merchItem.name,
        price: merchItem.price,
        quantity: item.quantity,
        size: item.size || null,
        image: merchItem.image,
      })
    }

    // Ensure minimum amount for PayMongo (₱100 = 10000 centavos)
    if (computedTotal < 100) {
      return NextResponse.json(
        { error: "Minimum amount for e-wallet payment is ₱100" },
        { status: 400 }
      )
    }

    // Verify total matches (with tolerance for rounding)
    if (Math.abs(computedTotal - totalAmount) > 1) {
      return NextResponse.json(
        { error: "Total amount mismatch. Please refresh and try again." },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create merch order with pending payment
    const merchOrder = await db.merchOrder.create({
      data: {
        userId,
        orderNumber,
        totalAmount: computedTotal,
        paymentStatus: "pending",
        paymentMethod,
        items: {
          create: validatedItems,
        },
      },
    })

    // Decrement stock for each item
    for (const item of validatedItems) {
      await db.merchItem.update({
        where: { id: item.itemId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    // Create PayMongo Source
    const amountInCentavos = computedTotal * 100
    const sourceType = PAYMONGO_SOURCE_TYPES[paymentMethod]

    const paymongoPayload = {
      data: {
        attributes: {
          type: sourceType,
          amount: amountInCentavos,
          currency: "PHP",
          redirect: {
            success: `${SITE_URL}/payment/success?type=merch&ref=${merchOrder.id}`,
            failed: `${SITE_URL}/payment/failed?type=merch&ref=${merchOrder.id}`,
          },
          billing: {
            name: userName || "Customer",
            email: userEmail || "",
          },
          metadata: {
            orderType: "merchandise",
            orderId: merchOrder.id,
            orderNumber: merchOrder.orderNumber,
          },
        },
      },
    }

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/sources", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify(paymongoPayload),
    })

    const paymongoData = await paymongoResponse.json()

    if (!paymongoResponse.ok) {
      console.error("PayMongo source creation failed:", paymongoData)

      // Update order as failed and restore stock
      await db.merchOrder.update({
        where: { id: merchOrder.id },
        data: { paymentStatus: "failed" },
      })

      // Restore stock
      for (const item of validatedItems) {
        await db.merchItem.update({
          where: { id: item.itemId },
          data: { stock: { increment: item.quantity } },
        })
      }

      const errorMessage =
        paymongoData?.errors?.[0]?.detail || "Failed to create payment source"
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const sourceId = paymongoData.data.id
    const checkoutUrl = paymongoData.data.attributes.redirect.checkout_url

    // Save payment reference
    await db.merchOrder.update({
      where: { id: merchOrder.id },
      data: { paymentReference: sourceId },
    })

    return NextResponse.json({
      sourceId,
      checkoutUrl,
      orderId: merchOrder.id,
      orderNumber: merchOrder.orderNumber,
    })
  } catch (error) {
    console.error("Merch checkout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
