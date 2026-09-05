"use client"

import React from 'react'

interface RideLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  whiteText?: boolean
  showSubtitle?: boolean
  showResourcesLogo?: boolean
  spinning?: boolean
  hoverSpin?: boolean
  className?: string
}

export function RideLogo({
  size = 'md',
  whiteText = false,
  showSubtitle = true,
  showResourcesLogo = false,
  spinning = false,
  hoverSpin = true,
  className = '',
}: RideLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
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

  const resourcesLogoSizes = {
    sm: 'h-3.5',
    md: 'h-4',
    lg: 'h-5',
    xl: 'h-6',
  }

  return (
    <div className={`group flex items-center gap-2.5 ${className}`}>
      {/* Official 3-Blade Pinwheel / Triskele Emblem */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-white p-0.5 shadow-sm border border-[#E2E8F0] select-none shrink-0 overflow-hidden ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full transition-transform duration-700 ease-out ${
            spinning ? 'animate-spin duration-[1500ms] ease-linear' : ''
          } ${hoverSpin && !spinning ? 'group-hover:rotate-180' : ''}`}
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
            className={`font-semibold tracking-tight whitespace-nowrap mt-0.5 ${subtitleSizes[size]} ${
              whiteText ? 'text-white/90' : 'text-[#163A70]'
            }`}
          >
            Request Integrated Document Ecosystem
          </span>
        )}
        {showResourcesLogo && (
          <div className="mt-1">
            <img
              src="/resources-id-logo.png"
              alt="RESOURCES ID"
              className={`${resourcesLogoSizes[size]} w-auto object-contain`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
