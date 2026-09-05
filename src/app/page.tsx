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
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || authLoading) {
    return <div className="min-h-screen bg-[#071326]" />
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <Header />
      <div className="flex flex-1 relative items-start">
        <Sidebar />
        <main className="flex-1 px-3.5 sm:px-4 md:px-6 py-3.5 sm:py-5 pb-28 md:pb-8 min-w-0 max-w-7xl mx-auto w-full">
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
