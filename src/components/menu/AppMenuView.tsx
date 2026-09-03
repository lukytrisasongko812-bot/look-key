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
      title: 'Ajukan Dokumen',
      subtitle: 'Pemesanan Berkas',
      icon: FilePlus,
      gradient: 'from-[#1D4ED8] to-[#3B82F6]',
      action: () => setCurrentView('tracking', 'new'),
    },
    {
      id: 'tracking',
      title: 'Lacak Alur',
      subtitle: '7 Tahap & Revisi',
      icon: GitPullRequestDraft,
      gradient: 'from-[#4338CA] to-[#6366F1]',
      badge: reviewCount > 0 ? `${reviewCount}` : undefined,
      action: () => setCurrentView('tracking', 'progress'),
    },
    {
      id: 'myDocuments',
      title: 'Dokumen Saya',
      subtitle: 'Arsip Berkas',
      icon: Files,
      gradient: 'from-[#047857] to-[#10B981]',
      badge: myDocsCount > 0 ? `${myDocsCount}` : undefined,
      action: () => setCurrentView('myDocuments'),
    },
    {
      id: 'reminders',
      title: 'Jatuh Tempo',
      subtitle: 'Reminder H-60',
      icon: Clock,
      gradient: 'from-[#B45309] to-[#F59E0B]',
      action: () => setCurrentView('tracking', 'progress'),
    },
    {
      id: 'gdrive',
      title: 'Google Drive',
      subtitle: 'Arsip Cloud',
      icon: FolderOpen,
      gradient: 'from-[#0E7490] to-[#06B6D4]',
      action: () => {
        if (typeof window !== 'undefined') {
          window.open('https://drive.google.com/drive/folders/1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F', '_blank')
        }
      },
    },
    {
      id: 'matrix',
      title: 'Matriks RBAC',
      subtitle: 'Wewenang & SOP',
      icon: ShieldCheck,
      gradient: 'from-[#334155] to-[#64748B]',
      action: () => setCurrentView('matrix'),
    },
    ...(isAdmin
      ? [
          {
            id: 'users',
            title: 'Pengguna',
            subtitle: 'Kelola & Undangan',
            icon: Users,
            gradient: 'from-[#6D28D9] to-[#8B5CF6]',
            action: () => setCurrentView('users'),
          },
          {
            id: 'settings',
            title: 'Pengaturan',
            subtitle: 'Sistem & Drive',
            icon: Settings,
            gradient: 'from-[#0F172A] to-[#334155]',
            action: () => setCurrentView('settings'),
          },
        ]
      : []),
    {
      id: 'profile',
      title: 'Profil Saya',
      subtitle: 'Identitas Karyawan',
      icon: User,
      gradient: 'from-[#0284C7] to-[#38BDF8]',
      action: () => setCurrentView('myAccount'),
    },
    {
      id: 'security',
      title: 'Keamanan',
      subtitle: 'Sandi & 2FA',
      icon: KeyRound,
      gradient: 'from-[#BE123C] to-[#F43F5E]',
      action: () => setCurrentView('myAccount'),
    },
  ]

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-12 animate-in fade-in duration-300">
      {/* User App Profile Header Card */}
      <Card
        onClick={() => setCurrentView('myAccount')}
        className="overflow-hidden border-[#E2E8F0] shadow-sm bg-gradient-to-r from-[#0B2147] to-[#163A70] text-white cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
      >
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.employeeName}
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-white"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-lg font-black text-white border-2 border-white/30 backdrop-blur-md">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#10B981] ring-2 ring-[#0B2147]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-white truncate max-w-[180px]">
                  {user?.employeeName || 'Pengguna'}
                </h2>
                <Badge className="bg-white/20 text-white text-[9.5px] px-2 py-0.5 border-0">
                  {user?.role || 'Reviewer'}
                </Badge>
              </div>
              <p className="text-xs text-white/75 truncate mt-0.5 max-w-[210px]">
                {user?.email || 'user@resourcesid.co.id'}
              </p>
              <div className="text-[10.5px] text-[#60A5FA] font-semibold mt-1">
                {user?.division || 'Direktorat Umum'}
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-white/50" />
        </CardContent>
      </Card>

      {/* Grid App Launcher Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#163A70]" />
          <h3 className="text-sm font-bold font-display text-[#0B2147]">
            Menu Aplikasi &amp; Layanan
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#64748B]">
          {appGridItems.length} Fitur
        </span>
      </div>

      {/* App Grid Launcher (Kotak-Kotak Aplikasi 4 Kolom) */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
        {appGridItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs hover:shadow-md hover:border-[#CBD5E1] transition-all active:scale-95 cursor-pointer text-center group min-h-[102px] sm:min-h-[114px]"
            >
              {item.badge && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[9px] font-extrabold text-white shadow-xs">
                  {item.badge}
                </span>
              )}

              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#EBF2FF] text-[#163A70] border border-[#BFDBFE]/60 mb-1.5 group-hover:bg-[#163A70] group-hover:text-white group-hover:border-[#163A70] transition-all shrink-0 shadow-2xs">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
              </div>

              <span className="text-[10.5px] sm:text-xs font-bold text-[#0B2147] leading-tight text-center break-words hyphens-auto w-full px-0.5 whitespace-normal">
                {item.title}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#64748B] leading-tight text-center break-words w-full px-0.5 mt-0.5 whitespace-normal line-clamp-2">
                {item.subtitle}
              </span>
            </button>
          )
        })}
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
      <div className="text-center pt-2">
        <div className="text-[11px] font-bold font-display text-[#0B2147] tracking-wider">
          RIDE PLATFORM v2.6.0
        </div>
        <div className="text-[10px] text-[#64748B] mt-0.5">
          Request Integrated Document Ecosystem • RESOURCES ID
        </div>
      </div>
    </div>
  )
}
