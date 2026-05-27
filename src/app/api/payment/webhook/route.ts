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
    console.warn("Webhook signature verification skipped - no webhook secret configured")
    return true
  }

  try {
    const payloadToSign = timestampHeader + "." + payload
    const expectedSignature = createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
      .update(payloadToSign)
      .digest("hex")

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

// Helper to handle successful payment for merchandise order
async function handleMerchPaymentSuccess(orderId: string) {
  const merchOrder = await db.merchOrder.findUnique({ where: { id: orderId } })
  if (!merchOrder || merchOrder.paymentStatus === "paid") return

  await db.merchOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "paid", paidAt: new Date() },
  })

  const orderItems = await db.merchOrderItem.findMany({ where: { orderId } })
  for (const item of orderItems) {
    await db.merchItem.update({
      where: { id: item.itemId },
      data: { soldCount: { increment: item.quantity } },
    })
  }

  console.log(`Payment confirmed for merch order ${merchOrder.orderNumber}`)
}

// Helper to handle failed payment for merchandise order
async function handleMerchPaymentFailed(orderId: string) {
  const merchOrder = await db.merchOrder.findUnique({ where: { id: orderId } })
  if (!merchOrder || merchOrder.paymentStatus === "paid") return

  const orderItems = await db.merchOrderItem.findMany({ where: { orderId } })

  await db.merchOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "failed" },
  })

  for (const item of orderItems) {
    await db.merchItem.update({
      where: { id: item.itemId },
      data: { stock: { increment: item.quantity } },
    })
  }

  console.log(`Payment failed for merch order ${merchOrder.orderNumber} — stock restored`)
}

// Helper to handle successful payment for registration
async function handleRegistrationPaymentSuccess(registrationId: string) {
  const registration = await db.registration.findUnique({ where: { id: registrationId } })
  if (!registration || registration.paymentStatus === "paid") return

  await db.registration.update({
    where: { id: registrationId },
    data: { paymentStatus: "paid", paidAt: new Date() },
  })

  console.log(`Payment confirmed for registration ${registrationId}`)
}

// Helper to handle failed payment for registration
async function handleRegistrationPaymentFailed(registrationId: string) {
  const registration = await db.registration.findUnique({ where: { id: registrationId } })
  if (!registration || registration.paymentStatus === "paid") return

  await db.registration.update({
    where: { id: registrationId },
    data: { paymentStatus: "failed" },
  })

  console.log(`Payment failed for registration ${registrationId}`)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawBody = JSON.stringify(body)

    // Verify webhook signature if headers are present
    const signatureHeader = req.headers.get("paymongo-signature") || ""
    const timestampHeader = req.headers.get("paymongo-timestamp") || ""

    console.log(`[Webhook] Received request, signature present: ${!!signatureHeader}, timestamp present: ${!!timestampHeader}`)
    console.log(`[Webhook] Webhook secret configured: ${PAYMONGO_WEBHOOK_SECRET ? 'yes' : 'no'} (length: ${PAYMONGO_WEBHOOK_SECRET.length})`)

    if (signatureHeader && timestampHeader && PAYMONGO_WEBHOOK_SECRET !== "whsk_your_secret_here") {
      if (!verifyWebhookSignature(rawBody, signatureHeader, timestampHeader)) {
        console.error("Webhook signature verification failed")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log(`[Webhook] Signature verification passed`)
    } else if (!signatureHeader || !timestampHeader) {
      console.warn(`[Webhook] Missing signature/timestamp headers - skipping verification`)
    }

    // PayMongo webhook event types we handle:
    // Source events (e-wallet): source.chargeable
    // Payment events: payment.paid, payment.failed
    const eventType = body?.data?.attributes?.type
    const eventData = body?.data?.attributes?.data

    console.log(`[Webhook] Event type: ${eventType}`)

    if (!eventType) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // ============ SOURCE EVENTS (e-wallet: GCash, Maya, GrabPay) ============
    if (eventType === "source.chargeable") {
      const sourceId = eventData?.id
      const metadata = eventData?.metadata || {}

      if (!sourceId) {
        return NextResponse.json({ error: "Missing source ID" }, { status: 400 })
      }

      const orderType = metadata.orderType || "registration"

      if (orderType === "merchandise") {
        const orderId = metadata.orderId
        if (orderId) {
          await handleMerchPaymentSuccess(orderId)
        }
      } else {
        // Registration — find by payment reference (source ID)
        const registration = await db.registration.findFirst({
          where: { paymentReference: sourceId },
        })
        if (registration) {
          await handleRegistrationPaymentSuccess(registration.id)
        } else {
          console.warn(`Webhook: No registration found for source ID ${sourceId}`)
        }
      }

      return NextResponse.json({ received: true })
    }

    // ============ PAYMENT EVENTS (newer PayMongo API) ============
    if (eventType === "payment.paid") {
      const paymentId = eventData?.id
      const sourceId = eventData?.attributes?.source?.id

      if (!paymentId && !sourceId) {
        return NextResponse.json({ error: "Missing payment/source ID" }, { status: 400 })
      }

      // Try to find by source ID in metadata or in registrations
      // First check payment metadata
      const paymentMetadata = eventData?.attributes?.metadata || {}
      const orderType = paymentMetadata.orderType

      if (orderType === "merchandise" && paymentMetadata.orderId) {
        await handleMerchPaymentSuccess(paymentMetadata.orderId)
      } else if (orderType === "registration" && paymentMetadata.registrationId) {
        await handleRegistrationPaymentSuccess(paymentMetadata.registrationId)
      } else if (sourceId) {
        // Fallback: find registration by source reference
        const registration = await db.registration.findFirst({
          where: { paymentReference: sourceId },
        })
        if (registration) {
          await handleRegistrationPaymentSuccess(registration.id)
        } else {
          // Try merch order by payment reference
          const merchOrder = await db.merchOrder.findFirst({
            where: { paymentReference: sourceId },
          })
          if (merchOrder) {
            await handleMerchPaymentSuccess(merchOrder.id)
          } else {
            console.warn(`Webhook: No order found for source ID ${sourceId}`)
          }
        }
      }

      return NextResponse.json({ received: true })
    }

    if (eventType === "payment.failed") {
      const paymentId = eventData?.id
      const sourceId = eventData?.attributes?.source?.id

      if (!paymentId && !sourceId) {
        return NextResponse.json({ error: "Missing payment/source ID" }, { status: 400 })
      }

      const paymentMetadata = eventData?.attributes?.metadata || {}
      const orderType = paymentMetadata.orderType

      if (orderType === "merchandise" && paymentMetadata.orderId) {
        await handleMerchPaymentFailed(paymentMetadata.orderId)
      } else if (orderType === "registration" && paymentMetadata.registrationId) {
        await handleRegistrationPaymentFailed(paymentMetadata.registrationId)
      } else if (sourceId) {
        const registration = await db.registration.findFirst({
          where: { paymentReference: sourceId },
        })
        if (registration) {
          await handleRegistrationPaymentFailed(registration.id)
        } else {
          const merchOrder = await db.merchOrder.findFirst({
            where: { paymentReference: sourceId },
          })
          if (merchOrder) {
            await handleMerchPaymentFailed(merchOrder.id)
          } else {
            console.warn(`Webhook: No order found for source ID ${sourceId}`)
          }
        }
      }

      return NextResponse.json({ received: true })
    }

    // Unhandled event type — acknowledge but ignore
    console.log(`Webhook: Unhandled event type "${eventType}" — ignored`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
