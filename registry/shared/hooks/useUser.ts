'use client'

import { createContext, useContext } from 'react'

export type User = {
    userId: string
}

export type UserContextType = {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

/* filled by <UserProvider> in providers/user.tsx */
export const UserContext = createContext<UserContextType | null>(null)

export function useUser() {
    const ctx = useContext(UserContext)
    if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
    return ctx
}
