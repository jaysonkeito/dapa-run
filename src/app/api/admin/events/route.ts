import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== "admin") {
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
    const { title, date, time, location, priceRange, image, distances, description, status, featured } = body

    if (!title || !date || !time || !location) {
      return NextResponse.json({ error: "Title, date, time, and location are required" }, { status: 400 })
    }

    const event = await db.event.create({
      data: {
        title,
        date,
        time,
        location,
        priceRange: priceRange || "",
        image: image || "/hero-banner.png",
        distances: distances || "",
        description: description || "",
        status: status || "upcoming",
        featured: featured || false,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Admin events create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
