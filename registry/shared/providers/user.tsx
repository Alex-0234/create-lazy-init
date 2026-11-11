'use client'

import { useState, type ReactNode } from 'react'
import { UserContext, type User } from '@/hooks/useUser'

/* Auth boilerplate: point the endpoints at your backend and extend User as needed.
   Read it anywhere with useUser() from @/hooks/useUser. */
const ENDPOINTS = {
    login: '/api/login',
    logout: '/api/logout',
}

interface UserProviderProps {
    children: ReactNode
    /* e.g. the session read on the server */
    initialUser?: User | null
}

export default function UserProvider({ children, initialUser = null }: UserProviderProps) {
    const [user, setUser] = useState(initialUser)

    const login = async (email: string, password: string) => {
        const res = await fetch(ENDPOINTS.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        if (!res.ok) throw new Error('Login failed')
        setUser(await res.json())
    }

    const logout = async () => {
        await fetch(ENDPOINTS.logout, { method: 'POST' })
        setUser(null)
    }

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    )
}
