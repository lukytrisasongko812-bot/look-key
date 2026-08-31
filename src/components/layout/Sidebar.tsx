"use client"

import React from 'react'
import { useApp, ViewType } from '@/context/AppContext'
import {
  LayoutDashboard,
  GitPullRequestDraft,
  Files,
  UserCog,
  SlidersHorizontal,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { RideLogo } from '@/components/common/RideLogo'

export function Sidebar() {
  const {
    user,
    currentView,
    setCurrentView,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    documents,
    allUsers,
  } = useApp()

  const reviewCount = documents.filter((d) => d.stage === 0 || d.stage === 1 || d.revisionRequested).length
  const isAdmin = user?.role === 'Administrator' || user?.role === 'Director / BOD'

  const allNavItems: {
    id: ViewType
    label: string
    icon: React.ReactNode
    badge?: number | string
    badgeColor?: string
    adminOnly?: boolean
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'tracking',
      label: 'Lacak & Ajukan Dokumen',
      icon: <GitPullRequestDraft className="h-4 w-4 shrink-0" />,
      badge: reviewCount > 0 ? reviewCount : undefined,
      badgeColor: 'bg-[#D97706] text-white',
    },
    {
      id: 'myDocuments',
      label: 'Dokumen Saya',
      icon: <Files className="h-4 w-4 shrink-0" />,
      badge: documents.length > 0 ? documents.length : undefined,
    },
    {
      id: 'matrix',
      label: 'Matriks Kewenangan',
      icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'myAccount',
      label: 'Profil & Keamanan',
      icon: <UserCog className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'users',
      label: 'Kelola Pengguna',
      icon: <Users className="h-4 w-4 shrink-0" />,
      badge: allUsers.length > 0 ? allUsers.length : undefined,
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'Pengaturan Sistem',
      icon: <SlidersHorizontal className="h-4 w-4 shrink-0" />,
      adminOnly: true,
    },
  ]

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F2A54]/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container (Sticky on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 mt-16 flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 md:sticky md:top-16 md:mt-0 md:h-[calc(100vh-4rem)] md:shrink-0 ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-[245px]'
        } ${
          isMobileSidebarOpen
            ? 'translate-x-0 w-[250px]'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation Items */}
        <div className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  setIsMobileSidebarOpen(false)
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#163A70] text-white shadow-sm'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`${
                      isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#163A70]'
                    } transition-colors`}
                  >
                    {item.icon}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!isSidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-[#EBF2FF] text-[#163A70]')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Brand System Footer */}
        {!isSidebarCollapsed && (
          <div className="p-3.5 border-t border-[#F1F5F9] bg-[#F8FAFC]/70 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] font-bold font-display text-[#0B2147] tracking-wider">
              RIDE PLATFORM
            </div>
            <div className="text-[9.5px] text-[#64748B] mt-0.5">
              Request Integrated Document Ecosystem
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
