import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const results = await db.raceResult.findMany({
      include: {
        event: {
          select: { id: true, title: true, date: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Results fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
