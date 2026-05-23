import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/system-logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await db.systemSetting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { key: string; value: string }[]
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid format. Expected array of {key, value}' }, { status: 400 })
    }

    for (const item of body) {
      await db.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      })
    }

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'UPDATE_SETTINGS',
      category: 'settings',
      description: `Updated ${body.length} system settings`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { keys: body.map((i: { key: string; value: string }) => i.key) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
