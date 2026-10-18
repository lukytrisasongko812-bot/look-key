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
  | 'Guest'
  | 'User'
  | 'Legal Officer'
  | 'Legal Management'
  | 'Board of Directors'
  | 'System Administrator'
  // Legacy / compatibility aliases
  | 'Requester'
  | 'Reviewer'
  | 'Approver'
  | 'Document Controller'
  | 'Administrator'
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
  dataUrl?: string
  driveFileId?: string
  driveViewUrl?: string
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
  language: 'id' | 'en'
  setLanguage: (lang: 'id' | 'en') => void
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; requires2FA?: boolean; userId?: string; email?: string; twoFactorTicket?: string; error?: string }>
  verifyOtp: (userId: string, email: string, code: string, ticket?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  ssoLogin: (email: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setCurrentView: (view: ViewType, subTab?: 'new' | 'progress') => void
  fetchDocuments: (query?: string, status?: string, category?: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchAllUsers: () => Promise<void>
  createDocument: (docData: Partial<DocumentItem>) => Promise<DocumentItem | null>
  updateDocument: (id: string, updates: Partial<DocumentItem>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  transitionDocument: (id: string, action: string, notes?: string) => Promise<boolean>
  uploadRevision: (
    id: string,
    file: DocumentFile,
    notes: string,
    versionTag?: string,
    options?: {
      actionLabel?: string
      advanceStage?: boolean
      fileType?: 'initial' | 'revision' | 'supporting' | 'final'
    }
  ) => Promise<boolean>
  uploadFinalDocument: (id: string, file: DocumentFile, notes: string) => Promise<boolean>
  submitDecision: (id: string, decision: { type: 'renew' | 'terminate' | 'amendment'; justification: string; considerations: string[] }) => Promise<boolean>
  updateDocumentReminders: (id: string, reminders: Partial<ContractReminderConfig>) => Promise<boolean>
  markNotificationsRead: () => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
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
  const [language, setLanguageState] = useState<'id' | 'en'>('id')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('ride_lang')
      if (savedLang === 'en' || savedLang === 'id') {
        setLanguageState(savedLang)
      }
    }
  }, [])

  const setLanguage = useCallback((lang: 'id' | 'en') => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ride_lang', lang)
    }
  }, [])

  const userRef = useRef<UserProfile | null>(null)
  userRef.current = user

  const tokenRef = useRef<string | null>(null)
  tokenRef.current = token

  const lastSyncRef = useRef<number>(Date.now())

  const getStoredAuthToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    return (
      localStorage.getItem('ride_token') ||
      sessionStorage.getItem('ride_token') ||
      localStorage.getItem('rise_token') ||
      sessionStorage.getItem('rise_token') ||
      null
    )
  }, [])

  const clearAllStoredAuth = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('ride_token')
    localStorage.removeItem('rise_token')
    localStorage.removeItem('ride_user')
    localStorage.removeItem('rise_user')
    sessionStorage.removeItem('ride_token')
    sessionStorage.removeItem('rise_token')
    sessionStorage.removeItem('ride_user')
    sessionStorage.removeItem('rise_user')
  }, [])

  // Fetch documents
  const fetchDocuments = useCallback(
    async (query = '', status = '', category = '') => {
      try {
        const params = new URLSearchParams()
        if (query) params.append('q', query)
        if (status) params.append('status', status)
        if (category) params.append('category', category)

        const headers: Record<string, string> = {}
        const currentToken = tokenRef.current || getStoredAuthToken()
        if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

        const res = await fetch(`/api/documents?${params.toString()}`, { headers })
        if (res.ok) {
          const data: DocumentItem[] = await res.json()
          setDocuments((prev) => {
            if (prev.length === data.length) {
              const isSame = prev.every((p, idx) => {
                const d = data[idx]
                return (
                  d &&
                  p._id === d._id &&
                  p.docNumber === d.docNumber &&
                  p.updatedAt === d.updatedAt &&
                  p.stage === d.stage &&
                  p.stageStatus === d.stageStatus
                )
              })
              if (isSame) return prev
            }
            return data
          })
        }
      } catch (e) {
        console.error('Failed to fetch documents', e)
      }
    },
    [getStoredAuthToken]
  )

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      const currentToken = tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`
      const res = await fetch('/api/notifications', { headers })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }, [getStoredAuthToken])

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      const currentToken = tokenRef.current || getStoredAuthToken()
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
  }, [getStoredAuthToken])

  // Strictly verify session on startup
  const isInitialized = useRef(false)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const savedToken = getStoredAuthToken()

    if (!savedToken) {
      setUser(null)
      setToken(null)
      setAuthLoading(false)
      fetchDocuments()
      return
    }

    // Verify token expiration before network request
    try {
      const parts = savedToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          clearAllStoredAuth()
          setUser(null)
          setToken(null)
          setAuthLoading(false)
          fetchDocuments()
          return
        }
      }
    } catch {
      clearAllStoredAuth()
      setUser(null)
      setToken(null)
      setAuthLoading(false)
      fetchDocuments()
      return
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        if (data.token && data.user) {
          const verifiedToken = data.token
          setToken(verifiedToken)
          tokenRef.current = verifiedToken
          setUser(data.user)
          userRef.current = data.user

          if (localStorage.getItem('ride_token')) {
            localStorage.setItem('ride_token', verifiedToken)
            localStorage.setItem('ride_user', JSON.stringify(data.user))
          } else {
            sessionStorage.setItem('ride_token', verifiedToken)
            sessionStorage.setItem('ride_user', JSON.stringify(data.user))
          }

          fetchDocuments()
          fetchNotifications()
          fetchAllUsers()
        } else {
          clearAllStoredAuth()
          setUser(null)
          setToken(null)
          fetchDocuments()
        }
      })
      .catch(() => {
        clearAllStoredAuth()
        setUser(null)
        setToken(null)
        fetchDocuments()
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [getStoredAuthToken, clearAllStoredAuth, fetchDocuments, fetchNotifications, fetchAllUsers])

  // Cross-device automatic synchronization when browser window/tab gains focus (debounced with 30s cooldown)
  useEffect(() => {
    const handleSyncOnFocus = () => {
      const now = Date.now()
      if (now - lastSyncRef.current < 30000) return
      lastSyncRef.current = now

      const currentTok = tokenRef.current || getStoredAuthToken()
      if (currentTok) {
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${currentTok}` },
        })
          .then((r) => {
            if (!r.ok) throw new Error('Session invalid')
            return r.json()
          })
          .then((d) => {
            if (d.token) {
              setToken(d.token)
              tokenRef.current = d.token
            }
            if (d.user) {
              setUser((prev) => {
                if (!prev) return d.user
                const updated = {
                  ...prev,
                  ...d.user,
                  role: d.user.role || prev.role,
                  avatarUrl: d.user.avatarUrl || prev.avatarUrl,
                  coverUrl: d.user.coverUrl || prev.coverUrl,
                }
                userRef.current = updated
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
  }, [getStoredAuthToken, fetchDocuments])

  // Refetch notifications, users, and scoped documents when token changes
  useEffect(() => {
    if (token) {
      fetchNotifications()
      fetchAllUsers()
      fetchDocuments()
    }
  }, [token, fetchNotifications, fetchAllUsers, fetchDocuments])

  const login = async (email: string, pass: string, rememberMe = true) => {
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
        userRef.current = data.user

        if (rememberMe) {
          localStorage.setItem('ride_token', data.token)
          localStorage.setItem('ride_user', JSON.stringify(data.user))
          sessionStorage.removeItem('ride_token')
          sessionStorage.removeItem('ride_user')
        } else {
          sessionStorage.setItem('ride_token', data.token)
          sessionStorage.setItem('ride_user', JSON.stringify(data.user))
          localStorage.removeItem('ride_token')
          localStorage.removeItem('ride_user')
        }
        return { success: true }
      }
      return { success: false, error: 'Respon otentikasi tidak valid' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const verifyOtp = async (userId: string, email: string, code: string, ticket?: string, rememberMe = true) => {
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
        userRef.current = data.user

        if (rememberMe) {
          localStorage.setItem('ride_token', data.token)
          localStorage.setItem('ride_user', JSON.stringify(data.user))
          sessionStorage.removeItem('ride_token')
          sessionStorage.removeItem('ride_user')
        } else {
          sessionStorage.setItem('ride_token', data.token)
          sessionStorage.setItem('ride_user', JSON.stringify(data.user))
          localStorage.removeItem('ride_token')
          localStorage.removeItem('ride_user')
        }
        return { success: true }
      }
      return { success: false, error: 'Otentikasi OTP gagal' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const ssoLogin = async (email: string, rememberMe = true) => {
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
        userRef.current = data.user

        if (rememberMe) {
          localStorage.setItem('ride_token', data.token)
          localStorage.setItem('ride_user', JSON.stringify(data.user))
          sessionStorage.removeItem('ride_token')
          sessionStorage.removeItem('ride_user')
        } else {
          sessionStorage.setItem('ride_token', data.token)
          sessionStorage.setItem('ride_user', JSON.stringify(data.user))
          localStorage.removeItem('ride_token')
          localStorage.removeItem('ride_user')
        }
        return { success: true }
      }
      return { success: false, error: 'Respon SSO tidak valid' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: msg }
    }
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    clearAllStoredAuth()
    setUser(null)
    setToken(null)
    userRef.current = null
    tokenRef.current = null
    setDocuments([])
    setCurrentView('dashboard')
  }

  const createDocument = async (docData: Partial<DocumentItem>): Promise<DocumentItem | null> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const payload: Partial<DocumentItem> = {
        ...docData,
        pic: docData.pic || user?.employeeName || 'Requester',
        picEmail: docData.picEmail || user?.email || '',
        createdBy: docData.createdBy || user?.id || user?.email,
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const created: DocumentItem = await res.json()
        setDocuments((prev) => [created, ...prev.filter((d) => d._id !== created._id && d.docNumber !== created.docNumber)])
        await fetchDocuments()
        await fetchNotifications()
        return created
      } else {
        const errJson = await res.json().catch(() => ({}))
        console.error('Failed to create document HTTP error:', res.status, errJson)
      }
      return null
    } catch (e) {
      console.error('Failed to create document', e)
      return null
    }
  }

  const updateDocument = async (id: string, updates: Partial<DocumentItem>): Promise<boolean> => {
    try {
      // Optimistic update
      setDocuments((prev) =>
        prev.map((d) => (d._id === id || d.docNumber === id ? { ...d, ...updates } : d))
      )

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        await fetchDocuments()
        return true
      }
      await fetchDocuments()
      return false
    } catch (e) {
      console.error('Failed to update document', e)
      await fetchDocuments()
      return false
    }
  }

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      // 1. Optimistically update local document list so UI doesn't flicker or wait
      setDocuments((prev) => prev.filter((d) => d._id !== id && d.docNumber !== id))

      const headers: Record<string, string> = {}
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        return true
      }
      // If delete failed on backend, restore list
      await fetchDocuments()
      return false
    } catch (e) {
      console.error('Failed to delete document', e)
      await fetchDocuments()
      return false
    }
  }

  const transitionDocument = async (id: string, action: string, notes?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`/api/documents/${id}/transition`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, notes }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev.filter((d) => d._id !== data.document._id && d.docNumber !== data.document.docNumber)])
        }
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

  const uploadRevision = async (
    id: string,
    file: DocumentFile,
    notes: string,
    versionTag?: string,
    options?: {
      actionLabel?: string
      advanceStage?: boolean
      fileType?: 'initial' | 'revision' | 'supporting' | 'final'
    }
  ): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`/api/documents/${id}/version`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file,
          notes,
          isFinal: false,
          versionTag,
          actionLabel: options?.actionLabel,
          advanceStage: options?.advanceStage,
          fileType: options?.fileType || 'revision',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev.filter((d) => d._id !== data.document._id && d.docNumber !== data.document.docNumber)])
        }
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
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`/api/documents/${id}/version`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ file, notes, isFinal: true, versionTag: 'FINAL' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev.filter((d) => d._id !== data.document._id && d.docNumber !== data.document.docNumber)])
        }
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
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

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
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

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
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      await fetch('/api/notifications', { method: 'PATCH', headers })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('Failed to mark notifications read', e)
    }
  }

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    try {
      // Optimistic update
      setUser((prev) => {
        if (!prev) return null
        const updated = { ...prev, ...profileData }
        userRef.current = updated
        return updated
      })

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(profileData),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
          tokenRef.current = data.token
        }
        if (data.user) {
          setUser(data.user)
          userRef.current = data.user
          if (localStorage.getItem('ride_token')) {
            localStorage.setItem('ride_token', data.token || currentToken || '')
            localStorage.setItem('ride_user', JSON.stringify(data.user))
          } else {
            sessionStorage.setItem('ride_token', data.token || currentToken || '')
            sessionStorage.setItem('ride_user', JSON.stringify(data.user))
          }
        }
        await fetchAllUsers()
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
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

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

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers: Record<string, string> = {}
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers,
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        await fetchAllUsers()
        return { success: true }
      }
      return { success: false, error: data.error || 'Gagal menghapus keanggotaan pengguna.' }
    } catch (e) {
      console.error('Failed to delete user', e)
      return { success: false, error: 'Terjadi kesalahan jaringan.' }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const currentToken = token || tokenRef.current || getStoredAuthToken()
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

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
        language,
        setLanguage,
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
        deleteUser,
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
