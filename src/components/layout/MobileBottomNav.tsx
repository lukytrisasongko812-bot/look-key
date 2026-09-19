"use client"

import React from 'react'
import { useApp, ViewType } from '@/context/AppContext'
import {
  LayoutDashboard,
  GitPullRequestDraft,
  Plus,
  Files,
  User,
} from 'lucide-react'

export function MobileBottomNav() {
  const {
    currentView,
    trackSubTab,
    setCurrentView,
    documents,
    user,
  } = useApp()

  const reviewCount = documents.filter((d) => d.stage === 0 || d.stage === 1 || d.revisionRequested).length
  const myDocsCount = documents.filter((d) => !user || d.pic === user.employeeName || d.picEmail === user.email || d.createdBy === user.email).length

  const navItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Beranda',
      icon: LayoutDashboard,
      action: () => setCurrentView('dashboard'),
      isActive: currentView === 'dashboard',
    },
    {
      id: 'tracking' as ViewType,
      label: 'Lacak',
      icon: GitPullRequestDraft,
      badge: reviewCount > 0 ? reviewCount : undefined,
      action: () => setCurrentView('tracking', 'progress'),
      isActive: currentView === 'tracking' && trackSubTab === 'progress',
    },
    // Center Floating Action Button (Ajukan Dokumen)
    {
      id: 'new_doc' as const,
      label: 'Ajukan',
      isCenterAction: true,
      action: () => setCurrentView('tracking', 'new'),
      isActive: currentView === 'tracking' && trackSubTab === 'new',
    },
    {
      id: 'myDocuments' as ViewType,
      label: 'Dokumen',
      icon: Files,
      badge: myDocsCount > 0 ? myDocsCount : undefined,
      action: () => setCurrentView('myDocuments'),
      isActive: currentView === 'myDocuments',
    },
    {
      id: 'myAccount' as ViewType,
      label: 'Akun',
      icon: User,
      action: () => setCurrentView('myAccount'),
      isActive: currentView === 'myAccount',
    },
  ]

  return (
    <nav
      aria-label="Navigasi Mobile Bawah"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0] px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] select-none pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.isCenterAction) {
            return (
              <div key="center-action" className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={item.action}
                  className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#0B2147] via-[#163A70] to-[#2563EB] text-white shadow-[0_8px_20px_rgba(22,58,112,0.45)] ring-4 ring-white active:scale-90 transition-transform cursor-pointer"
                  title="Ajukan Dokumen Baru"
                >
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-bold text-[#163A70] mt-1 tracking-tight">
                  Ajukan
                </span>
              </div>
            )
          }

          const Icon = item.icon!
          const active = item.isActive

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                active ? 'text-[#163A70]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    active ? 'bg-[#EBF2FF] text-[#163A70]' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>

                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  active ? 'font-bold text-[#163A70]' : 'font-medium text-[#64748B]'
                }`}
              >
                {item.label}
              </span>

              {active && (
                <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-[#163A70]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
