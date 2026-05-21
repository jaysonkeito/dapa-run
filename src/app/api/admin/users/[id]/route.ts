import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { role } = body as { role: string }

    if (!['user', 'staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Cannot modify self
    const currentUserId = (session.user as Record<string, unknown>)?.id
    if (id === currentUserId) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 })
    }

    // Cannot promote anyone to admin
    if (role === 'admin') {
      return NextResponse.json({ error: 'Cannot promote users to admin role' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot modify other admins
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot modify admin users' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Users PUT error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Cannot delete self
    const currentUserId = (session.user as Record<string, unknown>)?.id
    if (id === currentUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cannot delete admins
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 400 })
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
