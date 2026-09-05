"use client"

import React, { useEffect, useState } from 'react'
import { RideSpinner } from './RideSpinner'

interface RideSplashScreenProps {
  onFinish?: () => void
  minDuration?: number
  message?: string
}

export function RideSplashScreen({
  onFinish,
  minDuration = 1400,
  message = 'Menyiapkan Portal Ekosistem RIDE...',
}: RideSplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [currentStepText, setCurrentStepText] = useState(message)

  useEffect(() => {
    // Dynamic text sequence for high-tech feel
    const t1 = setTimeout(() => {
      setCurrentStepText('Memverifikasi Protokol Keamanan...')
    }, Math.floor(minDuration * 0.45))

    const t2 = setTimeout(() => {
      setCurrentStepText('Menghubungkan ke Portal Resmi...')
    }, Math.floor(minDuration * 0.75))

    const finishTimer = setTimeout(() => {
      setIsFadingOut(true)
      setTimeout(() => {
        onFinish?.()
      }, 400) // allow CSS fade-out animation to complete
    }, minDuration)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(finishTimer)
    }
  }, [minDuration, onFinish])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#071326] transition-all duration-400 ease-out select-none ${
        isFadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Mining Backdrop with Deep Twilight Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: "url('/mining-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071326]/90 via-[#0B1E38]/85 to-[#071326]/95 backdrop-blur-md" />

      {/* Ambient Pulsing Luminous Color Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] rounded-full bg-gradient-to-tr from-[#163A70]/35 via-[#0E786B]/30 to-[#F2C342]/25 blur-3xl animate-glow-pulse pointer-events-none" />

      {/* Content Center Container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-md w-full text-center">
        
        {/* Floating Animated Pinwheel Emblem with Orbiting Halo Rings */}
        <div className="relative flex items-center justify-center mb-6">
          
          {/* Outer Rotating Dashed Ring */}
          <div className="absolute -inset-5 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite_reverse] pointer-events-none" />
          
          {/* Middle Glowing Gradient Ring */}
          <div className="absolute -inset-2.5 rounded-full border border-white/30 bg-gradient-to-tr from-white/10 to-transparent animate-[spin_6s_linear_infinite] pointer-events-none" />
          
          {/* Inner Glowing Backdrop Disc */}
          <div className="relative flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/40 shadow-[0_0_35px_rgba(242,195,66,0.25)]">
            {/* Spinning RIDE Pinwheel Logo */}
            <RideSpinner size="lg" speed="normal" showGlow={false} />
          </div>
        </div>

        {/* Brand Title & Acronym */}
        <div className="space-y-1.5 mb-6">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              RIDE
            </h1>
            <span className="rounded-md bg-gradient-to-r from-[#2563EB]/40 to-[#0E786B]/40 border border-white/20 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white tracking-widest uppercase shadow-xs">
              PLATFORM
            </span>
          </div>
          
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#94A3B8]">
            Request Integrated Document Ecosystem
          </p>
        </div>

        {/* Sleek Progress Indicator & Dynamic Status */}
        <div className="w-full max-w-[260px] space-y-2.5">
          {/* Slim Shimmer Progress Bar */}
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#F2C342] to-transparent animate-shimmer-bar" />
          </div>
          
          {/* Dynamic Status Text */}
          <p className="text-[11px] font-medium text-[#CBD5E1] transition-all duration-300">
            {currentStepText}
          </p>
        </div>
      </div>

      {/* Bottom Dual Branding Footer */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-1.5 z-10 px-4">
        <div className="flex items-center gap-2">
          <img
            src="/resources-id-logo.png"
            alt="RESOURCES ID"
            className="h-5 sm:h-6 w-auto object-contain brightness-0 invert opacity-80"
          />
        </div>
        <p className="text-[10px] text-[#64748B] tracking-wider uppercase">
          Shared Service Center of MIND ID
        </p>
      </div>
    </div>
  )
}
