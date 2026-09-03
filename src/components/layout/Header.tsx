"use client"

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { RideLogo } from '@/components/common/RideLogo'
import {
  Menu,
  Search,
  Bell,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'

export function Header() {
  const {
    user,
    unreadNotifCount,
    setIsNotifOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setCurrentView,
    logout,
    searchQuery,
    setSearchQuery,
  } = useApp()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCurrentView('myDocuments')
    }
  }

  const initials = user?.employeeName
    ? user.employeeName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'RD'

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-3.5 sm:px-6 shadow-2xs transition-all">
      {/* Left side: Hamburger, Logo, Search */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth <= 980) {
              setIsMobileSidebarOpen(true)
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed)
            }
          }}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
          title="Buka / Tutup Navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          className="cursor-pointer transition-opacity hover:opacity-90 flex items-center gap-3"
          onClick={() => setCurrentView('dashboard')}
        >
          <RideLogo size="sm" showSubtitle={false} />
          <div className="hidden sm:block h-6 w-[1px] bg-[#CBD5E1]" />
          <img
            src="/resources-id-logo.png"
            alt="RESOURCES ID - MIND ID"
            className="hidden sm:block h-7 w-auto object-contain shrink-0"
          />
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:flex items-center ml-2 lg:ml-6">
          <Search className="absolute left-3.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Cari nomor dokumen, kontrak, vendor, PIC... (Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-10 w-72 lg:w-96 rounded-full border border-[#E2E8F0] bg-[#F1F5F9]/70 pl-10 pr-12 text-xs text-[#0F172A] transition-all placeholder:text-[#94A3B8] focus:border-[#163A70] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#163A70]/10"
          />
          <kbd className="absolute right-3 hidden sm:inline-flex h-5 items-center rounded border border-[#CBD5E1] bg-white px-1.5 font-mono text-[10px] font-medium text-[#64748B]">
            ↵ Enter
          </kbd>
        </div>
      </div>

      {/* Right side: Role badge, Notification Bell, User Chip */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* User Role Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-[#EBF2FF] px-2.5 py-1 text-[11px] font-bold text-[#163A70] border border-[#BFDBFE]">
          <Shield className="h-3 w-3" />
          <span>Peran: {user?.role || 'Peninjau'}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => setIsNotifOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
          title="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444] border-2 border-white"></span>
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white py-1 pl-1 pr-3 hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="relative">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0B2147] to-[#163A70] text-xs font-extrabold text-white shadow-xs">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
            </div>

            <div className="hidden text-left sm:block">
              <div className="text-xs font-bold text-[#0F172A] leading-tight">
                {user?.employeeName || 'Pengguna'}
              </div>
              <div className="text-[10px] text-[#64748B]">
                {user?.role || 'Reviewer'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8] ml-0.5" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-64 sm:w-72 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-2xl animate-card-in">
                <div className="px-3.5 py-3 border-b border-[#F1F5F9] mb-1.5 bg-[#F8FAFC]/70 rounded-xl">
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {user?.employeeName || 'Pengguna'}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                    {user?.email || 'user@resourcesid.co.id'}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#EBF2FF] px-2.5 py-0.5 text-[10.5px] font-bold text-[#163A70] border border-[#BFDBFE]">
                    <Shield className="h-3 w-3" />
                    <span>{user?.role || 'Reviewer'}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setIsDropdownOpen(false)
                      setCurrentView('myAccount')
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDropdownOpen(false)
                      setCurrentView('myAccount')
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#EBF2FF] hover:text-[#163A70] transition-colors cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 shrink-0 text-[#64748B]" />
                    <span className="truncate">Profil &amp; Keamanan Akun</span>
                  </button>

                  {!(user?.role === 'Requester' || user?.role === 'User') && (
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setIsDropdownOpen(false)
                        setCurrentView('matrix')
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsDropdownOpen(false)
                        setCurrentView('matrix')
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#EBF2FF] hover:text-[#163A70] transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#64748B]" />
                      <span className="truncate">Matriks Kewenangan (RBAC)</span>
                    </button>
                  )}

                  {(user?.role === 'Administrator' || user?.role === 'Director / BOD') && (
                    <>
                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setIsDropdownOpen(false)
                          setCurrentView('users')
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsDropdownOpen(false)
                          setCurrentView('users')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#EBF2FF] hover:text-[#163A70] transition-colors cursor-pointer"
                      >
                        <Users className="h-4 w-4 shrink-0 text-[#64748B]" />
                        <span className="truncate">Kelola Pengguna &amp; Undangan</span>
                      </button>

                      <button
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setIsDropdownOpen(false)
                          setCurrentView('settings')
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsDropdownOpen(false)
                          setCurrentView('settings')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#EBF2FF] hover:text-[#163A70] transition-colors cursor-pointer"
                      >
                        <SettingsIcon className="h-4 w-4 shrink-0 text-[#64748B]" />
                        <span className="truncate">Pengaturan Sistem</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="my-1.5 h-[1px] bg-[#F1F5F9]" />

                <button
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsDropdownOpen(false)
                    logout()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDropdownOpen(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Keluar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
