import React from 'react'
import { RISE_ICON_BASE64 } from '@/lib/assets'

interface RiseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSubtitle?: boolean
  className?: string
  whiteText?: boolean
  onlyIcon?: boolean
}

export function RiseLogo({
  size = 'md',
  showSubtitle = false,
  className = '',
  whiteText = false,
  onlyIcon = false,
}: RiseLogoProps) {
  const iconHeights = {
    sm: 'h-[22px] w-[22px]',
    md: 'h-[30px] w-[30px]',
    lg: 'h-[38px] w-[38px]',
    xl: 'h-[48px] w-[48px]',
  }

  const textSizes = {
    sm: 'text-[18px]',
    md: 'text-[22px]',
    lg: 'text-[28px]',
    xl: 'text-[34px]',
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Authentic RISE base64 emblem icon from prototype */}
          <img
            src={RISE_ICON_BASE64}
            alt="RISE Icon"
            className={`${iconHeights[size]} object-contain drop-shadow-xs transition-transform duration-200 hover:scale-105 select-none`}
          />
        </div>
        {!onlyIcon && (
          <div className="flex flex-col justify-center">
            <span
              className={`font-display font-extrabold tracking-wider ${
                whiteText ? 'text-white' : 'text-[#163A70]'
              } ${textSizes[size]} leading-none select-none`}
            >
              RISE
            </span>
          </div>
        )}
      </div>
      {showSubtitle && (
        <span
          className={`text-[11px] ${
            whiteText ? 'text-white/80' : 'text-[#64748B]'
          } font-medium mt-1.5 leading-snug`}
        >
          Resources Integrated System for Efficiency
        </span>
      )}
    </div>
  )
}
