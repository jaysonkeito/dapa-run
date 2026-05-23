import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const category = url.searchParams.get('category')
    const action = url.searchParams.get('action')
    const search = url.searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (action) where.action = action
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { userName: { contains: search } },
      ]
    }

    const [logs, total] = await Promise.all([
      db.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.systemLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Dev logs GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch system logs' }, { status: 500 })
  }
}
