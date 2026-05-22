import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    await db.merchItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin merchandise delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
