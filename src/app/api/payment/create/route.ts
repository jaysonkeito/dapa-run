import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ""
const SITE_URL = process.env.NEXTAUTH_URL || "https://dapa-run.space-z.ai"

// Map our payment method names to PayMongo source types
const PAYMONGO_SOURCE_TYPES: Record<string, string> = {
  gcash: "gcash",
  maya: "paymaya",
  grabpay: "grab_pay",
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to make a payment" },
        { status: 401 }
      )
    }

    const userId = (session.user as Record<string, unknown>).id as string
    const userName = (session.user as Record<string, unknown>).name as string
    const userEmail = (session.user as Record<string, unknown>).email as string

    const body = await req.json()
    const {
      eventId,
      distance,
      finisherShirtSize,
      singletSize,
      totalAmount,
      paymentMethod,
    } = body

    if (!eventId || !distance || !paymentMethod) {
      return NextResponse.json(
        { error: "Event ID, distance, and payment method are required" },
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

    // Validate event exists
    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Check for existing registration
    const existingReg = await db.registration.findFirst({
      where: { userId, eventId },
    })
    if (existingReg) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      )
    }

    // Server-side total amount validation
    let distancePrice = event.basePrice
    try {
      const pricing = event.distancePricing ? JSON.parse(event.distancePricing) : {}
      if (pricing[distance]) {
        distancePrice = pricing[distance]
      }
    } catch {
      /* use basePrice */
    }

    let computedTotal = distancePrice
    if (!event.isPackage) {
      if (finisherShirtSize) computedTotal += event.finisherShirtPrice
      if (singletSize) computedTotal += event.singletPrice
    }

    // Ensure minimum amount for PayMongo (₱100 = 10000 centavos)
    if (computedTotal < 100) {
      return NextResponse.json(
        { error: "Minimum amount for e-wallet payment is ₱100" },
        { status: 400 }
      )
    }

    // Create registration with pending payment
    const registration = await db.registration.create({
      data: {
        userId,
        eventId,
        distance,
        finisherShirtSize: finisherShirtSize || null,
        singletSize: singletSize || null,
        totalAmount: computedTotal,
        paymentStatus: "pending",
        paymentMethod,
      },
    })

    // Create PayMongo Source
    const amountInCentavos = computedTotal * 100 // PayMongo requires centavos
    const sourceType = PAYMONGO_SOURCE_TYPES[paymentMethod]

    const paymongoPayload = {
      data: {
        attributes: {
          type: sourceType,
          amount: amountInCentavos,
          currency: "PHP",
          redirect: {
            success: `${SITE_URL}/payment/success?ref=${registration.id}`,
            failed: `${SITE_URL}/payment/failed?ref=${registration.id}`,
          },
          billing: {
            name: userName || "Customer",
            email: userEmail || "",
          },
          metadata: {
            registrationId: registration.id,
            eventId,
            distance,
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

      // Update registration as failed
      await db.registration.update({
        where: { id: registration.id },
        data: { paymentStatus: "failed" },
      })

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
    await db.registration.update({
      where: { id: registration.id },
      data: { paymentReference: sourceId },
    })

    return NextResponse.json({
      sourceId,
      checkoutUrl,
      registrationId: registration.id,
    })
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
