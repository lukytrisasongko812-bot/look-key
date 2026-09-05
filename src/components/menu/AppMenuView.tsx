"use client"

import React from 'react'
import { useApp } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FilePlus,
  GitPullRequestDraft,
  Files,
  Clock,
  FolderOpen,
  ShieldCheck,
  Users,
  Settings,
  User,
  KeyRound,
  LogOut,
  ChevronRight,
  Bell,
  Sparkles,
} from 'lucide-react'

export function AppMenuView() {
  const {
    user,
    setCurrentView,
    logout,
    documents,
    setIsNotifOpen,
    unreadNotifCount,
  } = useApp()

  const isAdmin = user?.role === 'Administrator' || user?.role === 'Director / BOD'
  const isRequester = user?.role === 'Requester' || user?.role === 'User'
  const reviewCount = documents.filter((d) => d.stage === 0 || d.stage === 1 || d.revisionRequested).length
  const myDocsCount = documents.filter((d) => !user || d.pic === user.employeeName || d.picEmail === user.email || d.createdBy === user.email).length

  const initials = user?.employeeName
    ? user.employeeName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'RD'

  const appGridItems = [
    {
      id: 'new_doc',
      title: 'Ajukan',
      icon: FilePlus,
      action: () => setCurrentView('tracking', 'new'),
    },
    {
      id: 'tracking',
      title: 'Lacak Berkas',
      icon: GitPullRequestDraft,
      badge: reviewCount > 0 ? reviewCount : undefined,
      action: () => setCurrentView('tracking', 'progress'),
    },
    {
      id: 'documents',
      title: 'Dokumen',
      icon: Files,
      badge: myDocsCount > 0 ? myDocsCount : undefined,
      action: () => setCurrentView('myDocuments'),
    },
    {
      id: 'reminders',
      title: 'Jatuh Tempo',
      icon: Clock,
      action: () => setCurrentView('tracking', 'progress'),
    },
    {
      id: 'gdrive',
      title: 'Google Drive',
      icon: FolderOpen,
      action: () => {
        if (typeof window !== 'undefined') {
          window.open('https://drive.google.com/drive/folders/1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F', '_blank')
        }
      },
    },
    ...(!isRequester
      ? [
          {
            id: 'matrix',
            title: 'Matriks SOP',
            icon: ShieldCheck,
            action: () => setCurrentView('matrix'),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'users',
            title: 'Pengguna',
            icon: Users,
            action: () => setCurrentView('users'),
          },
          {
            id: 'settings',
            title: 'Pengaturan',
            icon: Settings,
            action: () => setCurrentView('settings'),
          },
        ]
      : []),
    {
      id: 'profile',
      title: 'Profil Saya',
      icon: User,
      action: () => setCurrentView('myAccount'),
    },
    {
      id: 'security',
      title: 'Keamanan 2FA',
      icon: KeyRound,
      action: () => setCurrentView('myAccount'),
    },
  ]

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Profile Mini Card */}
      <Card
        onClick={() => setCurrentView('myAccount')}
        className="border-[#E2E8F0] shadow-sm overflow-hidden cursor-pointer hover:border-[#BFDBFE] transition-all bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] text-white rounded-3xl"
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.employeeName || 'User'}
                className="h-12 w-12 rounded-2xl object-cover border-2 border-white/40 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center font-bold text-base">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {user?.employeeName || 'Pengguna RIDE'}
              </h2>
              <p className="text-[11px] text-white/80 mt-0.5">
                {user?.position || 'Karyawan'} • {user?.division || 'MIND ID'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/60" />
        </CardContent>
      </Card>

      {/* App Grid Launcher (Clean Mobile Native App Launcher) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#163A70]" />
            <h3 className="text-xs sm:text-sm font-extrabold font-display text-[#0B2147] tracking-tight">
              Menu Layanan &amp; Fitur
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#64748B]">
            {appGridItems.length} Menu
          </span>
        </div>

        <div className="grid grid-cols-4 gap-y-4 gap-x-2 sm:gap-x-4">
          {appGridItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center text-center group cursor-pointer active:scale-90 transition-transform"
              >
                <div className="relative mb-1.5">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#F0F4FA] text-[#163A70] border border-[#D9E2EC] shadow-2xs group-hover:bg-[#163A70] group-hover:text-white group-hover:border-[#163A70] group-hover:shadow-md transition-all">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
                  </div>

                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-black text-white shadow-xs ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] leading-tight text-center break-words w-full px-0.5 group-hover:text-[#163A70] transition-colors">
                  {item.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifications Quick Bar */}
      <Card
        onClick={() => setIsNotifOpen(true)}
        className="border-[#E2E8F0] shadow-xs cursor-pointer hover:bg-[#F8FAFC] transition-colors"
      >
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF] text-[#163A70]">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Notifikasi Sistem</div>
              <div className="text-[10.5px] text-[#64748B]">
                {unreadNotifCount > 0
                  ? `${unreadNotifCount} notifikasi baru belum dibaca`
                  : 'Semua notifikasi telah dibaca'}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
        </CardContent>
      </Card>

      {/* Logout Action Tile */}
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#FCA5A5]/60 bg-[#FEF2F2] p-3.5 text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer active:scale-95 shadow-xs"
      >
        <LogOut className="h-4 w-4" />
        <span>Keluar dari Akun (Logout)</span>
      </button>

      {/* App Footer Info */}
      <div className="flex flex-col items-center justify-center text-center pt-3 pb-2 gap-1.5">
        <img
          src="/resources-id-logo.png"
          alt="RESOURCES ID"
          className="h-4.5 w-auto max-w-[115px] object-contain shrink-0 opacity-85 hover:opacity-100 transition-opacity"
        />
        <div>
          <div className="text-[10px] font-bold font-display text-[#0B2147] tracking-wider uppercase">
            Platform RIDE v2.6.0
          </div>
          <div className="text-[8.5px] text-[#64748B] mt-0.5">
            Request Integrated Document Ecosystem
          </div>
        </div>
      </div>
    </div>
  )
}
