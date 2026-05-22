import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const eventId = searchParams.get("eventId")

    const where = eventId ? { eventId } : {}

    const [registrations, onsiteRegistrations] = await Promise.all([
      db.registration.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          event: { select: { id: true, title: true, date: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.onSiteRegistration.findMany({
        where: eventId ? { eventId } : {},
        include: {
          event: { select: { id: true, title: true, date: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ registrations, onsiteRegistrations })
  } catch (error) {
    console.error("Admin registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
