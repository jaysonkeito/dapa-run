import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // PayMongo webhook payload structure:
    // { data: { id, type, attributes: { type: "source.chargeable"|"source.failed", data: { id: sourceId, ... } } } }
    const eventType = body?.data?.attributes?.type
    const sourceData = body?.data?.attributes?.data
    const sourceId = sourceData?.id

    if (!eventType || !sourceId) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      )
    }

    // Find registration by payment reference (PayMongo source ID)
    const registration = await db.registration.findFirst({
      where: { paymentReference: sourceId },
    })

    if (!registration) {
      console.warn(`Webhook: No registration found for source ID ${sourceId}`)
      return NextResponse.json({ received: true })
    }

    if (eventType === "source.chargeable") {
      // Payment succeeded
      await db.registration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: "paid",
          paidAt: new Date(),
        },
      })
      console.log(`Payment confirmed for registration ${registration.id}`)
    } else if (eventType === "source.failed") {
      // Payment failed
      await db.registration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: "failed",
        },
      })
      console.log(`Payment failed for registration ${registration.id}`)
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
