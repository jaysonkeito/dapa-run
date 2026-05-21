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

    if (body.finishers && typeof body.finishers !== "string") {
      body.finishers = JSON.stringify(body.finishers)
    }

    const result = await db.raceResult.update({
      where: { id },
      data: body,
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

    await db.raceResult.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin results delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
