import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAction } from "@/lib/system-logger"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    if (body.price !== undefined) body.price = Number(body.price)
    if (body.stock !== undefined) body.stock = Number(body.stock)

    const item = await db.merchItem.update({
      where: { id },
      data: body,
    })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'UPDATE_MERCH',
      category: 'inventory',
      description: `Updated inventory item "${item.name}"`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { itemId: id, name: item.name },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Admin merchandise update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get item name before deletion for logging
    const item = await db.merchItem.findUnique({ where: { id } })
    const itemName = item?.name || 'Unknown'

    await db.merchItem.delete({ where: { id } })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'DELETE_MERCH',
      category: 'inventory',
      description: `Deleted inventory item "${itemName}"`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { itemId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin merchandise delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
