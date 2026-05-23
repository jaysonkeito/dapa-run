import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/system-logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await db.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Dev settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { id: string; value: string }[]
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid format. Expected array of {id, value}' }, { status: 400 })
    }

    for (const item of body) {
      await db.systemSetting.update({
        where: { id: item.id },
        data: { value: item.value },
      })
    }

    const user = session.user as Record<string, unknown>
    await logAction({
      action: 'DEVELOPER_UPDATE_SETTINGS',
      category: 'developer',
      description: `Updated ${body.length} system settings via developer panel`,
      userId: user?.id as string,
      userName: user?.name as string,
      userRole: user?.role as string,
      details: { settingIds: body.map((i: { id: string; value: string }) => i.id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dev settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
