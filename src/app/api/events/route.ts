import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")

    const where = status ? { status } : {}

    const events = await db.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Events fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
