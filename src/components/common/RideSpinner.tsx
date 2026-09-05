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
  showGlow = false,
  className = '',
}: RideSpinnerProps) {
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  }

  const speedMap = {
    fast: 'duration-[700ms]',
    normal: 'duration-[1200ms]',
    slow: 'duration-[2000ms]',
  }

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Ambient Pulsing Glow Aura */}
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1C3F5E]/25 via-[#0E786B]/25 to-[#F2C342]/30 blur-xs animate-pulse" />
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
  message?: string
  className?: string
}

export function RideLoadingScreen({
  message = 'Memuat Portal RIDE...',
  className = '',
}: RideLoadingScreenProps) {
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center bg-transparent select-none p-4 animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-3 bg-transparent">
        {/* Floating Rotating RIDE Pinwheel Emblem - 100% Transparent */}
        <RideSpinner size="lg" speed="normal" showGlow={false} />

        {/* Brand Text & Status */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black font-display tracking-wider text-[#0B2147] uppercase">
              RIDE Platform
            </span>
            <span className="h-1 w-1 rounded-full bg-[#CBD5E1]" />
            <span className="text-[11px] font-semibold text-[#163A70]">
              {message}
            </span>
          </div>
          <span className="text-[9px] text-[#64748B] mt-0.5">
            Request Integrated Document Ecosystem
          </span>
        </div>
      </div>
    </div>
  )
}

export function RideLoadingOverlay({
  message = 'Memuat...',
  className = '',
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-transparent animate-in fade-in duration-200 select-none ${className}`}
    >
      <div className="flex flex-col items-center gap-2">
        <RideSpinner size="md" speed="normal" showGlow={false} />
        {message && (
          <span className="text-[11px] font-bold text-[#163A70]">
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
