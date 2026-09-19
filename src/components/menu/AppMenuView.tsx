"use client"

import React from 'react'
import { useApp } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import {
  LogOut,
  ChevronRight,
  Bell,
  User,
  Shield,
} from 'lucide-react'

export function AppMenuView() {
  const {
    user,
    setCurrentView,
    logout,
    setIsNotifOpen,
    unreadNotifCount,
  } = useApp()

  const initials = user?.employeeName
    ? user.employeeName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'RD'

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

      {/* Account & Settings Direct Link */}
      <Card
        onClick={() => setCurrentView('myAccount')}
        className="border-[#E2E8F0] shadow-xs cursor-pointer hover:bg-[#F8FAFC] transition-colors"
      >
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF2FF] text-[#163A70]">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Profil Akun</div>
              <div className="text-[10.5px] text-[#64748B]">
                Foto, data diri, kata sandi, dan 2FA
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
        </CardContent>
      </Card>

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
              <div className="text-xs font-bold text-[#0F172A]">Notifikasi</div>
              <div className="text-[10.5px] text-[#64748B]">
                {unreadNotifCount > 0
                  ? `${unreadNotifCount} notifikasi belum dibaca`
                  : 'Tidak ada notifikasi baru'}
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
      <div className="text-center pt-2 pb-1">
        <div className="text-[11px] font-bold font-display text-[#0B2147] tracking-wider uppercase">
          Platform RIDE v2.6.0
        </div>
        <div className="text-[9.5px] text-[#64748B] mt-0.5">
          Request Integrated Document Ecosystem • RESOURCES ID
        </div>
      </div>
    </div>
  )
}
