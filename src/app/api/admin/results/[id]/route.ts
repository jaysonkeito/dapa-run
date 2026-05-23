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

    if (body.finishers && typeof body.finishers !== "string") {
      body.finishers = JSON.stringify(body.finishers)
    }

    const result = await db.raceResult.update({
      where: { id },
      data: body,
    })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'UPDATE_RESULT',
      category: 'results',
      description: `Updated race result`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { resultId: id },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin results update error:", error)
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

    // Get result info before deletion for logging
    const existingResult = await db.raceResult.findUnique({ where: { id } })

    await db.raceResult.delete({ where: { id } })

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'DELETE_RESULT',
      category: 'results',
      description: `Deleted race result for distance ${existingResult?.distance || 'unknown'}`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { resultId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin results delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
