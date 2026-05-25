import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as Record<string, unknown>)?.role

  if (role !== 'developer') {
    redirect('/admin/login')
  }

  return <>{children}</>
}
