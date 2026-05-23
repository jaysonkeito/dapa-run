import { db } from '@/lib/db'

type LogAction = 
  | 'CREATE_EVENT' | 'UPDATE_EVENT' | 'DELETE_EVENT'
  | 'CREATE_MERCH' | 'UPDATE_MERCH' | 'DELETE_MERCH'
  | 'POS_SALE'
  | 'ONSITE_REG'
  | 'UPDATE_SETTINGS'
  | 'USER_LOGIN' | 'USER_LOGOUT'
  | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER'
  | 'CHANGE_PASSWORD'
  | 'CREATE_RESULT' | 'UPDATE_RESULT' | 'DELETE_RESULT'
  | 'DEVELOPER_UPDATE_SETTINGS' | 'DEVELOPER_UPDATE_USER' | 'DEVELOPER_UPDATE_EVENT' | 'DEVELOPER_UPDATE_MERCH'

type LogCategory = 'events' | 'inventory' | 'pos' | 'registrations' | 'users' | 'settings' | 'auth' | 'results' | 'developer'

interface LogEntry {
  action: LogAction
  category: LogCategory
  description: string
  userId?: string | null
  userName?: string | null
  userRole?: string | null
  details?: Record<string, unknown> | null
}

export async function logAction(entry: LogEntry) {
  try {
    await db.systemLog.create({
      data: {
        action: entry.action,
        category: entry.category,
        description: entry.description,
        userId: entry.userId || null,
        userName: entry.userName || null,
        userRole: entry.userRole || null,
        details: entry.details ? JSON.stringify(entry.details) : null,
      },
    })
  } catch (error) {
    console.error('Failed to log action:', error)
    // Don't throw - logging should not break the main operation
  }
}
