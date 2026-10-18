"use client"

import React, { useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'

export type MoodId =
  | 'bahagia'
  | 'semangat'
  | 'santai'
  | 'fokus'
  | 'lelah'
  | 'sedih'
  | 'marah'
  | 'kopi'

export interface MoodOption {
  id: MoodId
  label: string
  desc: string
  greetingTitle: (name: string) => string
  greetingMessage: string
  badgeBg: string
  accentColor: string
  glowColor: string
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'bahagia',
    label: 'Bahagia',
    desc: 'Hati gembira & senyum cerah',
    greetingTitle: (name) => `Halo, ${name}! Senangnya melihatmu bahagia! ✨`,
    greetingMessage:
      'Energi positifmu hari ini luar biasa! Semoga seluruh aktivitas dan pengajuan dokumenmu berjalan lancar penuh senyuman.',
    badgeBg: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40',
    accentColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'semangat',
    label: 'Semangat',
    desc: 'Siap tuntaskan target hari ini',
    greetingTitle: (name) => `Gaspol, ${name}! Semangatmu menyala! 🔥`,
    greetingMessage:
      'Tidak ada target yang terlalu sulit hari ini! Ayo kita tuntaskan setiap proses kontrak dengan cepat dan presisi.',
    badgeBg: 'bg-orange-500/20 text-orange-100 border-orange-400/40',
    accentColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
  },
  {
    id: 'santai',
    label: 'Santai',
    desc: 'Tenang, semua terkendali',
    greetingTitle: (name) => `Stay cool, ${name}! Semua terkendali! 😎`,
    greetingMessage:
      'Pikiran yang tenang menghasilkan keputusan terbaik. Nikmati ritme kerjamu hari ini dengan nyaman dan teratur.',
    badgeBg: 'bg-cyan-500/20 text-cyan-100 border-cyan-400/40',
    accentColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
  },
  {
    id: 'fokus',
    label: 'Fokus',
    desc: 'Konsentrasi penuh & teliti',
    greetingTitle: (name) => `Mode Fokus Aktif, ${name}! 🎯`,
    greetingMessage:
      'Ketelitianmu adalah kunci! Setiap klausul dan dokumen pasti tuntas dengan rapi dan akurat hari ini.',
    badgeBg: 'bg-blue-500/20 text-blue-100 border-blue-400/40',
    accentColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.45)',
  },
  {
    id: 'lelah',
    label: 'Lelah',
    desc: 'Butuh jeda & tarik napas',
    greetingTitle: (name) => `Hai ${name}, jangan lupa istirahat sejenak ya! 🌙`,
    greetingMessage:
      'Kamu sudah bekerja keras! Ambil napas dalam-dalam, minum air putih, dan kerjakan satu per satu dengan tenang.',
    badgeBg: 'bg-indigo-500/20 text-indigo-100 border-indigo-400/40',
    accentColor: '#818CF8',
    glowColor: 'rgba(129, 140, 248, 0.45)',
  },
  {
    id: 'sedih',
    label: 'Sedih',
    desc: 'Perlu dukungan & semangat baru',
    greetingTitle: (name) => `Peluk hangat untukmu, ${name}! 💛`,
    greetingMessage:
      'Tidak apa-apa jika hari ini terasa berat. Kamu tidak sendirian, pelan-pelan saja ya—besok pasti akan lebih cerah!',
    badgeBg: 'bg-sky-500/20 text-sky-100 border-sky-400/40',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
  },
  {
    id: 'marah',
    label: 'Marah',
    desc: 'Sedang kesal & butuh ruang tenang',
    greetingTitle: (name) => `Tarik napas dulu ya, ${name}! Huft! 😤`,
    greetingMessage:
      'Wajar kok kalau ada hal yang bikin kesal. Tenangkan hati sejenak, biar kepalamu kembali adem sebelum lanjut lagi!',
    badgeBg: 'bg-rose-500/20 text-rose-100 border-rose-400/40',
    accentColor: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.45)',
  },
  {
    id: 'kopi',
    label: 'Butuh Kopi',
    desc: 'Perlu asupan kafein hangat',
    greetingTitle: (name) => `Waktunya ngopi dulu, ${name}! ☕`,
    greetingMessage:
      'Secangkir kopi hangat siap mengembalikan fokus dan mood kerjamu. Nikmati seruputan pertamamu hari ini!',
    badgeBg: 'bg-amber-500/20 text-amber-100 border-amber-400/40',
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
  },
]

interface MoodMascotProps {
  mood: MoodId
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  interactive?: boolean
}

/**
 * Original 3D-Shaded Cute Yellow Plush Mascot ("Sunny Buddy")
 * Features soft 3D volumetric gradients, specular highlights, bouncy round cheeks,
 * cute antenna sprout, cream belly patch, and mood-specific animated expressions.
 */
export function MoodMascot({
  mood,
  size = 'md',
  className = '',
}: MoodMascotProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-40 h-40 sm:w-48 sm:h-48',
  }[size]

  const uid = `mascot-${mood}-${size}`

  // Wrapper animation per mood
  const wrapperAnim = {
    bahagia: 'animate-[mascotBounce_2s_ease-in-out_infinite]',
    semangat: 'animate-[mascotJump_1.1s_ease-in-out_infinite]',
    santai: 'animate-[mascotSway_3s_ease-in-out_infinite]',
    fokus: 'animate-[mascotFloat_2.6s_ease-in-out_infinite]',
    lelah: 'animate-[mascotBreathe_3.6s_ease-in-out_infinite]',
    sedih: 'animate-[mascotShiver_2.8s_ease-in-out_infinite]',
    marah: 'animate-[mascotShake_0.7s_ease-in-out_infinite]',
    kopi: 'animate-[mascotBounce_2.2s_ease-in-out_infinite]',
  }[mood]

  return (
    <div className={`relative inline-flex items-center justify-center select-none shrink-0 ${sizeClasses} ${className}`}>
      <style jsx global>{`
        @keyframes mascotBounce {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          45% { transform: translateY(-7%) scale(1.03, 0.97); }
          55% { transform: translateY(-8%) scale(0.98, 1.03); }
        }
        @keyframes mascotJump {
          0%, 100% { transform: translateY(0) scale(1.04, 0.96); }
          40% { transform: translateY(-13%) scale(0.96, 1.05); }
          60% { transform: translateY(-11%) rotate(3deg); }
        }
        @keyframes mascotSway {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50% { transform: rotate(4deg) translateY(-4%); }
        }
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6%); }
        }
        @keyframes mascotBreathe {
          0%, 100% { transform: translateY(2%) scale(1, 0.97); }
          50% { transform: translateY(-2%) scale(1.03, 1.02); }
        }
        @keyframes mascotShiver {
          0%, 100% { transform: translateY(1%) rotate(-2deg); }
          50% { transform: translateY(3%) rotate(2deg); }
        }
        @keyframes mascotShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3%) rotate(-3deg); }
          75% { transform: translateX(3%) rotate(3deg); }
        }
        @keyframes mascotWaveLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-28deg); }
        }
        @keyframes mascotWaveRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(32deg); }
        }
        @keyframes mascotTearDrop {
          0% { transform: translateY(0) scale(0.8); opacity: 0.95; }
          100% { transform: translateY(10px) scale(1.1); opacity: 0; }
        }
        @keyframes mascotFloatUp {
          0% { transform: translateY(4px) scale(0.85); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-12px) scale(1.15); opacity: 0; }
        }
      `}</style>

      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full overflow-visible drop-shadow-[0_10px_18px_rgba(245,158,11,0.28)] ${wrapperAnim}`}
      >
        <defs>
          {/* 3D Volumetric Yellow Plush Body Gradient */}
          <radialGradient id={`${uid}-body`} cx="36%" cy="28%" r="70%" fx="32%" fy="22%">
            <stop offset="0%" stopColor="#FFF7B2" />
            <stop offset="32%" stopColor="#FFE047" />
            <stop offset="72%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>

          {/* Soft Cream 3D Belly Patch */}
          <radialGradient id={`${uid}-belly`} cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="75%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </radialGradient>

          {/* Warm Rosy Cheek Glow */}
          <radialGradient id={`${uid}-cheek`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mood === 'marah' ? '#EF4444' : '#FB7185'} stopOpacity="0.85" />
            <stop offset="65%" stopColor={mood === 'marah' ? '#F87171' : '#FDA4AF'} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0" />
          </radialGradient>

          {/* 3D Eye Depth */}
          <radialGradient id={`${uid}-eye`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Ground Soft Shadow */}
          <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B2147" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#0B2147" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0B2147" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground Shadow */}
        <ellipse cx="100" cy="184" rx="52" ry="10" fill={`url(#${uid}-shadow)`} />

        {/* Cute Bouncy Stubby Feet */}
        <ellipse cx="73" cy="172" rx="18" ry="12" transform="rotate(-8 73 172)" fill={`url(#${uid}-body)`} stroke="#D97706" strokeWidth="1.5" />
        <ellipse cx="127" cy="172" rx="18" ry="12" transform="rotate(8 127 172)" fill={`url(#${uid}-body)`} stroke="#D97706" strokeWidth="1.5" />

        {/* Cute Back Tail / Pom-pom */}
        <circle cx="152" cy="144" r="13" fill={`url(#${uid}-body)`} stroke="#D97706" strokeWidth="1.2" />

        {/* Main Chubby Pear-Shaped 3D Plush Body & Head */}
        <path
          d="M100 32 C60 32, 38 62, 36 104 C34 146, 56 174, 100 174 C144 174, 166 146, 164 104 C162 62, 140 32, 100 32 Z"
          fill={`url(#${uid}-body)`}
          stroke="#D97706"
          strokeWidth="1.8"
        />

        {/* Cute Rounded Top Head Crest / Plush Ears */}
        <ellipse cx="64" cy="42" rx="14" ry="17" transform="rotate(-28 64 42)" fill={`url(#${uid}-body)`} stroke="#D97706" strokeWidth="1.5" />
        <ellipse cx="64" cy="42" rx="7" ry="9" transform="rotate(-28 64 42)" fill="#FEF08A" opacity="0.8" />
        <ellipse cx="136" cy="42" rx="14" ry="17" transform="rotate(28 136 42)" fill={`url(#${uid}-body)`} stroke="#D97706" strokeWidth="1.5" />
        <ellipse cx="136" cy="42" rx="7" ry="9" transform="rotate(28 136 42)" fill="#FEF08A" opacity="0.8" />

        {/* Top Cute Tuft / Sprout */}
        <path
          d="M100 33 C96 18, 108 12, 114 19 C118 23, 109 31, 100 33 Z"
          fill="#FBBF24"
          stroke="#D97706"
          strokeWidth="1.5"
        />
        <path
          d="M99 33 C92 22, 83 20, 86 28 C88 32, 95 33, 99 33 Z"
          fill="#FDE047"
          stroke="#D97706"
          strokeWidth="1.3"
        />

        {/* 3D Specular Gloss Highlight on Forehead */}
        <ellipse
          cx="76"
          cy="54"
          rx="22"
          ry="10"
          transform="rotate(-18 76 54)"
          fill="#FFFFFF"
           opacity="0.55"
        />
        <circle cx="56" cy="66" r="4.5" fill="#FFFFFF" opacity="0.45" />

        {/* Soft Cream Belly Patch */}
        <ellipse cx="100" cy="138" rx="37" ry="26" fill={`url(#${uid}-belly)`} />

        {/* Rosy Chubby Cheeks */}
        <ellipse cx="56" cy="102" rx="15" ry="10" fill={`url(#${uid}-cheek)`} />
        <ellipse cx="144" cy="102" rx="15" ry="10" fill={`url(#${uid}-cheek)`} />

        {/* Left Arm (Animated Waving / Expressive) */}
        <g
          style={{
            transformOrigin: '42px 116px',
            animation:
              mood === 'bahagia' || mood === 'semangat'
                ? 'mascotWaveLeft 0.9s ease-in-out infinite'
                : mood === 'marah'
                ? 'mascotWaveLeft 0.4s ease-in-out infinite'
                : 'mascotWaveLeft 2.4s ease-in-out infinite',
          }}
        >
          <ellipse
            cx="28"
            cy="112"
            rx="16"
            ry="11"
            transform={mood === 'bahagia' || mood === 'semangat' ? 'rotate(-35 28 112)' : 'rotate(20 28 112)'}
            fill={`url(#${uid}-body)`}
            stroke="#D97706"
            strokeWidth="1.5"
          />
        </g>

        {/* Right Arm (Animated Waving / Expressive) */}
        <g
          style={{
            transformOrigin: '158px 116px',
            animation:
              mood === 'bahagia' || mood === 'semangat'
                ? 'mascotWaveRight 0.9s ease-in-out infinite'
                : mood === 'marah'
                ? 'mascotWaveRight 0.4s ease-in-out infinite'
                : 'mascotWaveRight 2.4s ease-in-out infinite',
          }}
        >
          <ellipse
            cx="172"
            cy="112"
            rx="16"
            ry="11"
            transform={mood === 'bahagia' || mood === 'semangat' ? 'rotate(35 172 112)' : 'rotate(-20 172 112)'}
            fill={`url(#${uid}-body)`}
            stroke="#D97706"
            strokeWidth="1.5"
          />
        </g>

        {/* ============================================================
            MOOD-SPECIFIC FACIAL EXPRESSIONS & 3D PROPS
           ============================================================ */}

        {/* 1. BAHAGIA (Happy & Waving) */}
        {mood === 'bahagia' && (
          <g>
            {/* Big Sparkling Eyes */}
            <circle cx="74" cy="88" r="11" fill={`url(#${uid}-eye)`} />
            <circle cx="70" cy="84" r="4" fill="#FFFFFF" />
            <circle cx="78" cy="92" r="1.8" fill="#FFFFFF" />

            <circle cx="126" cy="88" r="11" fill={`url(#${uid}-eye)`} />
            <circle cx="122" cy="84" r="4" fill="#FFFFFF" />
            <circle cx="130" cy="92" r="1.8" fill="#FFFFFF" />

            {/* Happy Eyebrows */}
            <path d="M62 72 Q74 65 84 72" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
            <path d="M116 72 Q126 65 138 72" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />

            {/* Joyful Wide Smile with Cute Pink Tongue */}
            <path
              d="M82 101 Q100 122 118 101 Z"
              fill="#991B1B"
              stroke="#78350F"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M90 109 Q100 118 110 109 Z" fill="#FB7185" />
            {/* Cute Single Little Tooth */}
            <rect x="96" y="102" width="8" height="4.5" rx="2" fill="#FFFFFF" />

            {/* Floating Heart & Sparkles */}
            <g style={{ animation: 'mascotFloatUp 2s ease-in-out infinite' }}>
              <path
                d="M165 48 C165 43, 158 40, 155 45 C152 40, 145 43, 145 48 C145 55, 155 60, 155 60 C155 60, 165 55, 165 48 Z"
                fill="#FB7185"
              />
            </g>
          </g>
        )}

        {/* 2. SEMANGAT (Energized / Fired Up) */}
        {mood === 'semangat' && (
          <g>
            {/* Red Spirit Headband */}
            <path d="M41 66 Q100 54 159 66" stroke="#EF4444" strokeWidth="7" strokeLinecap="round" />
            <circle cx="163" cy="67" r="4.5" fill="#DC2626" />
            <path d="M165 68 L178 62 M165 70 L176 76" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />

            {/* Starry Determined Eyes */}
            <circle cx="74" cy="89" r="11.5" fill={`url(#${uid}-eye)`} />
            <circle cx="70" cy="85" r="4.2" fill="#FFFFFF" />
            <path d="M76 89 L78 84 L80 89 L85 91 L80 93 L78 98 L76 93 L71 91 Z" fill="#FDE047" />

            <circle cx="126" cy="89" r="11.5" fill={`url(#${uid}-eye)`} />
            <circle cx="122" cy="85" r="4.2" fill="#FFFFFF" />
            <path d="M128 89 L130 84 L132 89 L137 91 L132 93 L130 98 L128 93 L123 91 Z" fill="#FDE047" />

            {/* Energetic Brows */}
            <path d="M62 73 L85 78" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M138 73 L115 78" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />

            {/* Cheerful Open Grin */}
            <path d="M80 103 Q100 124 120 103 Z" fill="#991B1B" stroke="#78350F" strokeWidth="2.5" />
            <path d="M88 111 Q100 120 112 111 Z" fill="#FB7185" />

            {/* Little Flame Spark */}
            <g style={{ animation: 'mascotFloatUp 1.3s ease-in-out infinite' }}>
              <path
                d="M32 52 C32 42, 42 36, 40 28 C48 34, 50 44, 44 52 C40 56, 32 56, 32 52 Z"
                fill="#F97316"
              />
              <circle cx="39" cy="49" r="4" fill="#FDE047" />
            </g>
          </g>
        )}

        {/* 3. SANTAI (Chill with Cool Sunglasses) */}
        {mood === 'santai' && (
          <g>
            {/* Cool 3D Sunglasses */}
            <path d="M39 84 L55 86 M145 86 L161 84" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            <rect x="52" y="76" width="40" height="24" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            <rect x="108" y="76" width="40" height="24" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            <path d="M92 84 Q100 80 108 84" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            {/* Glossy Lens Reflection */}
            <path d="M58 81 L70 81 L63 95 L56 95 Z" fill="#38BDF8" opacity="0.55" />
            <path d="M114 81 L126 81 L119 95 L112 95 Z" fill="#38BDF8" opacity="0.55" />

            {/* Relaxed Confident Smirk */}
            <path d="M86 108 Q102 116 116 104" stroke="#78350F" strokeWidth="3.2" strokeLinecap="round" fill="none" />

            {/* Floating Musical Note */}
            <g style={{ animation: 'mascotFloatUp 2.4s ease-in-out infinite' }}>
              <text x="155" y="54" fontSize="22" fill="#06B6D4" fontWeight="bold">♪</text>
            </g>
          </g>
        )}

        {/* 4. FOKUS (Focused with Smart Glasses) */}
        {mood === 'fokus' && (
          <g>
            {/* Attentive Sparkling Eyes */}
            <circle cx="74" cy="88" r="10" fill={`url(#${uid}-eye)`} />
            <circle cx="71" cy="84" r="3.5" fill="#FFFFFF" />
            <circle cx="126" cy="88" r="10" fill={`url(#${uid}-eye)`} />
            <circle cx="123" cy="84" r="3.5" fill="#FFFFFF" />

            {/* Smart Round Frames */}
            <circle cx="74" cy="88" r="17" stroke="#1E3A8A" strokeWidth="3" fill="#93C5FD" fillOpacity="0.15" />
            <circle cx="126" cy="88" r="17" stroke="#1E3A8A" strokeWidth="3" fill="#93C5FD" fillOpacity="0.15" />
            <path d="M91 88 L109 88" stroke="#1E3A8A" strokeWidth="3" />

            {/* Focused Neat Smile */}
            <path d="M88 109 Q100 116 112 109" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Sparkle Star */}
            <g style={{ animation: 'mascotFloatUp 2.2s ease-in-out infinite' }}>
              <text x="152" y="50" fontSize="20" fill="#3B82F6">✦</text>
            </g>
          </g>
        )}

        {/* 5. LELAH (Sleepy / Tired with Zzz & Sleep Bubble) */}
        {mood === 'lelah' && (
          <g>
            {/* Sleepy Closed Curved Eyes */}
            <path d="M62 88 Q74 97 86 88" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M114 88 Q126 97 138 88" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" fill="none" />

            {/* Droopy Brows */}
            <path d="M63 76 Q74 73 84 78" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M116 78 Q126 73 137 76" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />

            {/* Cute Oval Yawning Mouth */}
            <ellipse cx="100" cy="108" rx="8" ry="10" fill="#991B1B" stroke="#78350F" strokeWidth="2.2" />
            {/* Cute Sleepy Bubble */}
            <circle cx="114" cy="102" r="9" fill="#E0F2FE" fillOpacity="0.75" stroke="#7DD3FC" strokeWidth="1.5" />
            <circle cx="111" cy="99" r="2.5" fill="#FFFFFF" />

            {/* Floating Zzz */}
            <g style={{ animation: 'mascotFloatUp 2.8s ease-in-out infinite' }}>
              <text x="148" y="56" fontSize="16" fontWeight="900" fill="#6366F1">Z</text>
              <text x="162" y="42" fontSize="20" fontWeight="900" fill="#4F46E5">z</text>
              <text x="174" y="28" fontSize="14" fontWeight="900" fill="#818CF8">z</text>
            </g>
          </g>
        )}

        {/* 6. SEDIH (Sad Puppy Eyes & Shimmering Teardrops) */}
        {mood === 'sedih' && (
          <g>
            {/* Big Watery Puppy Eyes */}
            <circle cx="74" cy="89" r="11.5" fill={`url(#${uid}-eye)`} />
            <circle cx="70" cy="84" r="4.5" fill="#FFFFFF" />
            <circle cx="78" cy="93" r="2.2" fill="#FFFFFF" />

            <circle cx="126" cy="89" r="11.5" fill={`url(#${uid}-eye)`} />
            <circle cx="122" cy="84" r="4.5" fill="#FFFFFF" />
            <circle cx="130" cy="93" r="2.2" fill="#FFFFFF" />

            {/* Sad Worried Eyebrows */}
            <path d="M60 77 Q72 70 84 73" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
            <path d="M116 73 Q128 70 140 77" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />

            {/* Animated Shimmering Teardrops */}
            <g style={{ animation: 'mascotTearDrop 1.6s ease-in infinite' }}>
              <path d="M63 98 C60 104, 60 109, 63 109 C66 109, 66 104, 63 98 Z" fill="#38BDF8" />
              <path d="M137 98 C134 104, 134 109, 137 109 C140 109, 140 104, 137 98 Z" fill="#38BDF8" />
            </g>

            {/* Quivering Pouty Mouth */}
            <path d="M86 112 Q100 102 114 112" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* 7. MARAH (Cute Grumpy Pout & Steam Puffs) */}
        {mood === 'marah' && (
          <g>
            {/* Intense Cute Eyes */}
            <circle cx="74" cy="90" r="10.5" fill={`url(#${uid}-eye)`} />
            <circle cx="71" cy="86" r="3.5" fill="#FFFFFF" />
            <circle cx="126" cy="90" r="10.5" fill={`url(#${uid}-eye)`} />
            <circle cx="123" cy="86" r="3.5" fill="#FFFFFF" />

            {/* Deep V-Shaped Angry Eyebrows */}
            <path d="M58 72 L87 82" stroke="#78350F" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M142 72 L113 82" stroke="#78350F" strokeWidth="4.2" strokeLinecap="round" />

            {/* Grumpy Wavy Pout Mouth */}
            <path
              d="M84 111 Q92 104 100 110 Q108 104 116 111"
              stroke="#78350F"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cute Comic Anger Vein & Steam Puff */}
            <g style={{ animation: 'mascotFloatUp 1.1s ease-in-out infinite' }}>
              <path d="M150 42 L156 48 L150 54 M164 42 L158 48 L164 54" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* 8. KOPI (Holding Warm Steaming Coffee Cup) */}
        {mood === 'kopi' && (
          <g>
            {/* Happy Wide Eyes */}
            <circle cx="74" cy="88" r="10.5" fill={`url(#${uid}-eye)`} />
            <circle cx="70" cy="84" r="3.8" fill="#FFFFFF" />
            <circle cx="126" cy="88" r="10.5" fill={`url(#${uid}-eye)`} />
            <circle cx="122" cy="84" r="3.8" fill="#FFFFFF" />

            {/* Cheerful Smile */}
            <path d="M88 104 Q100 114 112 104" stroke="#78350F" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Cute 3D Coffee Mug Held in Front */}
            <rect x="84" y="118" width="32" height="28" rx="6" fill="#FFFFFF" stroke="#92400E" strokeWidth="2.2" />
            <path d="M116 124 C124 124, 124 138, 116 138" stroke="#92400E" strokeWidth="2.5" fill="none" />
            <rect x="88" y="128" width="24" height="10" rx="3" fill="#D97706" />
            {/* Warm Coffee Steam */}
            <g style={{ animation: 'mascotFloatUp 1.8s ease-in-out infinite' }}>
              <path d="M94 114 Q91 108 95 104" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M105 114 Q102 108 106 104" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * Full-Screen Interactive Greeting Overlay when a mood is selected
 */
export function MoodGreetingOverlay({
  mood,
  userName,
  onClose,
}: {
  mood: MoodOption | null
  userName: string
  onClose: () => void
}) {
  useEffect(() => {
    if (!mood) return
    const timer = setTimeout(() => {
      onClose()
    }, 3400)
    return () => clearTimeout(timer)
  }, [mood, onClose])

  if (!mood) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071326]/70 backdrop-blur-md p-4 animate-in fade-in duration-300 cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-white via-[#FFFDF7] to-[#FEF9C3]/40 border-2 border-amber-200/80 p-6 sm:p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.45)] animate-in zoom-in-95 duration-300"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Radial Glow Behind Mascot */}
        <div className="relative mx-auto flex items-center justify-center my-2">
          <div
            className="absolute h-36 w-36 sm:h-44 sm:w-44 rounded-full blur-2xl opacity-60 animate-pulse"
            style={{ background: mood.glowColor }}
          />
          <MoodMascot mood={mood.id} size="xl" />
        </div>

        {/* Mood Badge Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3.5 py-1 text-xs font-extrabold text-amber-900 shadow-2xs mt-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span>Suasana Hati: {mood.label}</span>
        </div>

        {/* Personalized Greeting Title */}
        <h2 className="text-lg sm:text-xl font-extrabold font-display text-[#0B2147] mt-3 leading-snug">
          {mood.greetingTitle(userName)}
        </h2>

        {/* Encouraging Short Message */}
        <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed max-w-sm mx-auto">
          {mood.greetingMessage}
        </p>

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs px-6 py-3 shadow-md active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Terima Kasih, Lanjut Bekerja!</span>
          </button>
        </div>
      </div>
    </div>
  )
}
