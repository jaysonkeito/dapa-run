import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateReferenceNumber } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to register for an event" },
        { status: 401 }
      )
    }

    const userId = (session.user as Record<string, unknown>).id as string
    const body = await req.json()
    const { eventId, distance, finisherShirtSize, singletSize, totalAmount, paymentMethod } = body

    if (!eventId || !distance) {
      return NextResponse.json(
        { error: "Event ID and distance are required" },
        { status: 400 }
      )
    }

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

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
    } catch { /* use basePrice */ }

    let computedTotal = distancePrice
    if (!event.isPackage) {
      if (finisherShirtSize) computedTotal += event.finisherShirtPrice
      if (singletSize) computedTotal += event.singletPrice
    }

    const validatedTotalAmount = typeof totalAmount === 'number' && totalAmount === computedTotal
      ? computedTotal
      : computedTotal

    // Determine payment status based on method
    // Cash payments remain "pending" until verified by admin
    // E-wallet payments go through /api/payment/create instead
    const resolvedPaymentMethod = paymentMethod || "cash"
    const paymentStatus = "pending"

    const registration = await db.registration.create({
      data: {
        userId,
        eventId,
        distance,
        finisherShirtSize: finisherShirtSize || null,
        singletSize: singletSize || null,
        totalAmount: validatedTotalAmount,
        paymentMethod: resolvedPaymentMethod,
        paymentStatus,
        referenceNumber: generateReferenceNumber(),
      },
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error("Event registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
