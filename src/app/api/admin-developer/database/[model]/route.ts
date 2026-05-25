import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/system-logger'

// Define which fields are editable for each model
const editableFields: Record<string, string[]> = {
  settings: ['value'],
  users: ['name', 'phone'],
  events: ['title', 'description', 'location', 'time', 'distances', 'priceRange'],
  merchandise: ['name', 'description', 'price', 'stock', 'badge'],
}

const readOnlyModels = ['system-logs'] // Only system-logs is truly read-only

export async function GET(
  request: Request,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { model } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    let records: unknown[] = []
    let total = 0

    switch (model) {
      case 'settings':
        total = await db.systemSetting.count()
        records = await db.systemSetting.findMany({
          skip,
          take: limit,
          orderBy: { key: 'asc' },
        })
        break

      case 'users':
        total = await db.user.count()
        records = await db.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        break

      case 'events':
        if (search) {
          records = await db.event.findMany({
            where: {
              OR: [
                { title: { contains: search } },
                { location: { contains: search } },
              ],
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          total = await db.event.count({
            where: {
              OR: [
                { title: { contains: search } },
                { location: { contains: search } },
              ],
            },
          })
        } else {
          total = await db.event.count()
          records = await db.event.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
        }
        break

      case 'merchandise':
        if (search) {
          records = await db.merchItem.findMany({
            where: { name: { contains: search } },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
          total = await db.merchItem.count({
            where: { name: { contains: search } },
          })
        } else {
          total = await db.merchItem.count()
          records = await db.merchItem.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
        }
        break

      case 'registrations':
        total = await db.registration.count()
        records = await db.registration.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            event: { select: { title: true } },
          },
        })
        break

      case 'onsite-registrations':
        total = await db.onSiteRegistration.count()
        records = await db.onSiteRegistration.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { title: true } },
          },
        })
        break

      case 'pos-orders':
        total = await db.pOSOrder.count()
        records = await db.pOSOrder.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        })
        break

      case 'race-results':
        total = await db.raceResult.count()
        records = await db.raceResult.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { title: true } },
          },
        })
        break

      case 'system-logs':
        total = await db.systemLog.count()
        records = await db.systemLog.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        break

      default:
        return NextResponse.json({ error: 'Unknown model' }, { status: 400 })
    }

    return NextResponse.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      editableFields: editableFields[model] || [],
      isReadOnly: readOnlyModels.includes(model),
    })
  } catch (error) {
    console.error('Dev database model GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { model } = await params
    const body = await request.json()
    const { id, field, value } = body

    if (!id || !field || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields: id, field, value' }, { status: 400 })
    }

    // Check if the model allows editing
    const allowed = editableFields[model]
    if (!allowed || !allowed.includes(field)) {
      return NextResponse.json({ error: `Field "${field}" is not editable for model "${model}"` }, { status: 403 })
    }

    // Also block read-only models
    if (readOnlyModels.includes(model)) {
      return NextResponse.json({ error: 'This table is read-only' }, { status: 403 })
    }

    let updated: unknown = null
    const user = session.user as Record<string, unknown>

    switch (model) {
      case 'settings':
        updated = await db.systemSetting.update({
          where: { id },
          data: { [field]: String(value) },
        })
        await logAction({
          action: 'DEVELOPER_UPDATE_SETTINGS',
          category: 'developer',
          description: `Developer updated setting: ${field}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, field, newValue: value },
        })
        break

      case 'users':
        updated = await db.user.update({
          where: { id },
          data: { [field]: value },
        })
        await logAction({
          action: 'DEVELOPER_UPDATE_USER',
          category: 'developer',
          description: `Developer updated user ${field}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, field, newValue: value },
        })
        break

      case 'events':
        updated = await db.event.update({
          where: { id },
          data: { [field]: value },
        })
        await logAction({
          action: 'DEVELOPER_UPDATE_EVENT',
          category: 'developer',
          description: `Developer updated event ${field}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, field, newValue: value },
        })
        break

      case 'merchandise':
        updated = await db.merchItem.update({
          where: { id },
          data: { [field]: field === 'price' || field === 'stock' ? parseInt(value) || 0 : value },
        })
        await logAction({
          action: 'DEVELOPER_UPDATE_MERCH',
          category: 'developer',
          description: `Developer updated merchandise ${field}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, field, newValue: value },
        })
        break

      default:
        return NextResponse.json({ error: 'Unknown model' }, { status: 400 })
    }

    return NextResponse.json({ success: true, record: updated })
  } catch (error) {
    console.error('Dev database model PUT error:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as Record<string, unknown>)?.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { model } = await params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    // Block deletion from read-only models
    if (readOnlyModels.includes(model)) {
      return NextResponse.json({ error: 'This table is read-only. Records cannot be deleted.' }, { status: 403 })
    }

    const user = session.user as Record<string, unknown>

    switch (model) {
      case 'settings': {
        const record = await db.systemSetting.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_SETTING',
          category: 'developer',
          description: `Developer deleted setting: ${(record as Record<string, unknown>).key}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, deletedRecord: record },
        })
        break
      }

      case 'users': {
        // Prevent developer from deleting themselves
        if (id === (user.id as string)) {
          return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 403 })
        }
        const record = await db.user.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_USER',
          category: 'developer',
          description: `Developer deleted user: ${(record as Record<string, unknown>).email}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, deletedRecord: record },
        })
        break
      }

      case 'events': {
        const record = await db.event.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_EVENT',
          category: 'developer',
          description: `Developer deleted event: ${(record as Record<string, unknown>).title}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, deletedRecord: record },
        })
        break
      }

      case 'merchandise': {
        const record = await db.merchItem.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_MERCHANDISE',
          category: 'developer',
          description: `Developer deleted merchandise: ${(record as Record<string, unknown>).name}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id, deletedRecord: record },
        })
        break
      }

      case 'registrations': {
        const record = await db.registration.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_REGISTRATION',
          category: 'developer',
          description: `Developer deleted registration`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id },
        })
        break
      }

      case 'onsite-registrations': {
        const record = await db.onSiteRegistration.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_ONSITE_REGISTRATION',
          category: 'developer',
          description: `Developer deleted on-site registration: ${(record as Record<string, unknown>).participantName}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id },
        })
        break
      }

      case 'pos-orders': {
        const record = await db.pOSOrder.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_POS_ORDER',
          category: 'developer',
          description: `Developer deleted POS order: ${(record as Record<string, unknown>).orderNumber}`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id },
        })
        break
      }

      case 'race-results': {
        const record = await db.raceResult.delete({ where: { id } })
        await logAction({
          action: 'DEVELOPER_DELETE_RACE_RESULT',
          category: 'developer',
          description: `Developer deleted race result`,
          userId: user.id as string,
          userName: user.name as string,
          userRole: 'developer',
          details: { model, recordId: id },
        })
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown model' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Dev database model DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
