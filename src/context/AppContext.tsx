"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ViewType = 'dashboard' | 'tracking' | 'myDocuments' | 'myAccount' | 'settings'
export type UserRole =
  | 'User'
  | 'Legal Officer'
  | 'Legal Manager'
  | 'Department Manager'
  | 'Director / BOD'
  | 'Administrator'

export interface UserProfile {
  id: string
  employeeName: string
  email: string
  position: string
  division: string
  role: UserRole
  phone?: string
  avatarUrl?: string
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

export interface DocumentDecision {
  type: 'renew' | 'terminate'
  justification: string
  considerations: string[]
  decidedAt: string
  decidedBy?: string
}

export interface DocumentHistoryItem {
  stage: number
  action: string
  actor: string
  notes?: string
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
  contractStart: string | null
  contractEnd: string | null
  noDuration: boolean
  notes: string
  stage: number
  stageStatus: 'waiting' | 'active' | 'completed' | 'revision' | 'rejected'
  pic: string
  revisionRequested: boolean
  rejected: boolean
  files: DocumentFile[]
  decision?: DocumentDecision | null
  history: DocumentHistoryItem[]
  createdAt: string
  updatedAt: string
}

export interface NotificationItem {
  _id: string
  type: 'approved' | 'revision' | 'signed' | 'reminder' | 'email_sent' | 'whatsapp_sent' | 'decision'
  title: string
  description: string
  isRead: boolean
  createdAt: string
}

export interface LoginHistoryItem {
  _id: string
  email: string
  device: string
  ip: string
  status: string
  createdAt: string
}

interface AppContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  currentView: ViewType
  trackSubTab: 'new' | 'progress'
  selectedDocNumber: string | null
  documents: DocumentItem[]
  notifications: NotificationItem[]
  loginHistory: LoginHistoryItem[]
  allUsers: UserProfile[]
  unreadNotifCount: number
  isNotifOpen: boolean
  isMobileSidebarOpen: boolean
  isSidebarCollapsed: boolean
  searchQuery: string
  login: (email: string, password: string) => Promise<{ success: boolean; require2FA?: boolean; userId?: string; codeHint?: string; error?: string }>
  verifyOtp: (userId: string, code: string, email?: string) => Promise<{ success: boolean; error?: string }>
  ssoLogin: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setCurrentView: (view: ViewType, subTab?: 'new' | 'progress') => void
  setTrackSubTab: (tab: 'new' | 'progress') => void
  setSelectedDocNumber: (no: string | null) => void
  setIsNotifOpen: (open: boolean) => void
  setIsMobileSidebarOpen: (open: boolean) => void
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  setSearchQuery: (query: string) => void
  fetchDocuments: (query?: string, status?: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchAllUsers: () => Promise<void>
  createDocument: (data: Partial<DocumentItem>) => Promise<DocumentItem | null>
  updateDocument: (id: string, patch: Partial<DocumentItem>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  transitionDocument: (id: string, action: string, notes?: string) => Promise<{ success: boolean; message?: string; error?: string }>
  submitDecision: (
    id: string,
    decision: { type: 'renew' | 'terminate'; justification: string; considerations: string[] }
  ) => Promise<boolean>
  markNotificationsRead: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [trackSubTab, setTrackSubTab] = useState<'new' | 'progress'>('new')
  const [selectedDocNumber, setSelectedDocNumber] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([])
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch documents from MongoDB
  const fetchDocuments = useCallback(async (q?: string, status?: string) => {
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      const res = await fetch(`/api/documents?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
        if (data.length > 0 && !selectedDocNumber) {
          setSelectedDocNumber(data[0].docNumber)
        }
      }
    } catch (e) {
      console.error('Error fetching documents', e)
    }
  }, [selectedDocNumber])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error('Error fetching notifications', e)
    }
  }, [])

  // Fetch all users for Admin
  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.map((u: any) => ({ ...u, id: u._id })))
      }
    } catch (e) {
      console.error('Error fetching users', e)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('rise_token')
    if (savedToken) {
      setToken(savedToken)
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.user) {
            setUser(res.user)
          }
          if (res.loginHistory) {
            setLoginHistory(res.loginHistory)
          }
        })
        .catch(() => {})
    }
    fetchDocuments()
    fetchNotifications()
    fetchAllUsers()
  }, [fetchDocuments, fetchNotifications, fetchAllUsers])

  // Real Login
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Login gagal' }
      }

      if (data.require2FA) {
        return {
          success: true,
          require2FA: true,
          userId: data.userId,
          codeHint: data.codeHint,
        }
      }

      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('rise_token', data.token)
      await fetchDocuments()
      await fetchNotifications()
      return { success: true }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: message }
    }
  }

  // Real Verify OTP
  const verifyOtp = async (userId: string, code: string, email?: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Kode OTP salah' }
      }

      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('rise_token', data.token)
      await fetchDocuments()
      await fetchNotifications()
      return { success: true }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: message }
    }
  }

  // Company Email SSO Login
  const ssoLogin = async (email: string) => {
    try {
      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'SSO failed' }
      }
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('rise_token', data.token)
      await fetchDocuments()
      await fetchNotifications()
      return { success: true }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error'
      return { success: false, error: message }
    }
  }

  // Logout
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('rise_token')
    setCurrentView('dashboard')
  }

  // Create Document
  const createDocument = async (docData: Partial<DocumentItem>) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(docData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create document')
      }
      const newDoc = await res.json()
      await fetchDocuments()
      await fetchNotifications()
      return newDoc
    } catch (e) {
      console.error(e)
      return null
    }
  }

  // Update Document
  const updateDocument = async (id: string, patch: Partial<DocumentItem>) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        await fetchDocuments()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Delete Document
  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        await fetchDocuments()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Real Workflow Transition
  const transitionDocument = async (id: string, action: string, notes?: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, notes }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Aksi gagal' }
      }
      await fetchDocuments()
      await fetchNotifications()
      return { success: true, message: data.message }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memproses tahapan'
      return { success: false, error: msg }
    }
  }

  // Submit Contract Renewal/Termination Decision
  const submitDecision = async (
    id: string,
    decision: { type: 'renew' | 'terminate'; justification: string; considerations: string[] }
  ) => {
    try {
      const res = await fetch(`/api/documents/${id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(decision),
      })
      if (res.ok) {
        await fetchDocuments()
        await fetchNotifications()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Mark all notifications read
  const markNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error(e)
    }
  }

  // Update profile
  const updateProfile = async (profile: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Real update user role (Admin action)
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        await fetchAllUsers()
        if (user && user.id === userId) {
          setUser({ ...user, role: newRole })
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Change Password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
        currentView,
        trackSubTab,
        selectedDocNumber,
        documents,
        notifications,
        loginHistory,
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
        submitDecision,
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
