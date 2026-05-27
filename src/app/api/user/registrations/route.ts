import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ""

// Directly check PayMongo API for source/payment status
async function checkPayMongoStatus(sourceId: string): Promise<{ paid: boolean; status: string } | null> {
  try {
    const sourceRes = await fetch(`https://api.paymongo.com/v1/sources/${sourceId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
      },
    })

    if (sourceRes.ok) {
      const sourceData = await sourceRes.json()
      const sourceStatus = sourceData?.data?.attributes?.status

      if (sourceStatus === "chargeable" || sourceStatus === "paid") {
        return { paid: true, status: sourceStatus }
      }
      if (sourceStatus === "failed") {
        return { paid: false, status: "failed" }
      }
    }

    const paymentRes = await fetch(`https://api.paymongo.com/v1/payments?source_id=${sourceId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
      },
    })

    if (paymentRes.ok) {
      const paymentData = await paymentRes.json()
      const payments = paymentData?.data || []
      for (const payment of payments) {
        if (payment?.attributes?.status === "paid") {
          return { paid: true, status: "paid" }
        }
      }
    }

    return null
  } catch (error) {
    console.error("[PayMongo Fallback] Error checking status:", error)
    return null
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as Record<string, unknown>).id as string

    const registrations = await db.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Check PayMongo for any pending e-wallet payments
    for (const reg of registrations) {
      if (reg.paymentStatus === "pending" && reg.paymentReference && reg.paymentMethod !== "cash") {
        const result = await checkPayMongoStatus(reg.paymentReference)
        if (result?.paid) {
          await db.registration.update({
            where: { id: reg.id },
            data: { paymentStatus: "paid", paidAt: new Date() },
          })
          console.log(`[PayMongo Fallback] Updated registration ${reg.id} to paid via registrations API`)
        } else if (result?.status === "failed") {
          await db.registration.update({
            where: { id: reg.id },
            data: { paymentStatus: "failed" },
          })
        }
      }
    }

    // Re-fetch after potential updates
    const updatedRegistrations = await db.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedRegistrations = updatedRegistrations.map((reg) => ({
      id: reg.id,
      eventId: reg.eventId,
      distance: reg.distance,
      finisherShirtSize: reg.finisherShirtSize,
      singletSize: reg.singletSize,
      totalAmount: reg.totalAmount,
      paymentStatus: reg.paymentStatus,
      paymentMethod: reg.paymentMethod,
      paymentReference: reg.paymentReference,
      referenceNumber: reg.referenceNumber,
      paidAt: reg.paidAt?.toISOString() || null,
      createdAt: reg.createdAt.toISOString(),
      event: {
        title: reg.event.title,
        date: reg.event.date,
        location: reg.event.location,
        image: reg.event.image,
      },
    }))

    return NextResponse.json({ registrations: formattedRegistrations })
  } catch (error) {
    console.error("User registrations fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
