import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counts for all models
    const [
      settingsCount,
      usersCount,
      eventsCount,
      merchCount,
      registrationsCount,
      onsiteRegCount,
      posOrdersCount,
      raceResultsCount,
      systemLogsCount,
    ] = await Promise.all([
      db.systemSetting.count(),
      db.user.count(),
      db.event.count(),
      db.merchItem.count(),
      db.registration.count(),
      db.onSiteRegistration.count(),
      db.pOSOrder.count(),
      db.raceResult.count(),
      db.systemLog.count(),
    ])

    const tables = [
      { model: 'settings', label: 'Settings', count: settingsCount },
      { model: 'users', label: 'Users', count: usersCount },
      { model: 'events', label: 'Events', count: eventsCount },
      { model: 'merchandise', label: 'Merchandise', count: merchCount },
      { model: 'registrations', label: 'Registrations', count: registrationsCount },
      { model: 'onsite-registrations', label: 'On-site Registrations', count: onsiteRegCount },
      { model: 'pos-orders', label: 'POS Orders', count: posOrdersCount },
      { model: 'race-results', label: 'Race Results', count: raceResultsCount },
      { model: 'system-logs', label: 'System Logs', count: systemLogsCount },
    ]

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Dev database GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch database overview' }, { status: 500 })
  }
}
