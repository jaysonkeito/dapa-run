import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - List all on-site registrations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const registrations = await db.onSiteRegistration.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            title: true,
            date: true,
          },
        },
      },
    })

    const formatted = registrations.map((reg) => ({
      id: reg.id,
      eventId: reg.eventId,
      participantName: reg.participantName,
      participantEmail: reg.participantEmail,
      participantPhone: reg.participantPhone,
      distance: reg.distance,
      paymentMethod: reg.paymentMethod,
      amountPaid: reg.amountPaid,
      finisherShirtSize: reg.finisherShirtSize,
      singletSize: reg.singletSize,
      staffName: reg.staffName,
      createdAt: reg.createdAt,
      event: reg.event,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("On-site registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new on-site registration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { eventId, participantName, participantEmail, participantPhone, distance, paymentMethod, amountPaid, staffName, finisherShirtSize, singletSize } = body

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    if (!participantName) {
      return NextResponse.json({ error: "Participant name is required" }, { status: 400 })
    }

    if (!distance) {
      return NextResponse.json({ error: "Distance is required" }, { status: 400 })
    }

    if (!paymentMethod || !["cash", "gcash", "card"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Payment method must be cash, gcash, or card" }, { status: 400 })
    }

    // Validate the event exists
    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const registration = await db.onSiteRegistration.create({
      data: {
        eventId,
        participantName,
        participantEmail: participantEmail || null,
        participantPhone: participantPhone || null,
        distance,
        paymentMethod,
        amountPaid: amountPaid ? Number(amountPaid) : 0,
        finisherShirtSize: finisherShirtSize || null,
        singletSize: singletSize || null,
        staffName: staffName || null,
      },
      include: {
        event: {
          select: {
            title: true,
            date: true,
          },
        },
      },
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error("On-site registration create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
