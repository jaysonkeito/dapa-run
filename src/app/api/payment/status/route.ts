import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ""

// Directly check PayMongo API for source/payment status
async function checkPayMongoStatus(sourceId: string): Promise<{ paid: boolean; status: string } | null> {
  try {
    // Try checking the source status first
    const sourceRes = await fetch(`https://api.paymongo.com/v1/sources/${sourceId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
      },
    })

    if (sourceRes.ok) {
      const sourceData = await sourceRes.json()
      const sourceStatus = sourceData?.data?.attributes?.status
      console.log(`[PayMongo Fallback] Source ${sourceId} status: ${sourceStatus}`)

      if (sourceStatus === "chargeable" || sourceStatus === "paid") {
        return { paid: true, status: sourceStatus }
      }

      if (sourceStatus === "failed") {
        return { paid: false, status: "failed" }
      }
    }

    // Also try the payments endpoint for this source
    const paymentRes = await fetch(`https://api.paymongo.com/v1/payments?source_id=${sourceId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
      },
    })

    if (paymentRes.ok) {
      const paymentData = await paymentRes.json()
      const payments = paymentData?.data || []

      for (const payment of payments) {
        const payStatus = payment?.attributes?.status
        if (payStatus === "paid") {
          return { paid: true, status: "paid" }
        }
      }
    }

    return null
  } catch (error) {
    console.error("[PayMongo Fallback] Error checking status:", error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const ref = searchParams.get("ref")
    const type = searchParams.get("type") || "registration" // "registration" or "merch"
    const forceCheck = searchParams.get("forceCheck") === "true"

    if (!ref) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      )
    }

    if (type === "merch") {
      // Check merchandise order payment status
      const merchOrder = await db.merchOrder.findUnique({
        where: { id: ref },
        select: {
          id: true,
          orderNumber: true,
          paymentStatus: true,
          paymentMethod: true,
          totalAmount: true,
          paymentReference: true,
        },
      })

      if (!merchOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        )
      }

      // If status is pending and we have a payment reference, check PayMongo directly
      if (merchOrder.paymentStatus === "pending" && merchOrder.paymentReference && merchOrder.paymentMethod !== "cash") {
        const payMongoResult = await checkPayMongoStatus(merchOrder.paymentReference)
        if (payMongoResult?.paid) {
          // Update the order status in the database
          await db.merchOrder.update({
            where: { id: ref },
            data: { paymentStatus: "paid", paidAt: new Date() },
          })

          // Update stock counts
          const orderItems = await db.merchOrderItem.findMany({ where: { orderId: ref } })
          for (const item of orderItems) {
            await db.merchItem.update({
              where: { id: item.itemId },
              data: { soldCount: { increment: item.quantity } },
            })
          }

          console.log(`[PayMongo Fallback] Updated merch order ${merchOrder.orderNumber} to paid`)

          return NextResponse.json({
            ...merchOrder,
            paymentStatus: "paid",
            type: "merch",
            statusUpdatedByFallback: true,
          })
        } else if (payMongoResult?.status === "failed") {
          await db.merchOrder.update({
            where: { id: ref },
            data: { paymentStatus: "failed" },
          })

          // Restore stock
          const orderItems = await db.merchOrderItem.findMany({ where: { orderId: ref } })
          for (const item of orderItems) {
            await db.merchItem.update({
              where: { id: item.itemId },
              data: { stock: { increment: item.quantity } },
            })
          }

          return NextResponse.json({
            ...merchOrder,
            paymentStatus: "failed",
            type: "merch",
            statusUpdatedByFallback: true,
          })
        }
      }

      return NextResponse.json({
        ...merchOrder,
        type: "merch",
      })
    } else {
      // Check registration payment status (original behavior)
      const registration = await db.registration.findUnique({
        where: { id: ref },
        select: {
          id: true,
          paymentStatus: true,
          paymentMethod: true,
          totalAmount: true,
          distance: true,
          finisherShirtSize: true,
          singletSize: true,
          paymentReference: true,
          paidAt: true,
          event: {
            select: {
              title: true,
              date: true,
              location: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (!registration) {
        return NextResponse.json(
          { error: "Registration not found" },
          { status: 404 }
        )
      }

      // If status is pending and we have a payment reference, check PayMongo directly
      if (registration.paymentStatus === "pending" && registration.paymentReference && registration.paymentMethod !== "cash") {
        const payMongoResult = await checkPayMongoStatus(registration.paymentReference)
        if (payMongoResult?.paid) {
          // Update the registration status in the database
          await db.registration.update({
            where: { id: ref },
            data: { paymentStatus: "paid", paidAt: new Date() },
          })

          console.log(`[PayMongo Fallback] Updated registration ${ref} to paid`)

          return NextResponse.json({
            ...registration,
            paymentStatus: "paid",
            eventName: registration.event.title,
            eventDate: registration.event.date,
            eventLocation: registration.event.location,
            participantName: registration.user.name,
            participantEmail: registration.user.email,
            type: "registration",
            statusUpdatedByFallback: true,
          })
        } else if (payMongoResult?.status === "failed") {
          await db.registration.update({
            where: { id: ref },
            data: { paymentStatus: "failed" },
          })

          return NextResponse.json({
            ...registration,
            paymentStatus: "failed",
            eventName: registration.event.title,
            eventDate: registration.event.date,
            eventLocation: registration.event.location,
            participantName: registration.user.name,
            participantEmail: registration.user.email,
            type: "registration",
            statusUpdatedByFallback: true,
          })
        }
      }

      return NextResponse.json({
        ...registration,
        eventName: registration.event.title,
        eventDate: registration.event.date,
        eventLocation: registration.event.location,
        participantName: registration.user.name,
        participantEmail: registration.user.email,
        type: "registration",
      })
    }
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
