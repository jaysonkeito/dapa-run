import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["admin", "staff"].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const items = await db.merchItem.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Admin merchandise fetch error:", error)
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
    const { name, price, image, category, description, sizes, badge } = body

    if (!name || price === undefined || !category) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 })
    }

    const item = await db.merchItem.create({
      data: {
        name,
        price: Number(price),
        image: image || "/merch-banner.png",
        category,
        description: description || "",
        sizes: sizes || null,
        badge: badge || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Admin merchandise create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
