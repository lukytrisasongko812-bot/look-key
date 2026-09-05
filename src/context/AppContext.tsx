"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

export type ViewType =
  | 'dashboard'
  | 'tracking'
  | 'myDocuments'
  | 'users'
  | 'matrix'
  | 'myAccount'
  | 'settings'
  | 'menu'

export type UserRole =
  | 'Requester'
  | 'Reviewer'
  | 'Approver'
  | 'Document Controller'
  | 'Administrator'
  // Legacy compatibility
  | 'User'
  | 'Legal Officer'
  | 'Legal Manager'
  | 'Department Manager'
  | 'Director / BOD'

export interface UserProfile {
  id: string
  employeeName: string
  email: string
  position: string
  division: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  coverUrl?: string
  twoFactorEnabled?: boolean
}

export interface DocumentFile {
  originalName: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

export interface DocumentVersionItem {
  version: string
  file: DocumentFile
  notes?: string
  uploadedBy: string
  uploadedAt: string
  isFinal: boolean
  fileType: 'initial' | 'revision' | 'supporting' | 'final'
}

export interface DocumentDecision {
  type: 'renew' | 'terminate' | 'amendment'
  justification: string
  considerations: string[]
  decidedAt: string
  decidedBy?: string
}

export interface ContractReminderConfig {
  h60: boolean
  h30: boolean
  h15: boolean
  h7: boolean
  h1: boolean
  customNotes?: string
  lastSentMilestone?: string
}

export interface DocumentHistoryItem {
  stage: number
  action: string
  actor: string
  notes?: string
  versionTag?: string
  timestamp: string
}

export interface DocumentItem {
  _id: string
  docNumber: string
  name: string
  category: string
  division: string
  priority: 'Normal' | 'Urgent' | 'Critical'
  confidentiality: 'Internal' | 'Confidential' | 'Restricted'
  contractStart?: string | null
  contractEnd?: string | null
  noDuration: boolean
  notes?: string
  stage: number
  stageStatus: 'waiting' | 'active' | 'completed' | 'revision' | 'rejected'
  statusLabel?: string
  pic: string
  picEmail?: string
  revisionRequested: boolean
  rejected: boolean
  files: DocumentFile[]
  initialDocument?: DocumentFile | null
  revisionDocuments: DocumentVersionItem[]
  supportingDocuments: DocumentFile[]
  finalDocument?: DocumentFile | null
  versions: DocumentVersionItem[]
  decision?: DocumentDecision | null
  reminders?: ContractReminderConfig | null
  history: DocumentHistoryItem[]
  driveFolderId?: string
  driveFolderUrl?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationItem {
  _id: string
  userId?: string | null
  type: 'approved' | 'revision' | 'signed' | 'reminder' | 'email_sent' | 'whatsapp_sent' | 'decision'
  title: string
  description: string
  isRead: boolean
  createdAt: string
}

interface AppContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  authLoading: boolean
  currentView: ViewType
  trackSubTab: 'new' | 'progress'
  setTrackSubTab: (subTab: 'new' | 'progress') => void
  selectedDocNumber: string | null
  setSelectedDocNumber: (docNo: string | null) => void
  documents: DocumentItem[]
  notifications: NotificationItem[]
  allUsers: UserProfile[]
  unreadNotifCount: number
  isNotifOpen: boolean
  setIsNotifOpen: (open: boolean) => void
  isMobileSidebarOpen: boolean
  setIsMobileSidebarOpen: (open: boolean) => void
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  login: (email: string, pass: string) => Promise<{ success: boolean; requires2FA?: boolean; userId?: string; email?: string; twoFactorTicket?: string; error?: string }>
  verifyOtp: (userId: string, email: string, code: string, ticket?: string) => Promise<{ success: boolean; error?: string }>
  ssoLogin: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setCurrentView: (view: ViewType, subTab?: 'new' | 'progress') => void
  fetchDocuments: (query?: string, status?: string, category?: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchAllUsers: () => Promise<void>
  createDocument: (docData: Partial<DocumentItem>) => Promise<DocumentItem | null>
  updateDocument: (id: string, updates: Partial<DocumentItem>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  transitionDocument: (id: string, action: string, notes?: string) => Promise<boolean>
  uploadRevision: (id: string, file: DocumentFile, notes: string, versionTag?: string) => Promise<boolean>
  uploadFinalDocument: (id: string, file: DocumentFile, notes: string) => Promise<boolean>
  submitDecision: (id: string, decision: { type: 'renew' | 'terminate' | 'amendment'; justification: string; considerations: string[] }) => Promise<boolean>
  updateDocumentReminders: (id: string, reminders: Partial<ContractReminderConfig>) => Promise<boolean>
  markNotificationsRead: () => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('ride_user') || localStorage.getItem('rise_user')
      if (savedUser) {
        try {
          return JSON.parse(savedUser)
        } catch {}
      }
    }
    return null
  })

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ride_token') || localStorage.getItem('rise_token') || null
    }
    return null
  })

  const [authLoading, setAuthLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [trackSubTab, setTrackSubTab] = useState<'new' | 'progress'>('progress')
  const [selectedDocNumber, setSelectedDocNumber] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const userRef = useRef<UserProfile | null>(user)
  userRef.current = user

  const tokenRef = useRef<string | null>(token)
  tokenRef.current = token

  // Fetch documents
  const fetchDocuments = useCallback(
    async (query = '', status = '', category = '') => {
      try {
        const params = new URLSearchParams()
        if (query) params.append('q', query)
        if (status) params.append('status', status)
        if (category) params.append('category', category)

        const headers: Record<string, string> = {}
        const currentToken = tokenRef.current || localStorage.getItem('ride_token') || localStorage.getItem('rise_token')
        if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

        const res = await fetch(`/api/documents?${params.toString()}`, { headers })
        if (res.ok) {
          const data: DocumentItem[] = await res.json()
          const currentUser = userRef.current
          if (currentUser && currentUser.role === 'Requester') {
            const userEmail = currentUser.email.toLowerCase()
            const userName = currentUser.employeeName?.toLowerCase() || ''
            const filtered = data.filter(
              (d) =>
                d.createdBy === currentUser.id ||
                (d.picEmail && d.picEmail.toLowerCase() === userEmail) ||
                (d.pic && d.pic.toLowerCase() === userName)
            )
            setDocuments(filtered)
          } else {
            setDocuments(data)
          }
        }
      } catch (e) {
        console.error('Failed to fetch documents', e)
      }
    },
    []
  )

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      const currentToken = tokenRef.current || localStorage.getItem('ride_token')
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`
      const res = await fetch('/api/notifications', { headers })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }, [])

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      const currentToken = tokenRef.current || localStorage.getItem('ride_token')
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`
      const res = await fetch('/api/users', { headers })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data)
      } else {
        setAllUsers([])
      }
    } catch (e) {
      console.error('Failed to fetch users', e)
      setAllUsers([])
    }
  }, [])

  // Load and verify session on startup (runs strictly once)
  const isInitialized = useRef(false)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const savedToken = localStorage.getItem('ride_token') || localStorage.getItem('rise_token')
    const savedUserStr = localStorage.getItem('ride_user')
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr)
        const email = parsed?.email?.toLowerCase() || ''
        const storedAvatar = (email ? localStorage.getItem(`ride_avatar_${email}`) : null) || parsed.avatarUrl
        const storedCover = (email ? localStorage.getItem(`ride_cover_${email}`) : null) || parsed.coverUrl
        const hydrated = {
          ...parsed,
          avatarUrl: storedAvatar || undefined,
          coverUrl: storedCover || undefined,
        }
        setUser(hydrated)
        userRef.current = hydrated
      } catch (e) {
        console.error('Failed to parse cached user', e)
      }
    }

    if (savedToken) {
      setToken(savedToken)
      tokenRef.current = savedToken
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            let cachedUser: UserProfile | null = null
            try {
              const cachedUserStr = localStorage.getItem('ride_user')
              cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null
            } catch {}

            const userEmail = (data.user.email || cachedUser?.email || '').toLowerCase()
            const liveAvatar = data.user.avatarUrl || (userEmail ? localStorage.getItem(`ride_avatar_${userEmail}`) : null) || cachedUser?.avatarUrl || undefined
            const liveCover = data.user.coverUrl || (userEmail ? localStorage.getItem(`ride_cover_${userEmail}`) : null) || cachedUser?.coverUrl || undefined

            if (userEmail) {
              if (data.user.avatarUrl) {
                try { localStorage.setItem(`ride_avatar_${userEmail}`, data.user.avatarUrl) } catch {}
              }
              if (data.user.coverUrl) {
                try { localStorage.setItem(`ride_cover_${userEmail}`, data.user.coverUrl) } catch {}
              }
            }

            const mergedUser: UserProfile = {
              ...data.user,
              avatarUrl: liveAvatar,
              coverUrl: liveCover,
            }
            setUser(mergedUser)
            userRef.current = mergedUser
            localStorage.setItem('ride_user', JSON.stringify(mergedUser))
          } else {
            localStorage.removeItem('ride_token')
            localStorage.removeItem('rise_token')
            localStorage.removeItem('ride_user')
            setUser(null)
            setToken(null)
          }
        })
        .catch(() => {
          // If network error, retain existing offline state
        })
        .finally(() => {
          setAuthLoading(false)
          fetchDocuments()
        })
    } else {
      setAuthLoading(false)
      fetchDocuments()
    }
  }, [fetchDocuments])

  // Cross-device automatic synchronization when browser window/tab gains focus or becomes visible
  useEffect(() => {
    const handleSyncOnFocus = () => {
      const currentTok = tokenRef.current || localStorage.getItem('ride_token') || localStorage.getItem('rise_token')
      if (currentTok) {
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${currentTok}` },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.user) {
              const uEmail = (d.user.email || '').toLowerCase()
              if (uEmail) {
                if (d.user.avatarUrl) {
                  try { localStorage.setItem(`ride_avatar_${uEmail}`, d.user.avatarUrl) } catch {}
                }
                if (d.user.coverUrl) {
                  try { localStorage.setItem(`ride_cover_${uEmail}`, d.user.coverUrl) } catch {}
                }
              }
              setUser((prev) => {
                if (!prev) return d.user
                const updated = {
                  ...prev,
                  ...d.user,
                  avatarUrl: d.user.avatarUrl || prev.avatarUrl,
                  coverUrl: d.user.coverUrl || prev.coverUrl,
                }
                userRef.current = updated
                try { localStorage.setItem('ride_user', JSON.stringify(updated)) } catch {}
                return updated
              })
            }
          })
          .catch(() => {})

        fetchDocuments()
      }
    }

    window.addEventListener('focus', handleSyncOnFocus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSyncOnFocus()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleSyncOnFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchDocuments])

  // Refetch notifications & users on token change
  useEffect(() => {
    if (token) {
      fetchNotifications()
      fetchAllUsers()
    }
  }, [token, fetchNotifications, fetchAllUsers])

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Login gagal' }
      }
      if (data.requires2FA || data.require2FA) {
        return {
          success: true,
          requires2FA: true,
          userId: data.userId,
          email: data.email || email,
          twoFactorTicket: data.twoFactorTicket,
        }
      }
      if (data.token && data.user) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('ride_token', data.token)
        localStorage.setItem('ride_user', JSON.stringify(data.user))
        return { success: true }
      }
      return { success: false, error: 'Respon otentikasi tidak valid' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const verifyOtp = async (userId: string, email: string, code: string, ticket?: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, code, ticket, twoFactorTicket: ticket }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Kode OTP tidak valid atau kadaluarsa' }
      }
      if (data.token && data.user) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('ride_token', data.token)
        localStorage.setItem('ride_user', JSON.stringify(data.user))
        return { success: true }
      }
      return { success: false, error: 'Otentikasi OTP gagal' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const ssoLogin = async (email: string) => {
    try {
      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'SSO Login gagal' }
      }
      if (data.token && data.user) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('ride_token', data.token)
        localStorage.setItem('ride_user', JSON.stringify(data.user))
        return { success: true }
      }
      return { success: false, error: 'Respon SSO tidak valid' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const logout = () => {
    localStorage.removeItem('ride_token')
    localStorage.removeItem('rise_token')
    localStorage.removeItem('ride_user')
    localStorage.removeItem('rise_user')
    setUser(null)
    setToken(null)
    setCurrentView('dashboard')
  }

  const createDocument = async (docData: Partial<DocumentItem>): Promise<DocumentItem | null> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers,
        body: JSON.stringify(docData),
      })
      if (res.ok) {
        const created = await res.json()
        await fetchDocuments()
        await fetchNotifications()
        return created
      }
      return null
    } catch (e) {
      console.error('Failed to create document', e)
      return null
    }
  }

  const updateDocument = async (id: string, updates: Partial<DocumentItem>): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        await fetchDocuments()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to update document', e)
      return false
    }
  }

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        await fetchDocuments()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to delete document', e)
      return false
    }
  }

  const transitionDocument = async (id: string, action: string, notes?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}/transition`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, notes }),
      })
      if (res.ok) {
        await fetchDocuments()
        await fetchNotifications()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to transition document', e)
      return false
    }
  }

  const uploadRevision = async (id: string, file: DocumentFile, notes: string, versionTag?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}/version`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ file, notes, isFinal: false, versionTag }),
      })
      if (res.ok) {
        await fetchDocuments()
        await fetchNotifications()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to upload revision', e)
      return false
    }
  }

  const uploadFinalDocument = async (id: string, file: DocumentFile, notes: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}/version`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ file, notes, isFinal: true, versionTag: 'FINAL' }),
      })
      if (res.ok) {
        await fetchDocuments()
        await fetchNotifications()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to upload final document', e)
      return false
    }
  }

  const submitDecision = async (
    id: string,
    decision: { type: 'renew' | 'terminate' | 'amendment'; justification: string; considerations: string[] }
  ): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}/decision`, {
        method: 'POST',
        headers,
        body: JSON.stringify(decision),
      })
      if (res.ok) {
        await fetchDocuments()
        await fetchNotifications()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to submit decision', e)
      return false
    }
  }

  const updateDocumentReminders = async (
    id: string,
    reminders: Partial<ContractReminderConfig>
  ): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/documents/${id}/reminders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reminders),
      })
      if (res.ok) {
        await fetchDocuments()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to update reminders', e)
      return false
    }
  }

  const markNotificationsRead = async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch('/api/notifications', { method: 'PATCH', headers })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('Failed to mark notifications read', e)
    }
  }

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    try {
      const activeEmail = (userRef.current?.email || user?.email || '').toLowerCase()
      if (activeEmail) {
        if (profileData.avatarUrl) {
          try {
            localStorage.setItem(`ride_avatar_${activeEmail}`, profileData.avatarUrl)
          } catch {}
        }
        if (profileData.coverUrl) {
          try {
            localStorage.setItem(`ride_cover_${activeEmail}`, profileData.coverUrl)
          } catch {}
        }
      }

      // Optimistic update
      setUser((prev) => {
        if (!prev) return null
        const updated = { ...prev, ...profileData }
        userRef.current = updated
        try {
          localStorage.setItem('ride_user', JSON.stringify(updated))
        } catch {}
        return updated
      })

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(profileData),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
          localStorage.setItem('ride_token', data.token)
        }
        if (data.user) {
          const userEmail = (data.user.email || activeEmail).toLowerCase()
          const liveAvatar = data.user.avatarUrl || profileData.avatarUrl || (userEmail ? localStorage.getItem(`ride_avatar_${userEmail}`) : null)
          const liveCover = data.user.coverUrl || profileData.coverUrl || (userEmail ? localStorage.getItem(`ride_cover_${userEmail}`) : null)

          if (userEmail) {
            if (liveAvatar) {
              try { localStorage.setItem(`ride_avatar_${userEmail}`, liveAvatar) } catch {}
            }
            if (liveCover) {
              try { localStorage.setItem(`ride_cover_${userEmail}`, liveCover) } catch {}
            }
          }

          const mergedUser: UserProfile = {
            ...data.user,
            avatarUrl: liveAvatar || undefined,
            coverUrl: liveCover || undefined,
          }
          setUser(mergedUser)
          userRef.current = mergedUser
          localStorage.setItem('ride_user', JSON.stringify(mergedUser))
        }
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to update profile', e)
      return false
    }
  }

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        await fetchAllUsers()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to update user role', e)
      return false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal mengubah kata sandi' }
      }
      return { success: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const navigateTo = (view: ViewType, subTab?: 'new' | 'progress') => {
    setCurrentView(view)
    if (subTab) setTrackSubTab(subTab)
    setIsMobileSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        authLoading,
        currentView,
        trackSubTab,
        selectedDocNumber,
        documents,
        notifications,
        allUsers,
        unreadNotifCount,
        isNotifOpen,
        isMobileSidebarOpen,
        isSidebarCollapsed,
        searchQuery,
        login,
        verifyOtp,
        ssoLogin,
        logout,
        setCurrentView: navigateTo,
        setTrackSubTab,
        setSelectedDocNumber,
        setIsNotifOpen,
        setIsMobileSidebarOpen,
        setIsSidebarCollapsed,
        setSearchQuery,
        fetchDocuments,
        fetchNotifications,
        fetchAllUsers,
        createDocument,
        updateDocument,
        deleteDocument,
        transitionDocument,
        uploadRevision,
        uploadFinalDocument,
        submitDecision,
        updateDocumentReminders,
        markNotificationsRead,
        updateProfile,
        updateUserRole,
        changePassword,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
