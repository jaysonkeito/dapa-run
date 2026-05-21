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

    const results = await db.raceResult.findMany({
      include: {
        event: { select: { id: true, title: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Admin results fetch error:", error)
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
    const { eventId, distance, finishers } = body

    if (!eventId || !distance || !finishers) {
      return NextResponse.json({ error: "Event, distance, and finishers are required" }, { status: 400 })
    }

    const result = await db.raceResult.create({
      data: {
        eventId,
        distance,
        finishers: typeof finishers === "string" ? finishers : JSON.stringify(finishers),
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Admin results create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
