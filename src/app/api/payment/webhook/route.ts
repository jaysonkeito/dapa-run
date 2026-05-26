import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { db } from "@/lib/db"

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || ""

// Verify PayMongo webhook signature
function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  timestampHeader: string
): boolean {
  if (!PAYMONGO_WEBHOOK_SECRET || PAYMONGO_WEBHOOK_SECRET === "whsk_your_secret_here") {
    // In test mode without webhook secret configured, skip verification
    console.warn("Webhook signature verification skipped - no webhook secret configured")
    return true
  }

  try {
    // PayMongo webhook signature format: t=timestamp,v1=signature
    const payloadToSign = timestampHeader + "." + payload
    const expectedSignature = createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
      .update(payloadToSign)
      .digest("hex")

    // Parse signature header
    const signatures = signatureHeader.split(",").reduce(
      (acc, pair) => {
        const [key, value] = pair.split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>
    )

    return signatures["v1"] === expectedSignature
  } catch (error) {
    console.error("Webhook signature verification error:", error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawBody = JSON.stringify(body)

    // Verify webhook signature if headers are present
    const signatureHeader = req.headers.get("paymongo-signature") || ""
    const timestampHeader = req.headers.get("paymongo-timestamp") || ""

    if (signatureHeader && timestampHeader && PAYMONGO_WEBHOOK_SECRET !== "whsk_your_secret_here") {
      if (!verifyWebhookSignature(rawBody, signatureHeader, timestampHeader)) {
        console.error("Webhook signature verification failed")
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        )
      }
    }

    // PayMongo webhook payload structure:
    // { data: { id, type, attributes: { type: "source.chargeable"|"source.failed", data: { id: sourceId, ... } } } }
    const eventType = body?.data?.attributes?.type
    const sourceData = body?.data?.attributes?.data
    const sourceId = sourceData?.id
    const metadata = sourceData?.metadata || {}

    if (!eventType || !sourceId) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    // Determine order type from metadata
    const orderType = metadata.orderType || "registration" // default to registration for backward compat

    if (orderType === "merchandise") {
      // Handle merchandise order payment
      const orderId = metadata.orderId

      if (!orderId) {
        console.warn(`Webhook: No orderId in metadata for merch source ${sourceId}`)
        return NextResponse.json({ received: true })
      }

      const merchOrder = await db.merchOrder.findUnique({
        where: { id: orderId },
      })

      if (!merchOrder) {
        console.warn(`Webhook: No merch order found for ID ${orderId}`)
        return NextResponse.json({ received: true })
      }

      if (merchOrder.paymentStatus === "paid") {
        // Already processed, skip
        return NextResponse.json({ received: true })
      }

      if (eventType === "source.chargeable") {
        // Payment succeeded
        await db.merchOrder.update({
          where: { id: merchOrder.id },
          data: {
            paymentStatus: "paid",
            paidAt: new Date(),
          },
        })

        // Update sold count for each item
        const orderItems = await db.merchOrderItem.findMany({
          where: { orderId: merchOrder.id },
        })
        for (const item of orderItems) {
          await db.merchItem.update({
            where: { id: item.itemId },
            data: { soldCount: { increment: item.quantity } },
          })
        }

        console.log(`Payment confirmed for merch order ${merchOrder.orderNumber}`)
      } else if (eventType === "source.failed") {
        // Payment failed — restore stock
        const orderItems = await db.merchOrderItem.findMany({
          where: { orderId: merchOrder.id },
        })

        await db.merchOrder.update({
          where: { id: merchOrder.id },
          data: { paymentStatus: "failed" },
        })

        // Restore stock
        for (const item of orderItems) {
          await db.merchItem.update({
            where: { id: item.itemId },
            data: { stock: { increment: item.quantity } },
          })
        }

        console.log(`Payment failed for merch order ${merchOrder.orderNumber} — stock restored`)
      }
    } else {
      // Handle event registration payment (original behavior)
      const registration = await db.registration.findFirst({
        where: { paymentReference: sourceId },
      })

      if (!registration) {
        console.warn(`Webhook: No registration found for source ID ${sourceId}`)
        return NextResponse.json({ received: true })
      }

      if (registration.paymentStatus === "paid") {
        // Already processed
        return NextResponse.json({ received: true })
      }

      if (eventType === "source.chargeable") {
        await db.registration.update({
          where: { id: registration.id },
          data: {
            paymentStatus: "paid",
            paidAt: new Date(),
          },
        })
        console.log(`Payment confirmed for registration ${registration.id}`)
      } else if (eventType === "source.failed") {
        await db.registration.update({
          where: { id: registration.id },
          data: {
            paymentStatus: "failed",
          },
        })
        console.log(`Payment failed for registration ${registration.id}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
