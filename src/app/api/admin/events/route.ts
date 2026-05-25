import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAction } from "@/lib/system-logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await db.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { registrations: true } } },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Admin events fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, date, time, timeEnd, location, priceRange, image, distances, description, status, featured, regCloseDate, regCloseTime, basePrice, finisherShirtPrice, singletPrice, finisherShirtSizes, singletSizes, distancePricing, isPackage } = body

    if (!title || !date || !time || !location) {
      return NextResponse.json({ error: "Title, date, time, and location are required" }, { status: 400 })
    }

    const event = await db.event.create({
      data: {
        title,
        date,
        time,
        timeEnd: timeEnd || "",
        location,
        priceRange: priceRange || "",
        image: image || "/hero-banner.png",
        distances: distances || "",
        description: description || "",
        status: status || "upcoming",
        featured: featured || false,
        regCloseDate: regCloseDate || "",
        regCloseTime: regCloseTime || "",
        basePrice: basePrice || 0,
        finisherShirtPrice: finisherShirtPrice || 0,
        singletPrice: singletPrice || 0,
        finisherShirtSizes: finisherShirtSizes || null,
        singletSizes: singletSizes || null,
        distancePricing: distancePricing || "",
        isPackage: isPackage || false,
      },
    })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'CREATE_EVENT',
      category: 'events',
      description: `Created event "${title}"`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { eventId: event.id, title },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Admin events create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
