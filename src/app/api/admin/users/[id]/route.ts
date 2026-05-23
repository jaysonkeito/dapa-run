import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/system-logger'

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
    const { role, name, email, phone, password } = body as { role?: string; name?: string; email?: string; phone?: string; password?: string }

    // If updating role
    if (role !== undefined) {
      if (!['user', 'staff', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      // Cannot modify self
      const currentUserId = (session.user as Record<string, unknown>)?.id
      if (id === currentUserId) {
        return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 })
      }
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) {
      // Cannot modify other admins unless you're changing their role
      if (targetUser.role === 'admin' && role !== 'admin') {
        // Allow admin to change other admin's role
      }
      updateData.role = role
    }
    // Hash password if provided
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    })

    const sessionUser = session.user as Record<string, unknown>
    await logAction({
      action: 'UPDATE_USER',
      category: 'users',
      description: `Updated user "${updated.name}" (${updated.email})`,
      userId: sessionUser?.id as string,
      userName: sessionUser?.name as string,
      userRole: sessionUser?.role as string,
      details: { targetUserId: id, name: updated.name, role: updated.role },
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

    const sessionUser = session.user as Record<string, unknown>
    await logAction({
      action: 'DELETE_USER',
      category: 'users',
      description: `Deleted user "${targetUser.name}" (${targetUser.email})`,
      userId: sessionUser?.id as string,
      userName: sessionUser?.name as string,
      userRole: sessionUser?.role as string,
      details: { deletedUserId: id, name: targetUser.name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
