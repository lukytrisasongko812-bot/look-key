"use client"

import React from 'react'
import { useApp } from '@/context/AppContext'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationDrawer } from '@/components/layout/NotificationDrawer'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { TrackingView } from '@/components/tracking/TrackingView'
import { MyDocumentsView } from '@/components/documents/MyDocumentsView'
import { MyAccountView } from '@/components/account/MyAccountView'
import { SettingsView } from '@/components/settings/SettingsView'
import { UsersView } from '@/components/users/UsersView'
import { AuthorityMatrixView } from '@/components/matrix/AuthorityMatrixView'
import { AppMenuView } from '@/components/menu/AppMenuView'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function HomePage() {
  const { isAuthenticated, authLoading, currentView } = useApp()

  if (authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#163A70] border-t-transparent" />
          <div className="text-xs font-bold text-[#163A70] tracking-wider uppercase font-display">
            Memuat Portal RIDE...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <Header />
      <div className="flex flex-1 relative items-start">
        <Sidebar />
        <main className="flex-1 p-3.5 sm:p-4 md:p-6 pb-24 md:pb-6 min-w-0 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'tracking' && <TrackingView />}
          {currentView === 'myDocuments' && <MyDocumentsView />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'matrix' && <AuthorityMatrixView />}
          {currentView === 'myAccount' && <MyAccountView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'menu' && <AppMenuView />}
        </main>
      </div>
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  )
}
