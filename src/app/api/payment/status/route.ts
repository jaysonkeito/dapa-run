import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const ref = searchParams.get("ref")

    if (!ref) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      )
    }

    const registration = await db.registration.findUnique({
      where: { id: ref },
      select: {
        id: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
      },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(registration)
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
