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
    const { name, price, image, category, description, sizes, badge, stock } = body

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
        stock: stock !== undefined ? Number(stock) : 0,
      },
    })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'CREATE_MERCH',
      category: 'inventory',
      description: `Created inventory item "${name}"`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { itemId: item.id, name, category },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Admin merchandise create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
