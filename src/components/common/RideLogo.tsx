"use client"

import React from 'react'

interface RideLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  whiteText?: boolean
  showSubtitle?: boolean
  className?: string
}

export function RideLogo({
  size = 'md',
  whiteText = false,
  showSubtitle = true,
  className = '',
}: RideLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-xl',
  }

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-xs',
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Modern Dynamic RIDE Monogram Icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#163A70] via-[#1E4D94] to-[#2563EB] font-display font-extrabold text-white shadow-md select-none shrink-0 ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-white"
        >
          {/* Document Fold Base */}
          <path
            d="M6 5C6 3.89543 6.89543 3 8 3H19L26 10V27C26 28.1046 25.1046 29 24 29H8C6.89543 29 6 28.1046 6 27V5Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* R Flow Accent */}
          <path
            d="M10 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17H13V25H10V7Z"
            fill="white"
          />
          <path
            d="M17 14L23 25H19.5L14 15H17Z"
            fill="#60A5FA"
          />
          <circle cx="15.5" cy="12" r="2" fill="#163A70" />
        </svg>

        {/* Ambient Ring */}
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display font-extrabold tracking-wider ${titleSizes[size]} ${
              whiteText ? 'text-white' : 'text-[#0B2147]'
            }`}
          >
            RIDE
          </span>
          <span className="rounded-md bg-[#2563EB]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#2563EB] tracking-wide uppercase">
            Platform
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium tracking-tight whitespace-nowrap ${subtitleSizes[size]} ${
              whiteText ? 'text-white/80' : 'text-[#64748B]'
            }`}
          >
            Request Integrated Document Ecosystem
          </span>
        )}
      </div>
    </div>
  )
}
