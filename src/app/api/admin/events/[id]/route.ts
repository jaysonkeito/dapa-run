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

    const event = await db.event.update({
      where: { id },
      data: body,
    })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'UPDATE_EVENT',
      category: 'events',
      description: `Updated event "${event.title}"`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { eventId: id, title: event.title },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Admin events update error:", error)
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

    // Get event title before deletion for logging
    const event = await db.event.findUnique({ where: { id } })
    const eventTitle = event?.title || 'Unknown'

    await db.event.delete({ where: { id } })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'DELETE_EVENT',
      category: 'events',
      description: `Deleted event "${eventTitle}"`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { eventId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin events delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
