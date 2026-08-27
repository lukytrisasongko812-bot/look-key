"use client"

import React from 'react'
import { useApp, ViewType } from '@/context/AppContext'
import {
  LayoutDashboard,
  GitPullRequestDraft,
  Files,
  UserCog,
  SlidersHorizontal,
  CircleDot,
} from 'lucide-react'
import { RISE_LOGO_BASE64 } from '@/lib/assets'

export function Sidebar() {
  const {
    currentView,
    setCurrentView,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    documents,
  } = useApp()

  const reviewCount = documents.filter((d) => d.stage === 0 || d.stage === 1).length

  const navItems: {
    id: ViewType
    label: string
    icon: React.ReactNode
    badge?: number | string
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'tracking',
      label: 'Document Tracking',
      icon: <GitPullRequestDraft className="h-4 w-4 shrink-0" />,
      badge: reviewCount > 0 ? reviewCount : undefined,
    },
    {
      id: 'myDocuments',
      label: 'My Documents',
      icon: <Files className="h-4 w-4 shrink-0" />,
      badge: documents.length,
    },
    {
      id: 'myAccount',
      label: 'My Account',
      icon: <UserCog className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SlidersHorizontal className="h-4 w-4 shrink-0" />,
    },
  ]

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F2A54]/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 mt-16 flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 md:static md:mt-0 ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
        } ${
          isMobileSidebarOpen
            ? 'translate-x-0 w-[250px]'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-[#94A3B8] uppercase font-display">
              Main Menu
            </div>
          )}

          {navItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#163A70] text-white shadow-sm shadow-[#163A70]/20'
                    : 'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#163A70]'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Active Indicator Bar */}
                {isActive && !isSidebarCollapsed && (
                  <span className="absolute left-1 h-5 w-1 rounded-full bg-[#60A5FA]" />
                )}

                <span className={`flex items-center justify-center transition-transform ${isActive ? 'scale-105' : ''}`}>
                  {item.icon}
                </span>

                {!isSidebarCollapsed && (
                  <span className="flex-1 text-left truncate font-medium">{item.label}</span>
                )}

                {!isSidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* System Health Status Footer */}
        {!isSidebarCollapsed && (
          <div className="p-3.5 border-t border-[#F1F5F9] bg-[#F8FAFC]/60 space-y-2.5">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0F172A]">
                <CircleDot className="h-3 w-3 text-[#10B981] animate-pulse" />
                <span>MongoDB Connected</span>
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5 truncate">
                Database: rise_db (Local)
              </div>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-center opacity-75 hover:opacity-100 transition-opacity">
              <img
                src={RISE_LOGO_BASE64}
                alt="MIND ID - Mining Industry Indonesia"
                className="h-3.5 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
