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

    // Include stock and soldCount in response
    const formatted = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      description: item.description,
      sizes: item.sizes,
      badge: item.badge,
      stock: item.stock ?? 0,
      soldCount: item.soldCount ?? 0,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Merchandise fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
