import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/system-logger'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'developer'].includes((session.user as Record<string, unknown>)?.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeTeam = searchParams.get('includeTeam')

    // If includeTeam=true, return all users including admin/staff/developer
    if (includeTeam === 'true') {
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(users)
    }

    // Default: exclude admin, staff, developer (for the Users page)
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { registrations: true } },
      },
      where: {
        role: { notIn: ['admin', 'staff', 'developer'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role } = body as { name: string; email: string; password: string; role?: string }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const assignedRole = role || 'staff'

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    const sessionUser = session.user as Record<string, unknown>
    await logAction({
      action: 'CREATE_USER',
      category: 'users',
      description: `Created user "${name}" (${email}) with role ${assignedRole}`,
      userId: sessionUser?.id as string,
      userName: sessionUser?.name as string,
      userRole: sessionUser?.role as string,
      details: { newUserId: user.id, name, email, role: assignedRole },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
