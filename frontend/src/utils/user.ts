import type { User } from '@/api/client'

export const getInitials = (user: User) => {
  const name = user.email.split("@")[0]
  return name.slice(0, 2).toUpperCase()
}
