import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import sharp from "sharp"

// Escape XML special characters for SVG
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getPaymentMethodLabel(method: string | null): string {
  if (!method) return "N/A"
  const labels: Record<string, string> = {
    gcash: "GCash",
    maya: "Maya",
    grabpay: "GrabPay",
    cash: "Cash",
  }
  return labels[method] || method.toUpperCase()
}

// Build a full SVG receipt image
function buildReceiptSVG(data: {
  registrationId: string
  participantName: string
  participantEmail: string
  eventName: string
  eventDate: string
  eventLocation: string
  distance: string
  finisherShirtSize: string | null
  singletSize: string | null
  totalAmount: number
  paymentMethod: string | null
  paymentReference: string | null
  paidAt: string | null
  siteNameSuffix: string
}): string {
  const W = 800
  const H = 1100
  const cx = W / 2

  // Format amount
  const amountStr = `₱${data.totalAmount.toLocaleString()}.00`

  // Format paid date
  const paidDateStr = data.paidAt
    ? formatDate(new Date(data.paidAt))
    : "Pending"

  // Short ref ID for display
  const shortRef = escapeXml(data.registrationId.substring(0, 8).toUpperCase())

  // Payment method
  const payMethod = escapeXml(getPaymentMethodLabel(data.paymentMethod))

  // Shirt sizes display
  const shirtInfo: string[] = []
  if (data.finisherShirtSize) shirtInfo.push(`Finisher Shirt: ${data.finisherShirtSize}`)
  if (data.singletSize) shirtInfo.push(`Singlet: ${data.singletSize}`)
  const shirtLine = shirtInfo.length > 0 ? escapeXml(shirtInfo.join("  |  ")) : "None"

  // Escape all user-provided data for SVG
  const safeName = escapeXml(data.participantName)
  const safeEmail = escapeXml(data.participantEmail)
  const safeEventName = escapeXml(data.eventName)
  const safeEventDate = escapeXml(data.eventDate)
  const safeLocation = escapeXml(data.eventLocation)
  const safeDistance = escapeXml(data.distance)
  const safeSuffix = escapeXml(data.siteNameSuffix)
  const safeRef = data.paymentReference ? escapeXml(data.paymentReference) : null

  // Row helper for detail rows
  const detailRow = (label: string, value: string, y: number) => `
    <text x="80" y="${y}" font-size="16" fill="#6B7280" font-family="Liberation Sans, DejaVu Sans, sans-serif">${label}</text>
    <text x="720" y="${y}" text-anchor="end" font-size="16" font-weight="600" fill="#1F2937" font-family="Liberation Sans, DejaVu Sans, sans-serif">${value}</text>
    <line x1="80" y1="${y + 10}" x2="720" y2="${y + 10}" stroke="#F3F4F6" stroke-width="1"/>
  `

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#EA580C;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="amountGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#C2410C;stop-opacity:1" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${W}" height="${H}" fill="#FFFFFF"/>

    <!-- Header bar -->
    <rect width="${W}" height="140" fill="url(#headerGrad)"/>

    <!-- Logo circle placeholder -->
    <circle cx="${cx}" cy="50" r="28" fill="rgba(255,255,255,0.2)"/>
    <text x="${cx}" y="57" text-anchor="middle" font-size="20" font-weight="900" fill="#FFFFFF" font-family="Liberation Sans, DejaVu Sans, sans-serif">DR</text>

    <!-- DAPA RUN title -->
    <text x="${cx}" y="100" text-anchor="middle" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="2" font-family="Liberation Sans, DejaVu Sans, sans-serif">DAPA RUN</text>

    <!-- Suffix -->
    <text x="${cx}" y="125" text-anchor="middle" font-size="14" font-weight="300" fill="rgba(255,255,255,0.7)" letter-spacing="3" font-family="Liberation Sans, DejaVu Sans, sans-serif">${safeSuffix.toUpperCase()}</text>

    <!-- RECEIPT label -->
    <text x="${cx}" y="180" text-anchor="middle" font-size="24" font-weight="700" fill="#1F2937" font-family="Liberation Sans, DejaVu Sans, sans-serif">OFFICIAL RECEIPT</text>
    <text x="${cx}" y="200" text-anchor="middle" font-size="12" fill="#9CA3AF" letter-spacing="2" font-family="Liberation Sans, DejaVu Sans, sans-serif">REGISTRATION PAYMENT</text>

    <!-- Divider -->
    <line x1="80" y1="220" x2="720" y2="220" stroke="#E5E7EB" stroke-width="2"/>

    <!-- Amount section with background -->
    <rect x="80" y="235" width="640" height="80" rx="12" fill="#FFF7ED"/>
    <rect x="80" y="235" width="640" height="80" rx="12" stroke="#FDBA74" stroke-width="1" fill="none"/>
    <text x="${cx}" y="265" text-anchor="middle" font-size="14" fill="#9A3412" font-weight="500" font-family="Liberation Sans, DejaVu Sans, sans-serif">AMOUNT PAID</text>
    <text x="${cx}" y="300" text-anchor="middle" font-size="36" font-weight="900" fill="#EA580C" font-family="Liberation Sans, DejaVu Sans, sans-serif">${amountStr}</text>

    <!-- Detail rows -->
    ${detailRow("Reference No.", shortRef, 360)}
    ${detailRow("Participant", safeName, 400)}
    ${detailRow("Email", safeEmail, 440)}
    ${detailRow("Event", safeEventName, 480)}
    ${detailRow("Event Date", safeEventDate, 520)}
    ${detailRow("Location", safeLocation, 560)}
    ${detailRow("Distance Category", safeDistance, 600)}
    ${detailRow("Apparel", shirtLine, 640)}
    ${detailRow("Payment Method", payMethod, 680)}
    ${detailRow("Date Paid", paidDateStr, 720)}

    <!-- Payment reference -->
    ${safeRef ? `
    <rect x="80" y="750" width="640" height="45" rx="8" fill="#F0FDF4"/>
    <rect x="80" y="750" width="640" height="45" rx="8" stroke="#86EFAC" stroke-width="1" fill="none"/>
    <text x="100" y="778" font-size="13" fill="#166534" font-family="Liberation Sans, DejaVu Sans, sans-serif">Payment Reference: ${safeRef}</text>
    <circle cx="700" cy="772" r="10" fill="#22C55E"/>
    <text x="700" y="777" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF" font-family="Liberation Sans, DejaVu Sans, sans-serif">✓</text>
    ` : ''}

    <!-- Footer section -->
    <line x1="80" y1="830" x2="720" y2="830" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4,4"/>

    <!-- Race kit claim notice -->
    <rect x="80" y="855" width="640" height="65" rx="10" fill="#EFF6FF"/>
    <rect x="80" y="855" width="640" height="65" rx="10" stroke="#93C5FD" stroke-width="1" fill="none"/>
    <text x="${cx}" y="880" text-anchor="middle" font-size="13" font-weight="700" fill="#1E40AF" font-family="Liberation Sans, DejaVu Sans, sans-serif">PRESENT THIS RECEIPT TO CLAIM YOUR RACE KIT</text>
    <text x="${cx}" y="902" text-anchor="middle" font-size="11" fill="#3B82F6" font-family="Liberation Sans, DejaVu Sans, sans-serif">Show this receipt to the staff/organizer on event day</text>

    <!-- Bottom branding -->
    <line x1="80" y1="950" x2="720" y2="950" stroke="#E5E7EB" stroke-width="1"/>

    <text x="${cx}" y="980" text-anchor="middle" font-size="11" fill="#9CA3AF" font-family="Liberation Sans, DejaVu Sans, sans-serif">This is an official receipt from DAPA RUN ${safeSuffix}</text>
    <text x="${cx}" y="1000" text-anchor="middle" font-size="10" fill="#D1D5DB" font-family="Liberation Sans, DejaVu Sans, sans-serif">Generated on ${formatDate(new Date())} at ${formatTime(new Date())}</text>

    <!-- Bottom accent bar -->
    <rect y="${H - 8}" width="${W}" height="8" fill="url(#headerGrad)"/>
  </svg>`

  return svg
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as Record<string, unknown>).id as string
    const searchParams = req.nextUrl.searchParams
    const registrationId = searchParams.get("id")

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 })
    }

    // Get registration with event and user details
    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        user: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Verify ownership (user can only get their own receipt, unless admin/staff)
    const userRole = (session.user as Record<string, unknown>).role as string
    const isAdminOrStaff = userRole === 'admin' || userRole === 'staff'
    if (registration.userId !== userId && !isAdminOrStaff) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Only allow receipt for paid registrations
    if (registration.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed yet" }, { status: 400 })
    }

    // Get site settings for suffix
    const suffixSetting = await db.systemSetting.findUnique({ where: { key: "site_name_suffix" } })
    const siteNameSuffix = suffixSetting?.value || "Dumaguete"

    // Format event date
    let eventDateStr = registration.event.date
    try {
      const d = new Date(registration.event.date + "T00:00:00")
      eventDateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    } catch { /* use raw */ }

    // Build SVG receipt
    const svg = buildReceiptSVG({
      registrationId: registration.id,
      participantName: registration.user.name,
      participantEmail: registration.user.email,
      eventName: registration.event.title,
      eventDate: eventDateStr,
      eventLocation: registration.event.location,
      distance: registration.distance,
      finisherShirtSize: registration.finisherShirtSize,
      singletSize: registration.singletSize,
      totalAmount: registration.totalAmount,
      paymentMethod: registration.paymentMethod,
      paymentReference: registration.paymentReference,
      paidAt: registration.paidAt?.toISOString() || null,
      siteNameSuffix,
    })

    // Convert SVG to JPG using sharp
    const jpgBuffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: 95 })
      .toBuffer()

    // Return JPG with download headers
    const filename = `DAPA-RUN-Receipt-${registrationId.substring(0, 8).toUpperCase()}.jpg`

    return new NextResponse(jpgBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Receipt generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
