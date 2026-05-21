import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const category = searchParams.get("category")

    const where = category && category !== "all" ? { category } : {}

    const items = await db.merchItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Merchandise fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
