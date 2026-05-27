import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as Record<string, unknown>).id as string

    const registrations = await db.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      eventId: reg.eventId,
      distance: reg.distance,
      finisherShirtSize: reg.finisherShirtSize,
      singletSize: reg.singletSize,
      totalAmount: reg.totalAmount,
      paymentStatus: reg.paymentStatus,
      paymentMethod: reg.paymentMethod,
      paymentReference: reg.paymentReference,
      paidAt: reg.paidAt?.toISOString() || null,
      createdAt: reg.createdAt.toISOString(),
      event: {
        title: reg.event.title,
        date: reg.event.date,
        location: reg.event.location,
        image: reg.event.image,
      },
    }))

    return NextResponse.json({ registrations: formattedRegistrations })
  } catch (error) {
    console.error("User registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
