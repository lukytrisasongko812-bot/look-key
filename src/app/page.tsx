"use client"

import React from 'react'
import { useApp } from '@/context/AppContext'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { RideSpinner } from '@/components/common/RideSpinner'
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
  const [showSplash, setShowSplash] = React.useState(true)
  const [splashFading, setSplashFading] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (mounted && !authLoading) {
      // Transisi cepat: 300ms tampil, 200ms memudar (total 500ms kilat)
      const t1 = setTimeout(() => {
        setSplashFading(true)
      }, 300)

      const t2 = setTimeout(() => {
        setShowSplash(false)
      }, 500)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [mounted, authLoading])

  // Tampilan Refresh / Loading: Kincir RIDE Berputar dengan Latar Belakang Tambang
  if (showSplash) {
    return (
      <div
        className={`relative min-h-screen flex items-center justify-center bg-[#071326] px-4 py-8 overflow-hidden select-none transition-all duration-300 ease-out ${
          splashFading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {/* Background Mining Site Image - Vivid and Clear */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: "url('/mining-bg.jpg')" }}
        />
        {/* Soft translucent gradient overlay for comfortable contrast without over-dimming */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Clean Intro: Rotating RIDE Kincir Logo + Clean Text Only */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          {/* Pure Floating Rotating RIDE Kincir Logo - 100% Transparent */}
          <div className="mb-4">
            <RideSpinner size="2xl" speed="normal" showGlow={false} />
          </div>

          {/* Clean Brand Text */}
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-widest text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            RIDE
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] mt-1.5 max-w-xs sm:max-w-md">
            Request Integrated Document Ecosystem
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen skipIntro={true} />
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
