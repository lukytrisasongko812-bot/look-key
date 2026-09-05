"use client"

import React from 'react'

interface RideSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  speed?: 'normal' | 'fast' | 'slow'
  showGlow?: boolean
  className?: string
}

export function RideSpinner({
  size = 'md',
  speed = 'normal',
  showGlow = true,
  className = '',
}: RideSpinnerProps) {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const speedMap = {
    fast: 'duration-[700ms]',
    normal: 'duration-[1200ms]',
    slow: 'duration-[2000ms]',
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {/* Ambient Pulsing Glow Aura */}
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1C3F5E]/30 via-[#0E786B]/30 to-[#F2C342]/40 blur-sm animate-pulse" />
      )}

      {/* Spinning RIDE 3-Blade Pinwheel */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full relative z-10 animate-spin ${speedMap[speed]} ease-linear`}
      >
        {/* Top Spoke (Navy Blue) */}
        <g transform="rotate(0 100 100)">
          <rect x="83" y="24" width="34" height="66" rx="17" fill="#1C3F5E" />
        </g>
        {/* Bottom-Right Spoke (Teal Green) */}
        <g transform="rotate(120 100 100)">
          <rect x="83" y="24" width="34" height="66" rx="17" fill="#0E786B" />
        </g>
        {/* Bottom-Left Spoke (Crimson Red) */}
        <g transform="rotate(240 100 100)">
          <rect x="83" y="24" width="34" height="66" rx="17" fill="#A82325" />
        </g>
        {/* Center Yellow Circle with white separation ring */}
        <circle cx="100" cy="100" r="26" fill="#F2C342" stroke="#FFFFFF" strokeWidth="6" />
      </svg>
    </div>
  )
}

interface RideLoadingScreenProps {
  title?: string
  subtitle?: string
  message?: string
}

export function RideLoadingScreen({
  title = 'RIDE PLATFORM',
  subtitle = 'Request Integrated Document Ecosystem',
  message = 'Memuat Portal RIDE...',
}: RideLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0B2147] via-[#0F2A54] to-[#071731] text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Decorative Ambient Radial Circles */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#0E786B]/15 blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Loading Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto px-6 py-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Floating Rotating RIDE Logo Card */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Animated Background Rings */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#60A5FA]/20 via-[#34D399]/20 to-[#FBBF24]/25 blur-md animate-pulse" />
          <div className="absolute -inset-1.5 rounded-full border border-white/20 animate-ping opacity-25" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 p-2 shadow-xl border border-white/40">
            <RideSpinner size="lg" speed="normal" showGlow={false} />
          </div>
        </div>

        {/* Brand Headings */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="font-display font-black text-xl tracking-wider text-white">
              {title}
            </span>
            <span className="rounded-md bg-[#60A5FA]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#93C5FD] tracking-wide uppercase border border-[#60A5FA]/30">
              v2.6
            </span>
          </div>

          <p className="text-[11px] font-medium text-white/70 max-w-[240px] leading-tight">
            {subtitle}
          </p>
        </div>

        {/* Modern Shimmer Progress Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-6 relative">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#60A5FA] to-transparent rounded-full animate-pulse" />
        </div>

        {/* Dynamic Status Text with pulsing dot */}
        <div className="flex items-center gap-2 mt-3.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60A5FA] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#60A5FA]" />
          </span>
          <span className="text-xs font-semibold text-white/90 tracking-wide">
            {message}
          </span>
        </div>

        {/* Footer Endorsement */}
        <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <img
            src="/resources-id-logo.png"
            alt="RESOURCES ID"
            className="h-4 w-auto object-contain brightness-0 invert opacity-80"
          />
        </div>
      </div>
    </div>
  )
}
