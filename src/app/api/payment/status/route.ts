import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const ref = searchParams.get("ref")
    const type = searchParams.get("type") || "registration" // "registration" or "merch"

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
        },
      })

      if (!merchOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        )
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
