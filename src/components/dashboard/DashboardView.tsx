"use client"

import React, { useState, useEffect } from 'react'
import { useApp, DocumentItem } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Inbox,
  Search,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Ban,
  Check,
  X,
  Calendar,
  PackageCheck,
  Briefcase,
  FileSignature,
  ShieldAlert,
  Handshake,
  Scale,
  Award,
  Building,
  Send,
  PenTool,
  Archive,
  AlertTriangle,
  History,
  Download,
  FileEdit,
  MapPin,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Thermometer,
  Sparkles,
} from 'lucide-react'

function getWeatherIcon(code: number | null) {
  if (code === null) return CloudSun
  if (code === 0) return Sun
  if (code === 1 || code === 2) return CloudSun
  if (code === 3) return Cloud
  if (code >= 45 && code <= 48) return CloudFog
  if (code >= 51 && code <= 57) return CloudDrizzle
  if (code >= 61 && code <= 67) return CloudRain
  if (code >= 71 && code <= 77) return CloudSnow
  if (code >= 80 && code <= 82) return CloudRain
  if (code >= 95) return CloudLightning
  return CloudSun
}

function getWeatherCondition(code: number | null): string {
  if (code === null) return 'Cerah Berawan'
  if (code === 0) return 'Cerah'
  if (code === 1 || code === 2) return 'Cerah Berawan'
  if (code === 3) return 'Berawan'
  if (code >= 45 && code <= 48) return 'Berkabut'
  if (code >= 51 && code <= 57) return 'Gerimis'
  if (code >= 61 && code <= 67) return 'Hujan'
  if (code >= 71 && code <= 77) return 'Bersalju'
  if (code >= 80 && code <= 82) return 'Hujan Deras'
  if (code >= 95) return 'Hujan Petir'
  return 'Cerah Berawan'
}

function AnalogClock({ date, className = 'h-8 w-8' }: { date: Date | null; className?: string }) {
  const d = date || new Date()
  const seconds = d.getSeconds()
  const minutes = d.getMinutes()
  const hours = d.getHours()

  const secDeg = seconds * 6
  const minDeg = minutes * 6 + seconds * 0.1
  const hrDeg = (hours % 12) * 30 + minutes * 0.5

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Outer White Dial Circle — High Contrast & Sangat Jelas Kelihatan */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="2.5"
        />

        {/* 12 Hour Ticks (Bold at 12, 3, 6, 9) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1={deg % 90 === 0 ? '6' : '9'}
            x2="50"
            y2={deg % 90 === 0 ? '16' : '13'}
            stroke={deg % 90 === 0 ? '#0B2147' : '#94A3B8'}
            strokeWidth={deg % 90 === 0 ? '3.5' : '1.8'}
            strokeLinecap="round"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}

        {/* Hour Hand (Bold Deep Navy) */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="24"
          stroke="#0B2147"
          strokeWidth="4.2"
          strokeLinecap="round"
          transform={`rotate(${hrDeg} 50 50)`}
        />

        {/* Minute Hand (Royal Navy) */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="#1E3A8A"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${minDeg} 50 50)`}
        />

        {/* Second Hand (Vivid Red Ticker) */}
        <line
          x1="50"
          y1="59"
          x2="50"
          y2="11"
          stroke="#DC2626"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${secDeg} 50 50)`}
        />

        {/* Center Pivot Pin (Red & White dot) */}
        <circle cx="50" cy="50" r="3.5" fill="#DC2626" />
        <circle cx="50" cy="50" r="1.2" fill="#FFFFFF" />
      </svg>
    </div>
  )
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const STAGES = [
  { key: 'submitted', label: 'Pengajuan Baru', icon: Send },
  { key: 'review', label: 'Peninjauan Kelayakan', icon: Search },
  { key: 'drafting', label: 'Penyusunan Draf', icon: PenTool },
  { key: 'approval', label: 'Persetujuan Legal', icon: FileCheck2 },
  { key: 'bod', label: 'Persetujuan Direksi', icon: FileSignature },
  { key: 'archived', label: 'Selesai & Arsip', icon: Archive },
  { key: 'renewal', label: 'Jatuh Tempo', icon: Clock },
]

const CONSIDERATION_OPTIONS = [
  'Performa dan kualitas layanan/barang vendor memuaskan',
  'Kebutuhan operasional unit kerja masih berlanjut',
  'Efisiensi biaya dan ketersediaan pagu anggaran',
  'Tidak ada temuan ketidakpatuhan atau sengketa hukum',
  'Terdapat perubahan ruang lingkup (Scope of Work)',
  'Kebutuhan pengadaan telah selesai / tidak dilanjutkan',
  'Tersedia alternatif vendor atau penyedia yang lebih kompetitif',
  'Klausul kontrak memerlukan adendum atau penyesuaian harga/jangka waktu',
]

export interface MoodOption {
  id: string
  emoji: string
  label: string
  desc: string
  animation: string
  color: string
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'semangat',
    emoji: '🔥',
    label: 'Semangat',
    desc: 'Siap menuntaskan target & pengajuan!',
    animation: 'animate-mood-bounce',
    color: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
  },
  {
    id: 'fokus',
    emoji: '🎯',
    label: 'Fokus',
    desc: 'Konsentrasi tinggi & mode hening',
    animation: 'animate-mood-float',
    color: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
  },
  {
    id: 'kopi',
    emoji: '☕',
    label: 'Butuh Kopi',
    desc: 'Perlu kafein biar segar kembali',
    animation: 'animate-mood-float',
    color: 'bg-amber-600/20 text-amber-200 border-amber-500/40',
  },
  {
    id: 'bahagia',
    emoji: '😊',
    label: 'Bahagia',
    desc: 'Hari menyenangkan & penuh senyum',
    animation: 'animate-mood-bounce',
    color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  },
  {
    id: 'santai',
    emoji: '😎',
    label: 'Santai',
    desc: 'Semua terkendali & tenang',
    animation: 'animate-mood-float',
    color: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  },
  {
    id: 'gaspol',
    emoji: '🚀',
    label: 'Gaspol',
    desc: 'Kecepatan penuh tuntaskan berkas!',
    animation: 'animate-mood-bounce',
    color: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
  },
  {
    id: 'ide',
    emoji: '💡',
    label: 'Kreatif',
    desc: 'Banyak ide segar bermunculan',
    animation: 'animate-mood-float',
    color: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
  },
  {
    id: 'lelah',
    emoji: '😴',
    label: 'Lelah',
    desc: 'Baterai tipis, butuh jeda istirahat',
    animation: 'animate-mood-float',
    color: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
  },
]

export function DashboardView() {
  const {
    user,
    documents,
    setCurrentView,
    setSelectedDocNumber,
    submitDecision,
  } = useApp()

  const canManageExpiry = user?.role !== 'Requester' && user?.role !== 'User'

  // Mood state
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false)
  const userMoodKey = `ride_user_mood_${user?.id || user?.email || 'default'}`
  const [currentMood, setCurrentMood] = useState<MoodOption>(MOOD_OPTIONS[0])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(userMoodKey)
      if (saved) {
        const found = MOOD_OPTIONS.find((m) => m.id === saved)
        if (found) setCurrentMood(found)
      }
    } catch {}
  }, [userMoodKey])

  const handleSelectMood = (mood: MoodOption) => {
    setCurrentMood(mood)
    try {
      localStorage.setItem(userMoodKey, mood.id)
    } catch {}
    setIsMoodModalOpen(false)
    toast.success(`Suasana hati diperbarui: ${mood.emoji} ${mood.label}`)
  }

  // State for Decision Modal
  const [decisionDoc, setDecisionDoc] = useState<DocumentItem | null>(null)
  const [decisionType, setDecisionType] = useState<'renew' | 'terminate' | 'amendment'>('renew')
  const [considerations, setConsiderations] = useState<string[]>([])
  const [justification, setJustification] = useState('')
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)

  // Tracking picker
  const [trackerDocNo, setTrackerDocNo] = useState<string>(
    documents[0]?.docNumber || ''
  )

  const activeTrackerDoc =
    documents.find((d) => d.docNumber === trackerDocNo) || documents[0]

  // KPIs
  const totalCount = documents.length
  const revisionCount = documents.filter((d) => d.revisionRequested && !d.rejected).length
  const inProgressCount = documents.filter(
    (d) => d.stage >= 0 && d.stage <= 4 && !d.revisionRequested && !d.rejected
  ).length
  const completedCount = documents.filter((d) => d.stage >= 5 || d.stageStatus === 'completed').length

  // Documents expiring soon (<= 60 days)
  const now = new Date()
  const expiringDocs = documents
    .filter((d) => {
      if (!d.contractEnd) return false
      const end = new Date(d.contractEnd)
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 60 && diffDays >= -30
    })
    .sort((a, b) => {
      const dateA = a.contractEnd ? new Date(a.contractEnd).getTime() : 0
      const dateB = b.contractEnd ? new Date(b.contractEnd).getTime() : 0
      return dateA - dateB
    })

  const handleOpenDecision = (doc: DocumentItem, defaultType: 'renew' | 'terminate' | 'amendment' = 'renew') => {
    setDecisionDoc(doc)
    setDecisionType(defaultType)
    setConsiderations([])
    setJustification('')
    setIsDecisionOpen(true)
  }

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!decisionDoc) return
    if (!justification.trim()) {
      toast.error('Justifikasi keputusan wajib diisi.')
      return
    }

    const ok = await submitDecision(decisionDoc._id, {
      type: decisionType,
      justification,
      considerations,
    })

    if (ok) {
      toast.success(`Keputusan ${decisionType === 'renew' ? 'Perpanjangan' : 'Terminasi'} untuk ${decisionDoc.docNumber} berhasil disimpan.`)
      setIsDecisionOpen(false)
    } else {
      toast.error('Gagal menyimpan keputusan ke database.')
    }
  }

  const toggleConsideration = (item: string) => {
    setConsiderations((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Real-time Weather & Location State
  const [weatherData, setWeatherData] = useState<{
    temperature: number | null
    weatherCode: number | null
    condition: string
    location: string
    loading: boolean
  }>({
    temperature: null,
    weatherCode: null,
    condition: 'Memuat...',
    location: 'Jakarta, ID',
    loading: true,
  })

  // Live Clock Ticker
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Live Location & Weather Fetcher
  useEffect(() => {
    let isMounted = true

    async function fetchWeather(lat: number, lon: number, locationLabel: string) {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        )
        if (weatherRes.ok && isMounted) {
          const wData = await weatherRes.json()
          const code = wData.current?.weather_code ?? 1
          const temp =
            typeof wData.current?.temperature_2m === 'number'
              ? Math.round(wData.current.temperature_2m)
              : 28
          setWeatherData({
            temperature: temp,
            weatherCode: code,
            condition: getWeatherCondition(code),
            location: locationLabel,
            loading: false,
          })
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    async function initLocationAndWeather() {
      let lat = -6.2088
      let lon = 106.8456
      let locName = 'Jakarta, ID'

      // 1. IP Geolocation (Instant, zero browser popups)
      try {
        const geoRes = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=id')
        if (geoRes.ok) {
          const geo = await geoRes.json()
          if (geo.latitude && geo.longitude) {
            lat = geo.latitude
            lon = geo.longitude
            const city = geo.city || geo.locality || geo.principalSubdivision || 'Jakarta'
            const country = geo.countryCode || 'ID'
            locName = `${city}, ${country}`
          }
        }
      } catch (e) {
        // Default to Jakarta
      }

      if (isMounted) {
        await fetchWeather(lat, lon, locName)
      }

      // 2. Refine with precise GPS if device permitted
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (!isMounted) return
            const gpsLat = pos.coords.latitude
            const gpsLon = pos.coords.longitude
            try {
              const rGeo = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${gpsLat}&longitude=${gpsLon}&localityLanguage=id`
              )
              if (rGeo.ok) {
                const geoData = await rGeo.json()
                const gpsCity = geoData.city || geoData.locality || geoData.principalSubdivision || 'Jakarta'
                const gpsCountry = geoData.countryCode || 'ID'
                await fetchWeather(gpsLat, gpsLon, `${gpsCity}, ${gpsCountry}`)
              }
            } catch (e) {
              await fetchWeather(gpsLat, gpsLon, locName)
            }
          },
          () => {},
          { timeout: 5000, maximumAge: 300000 }
        )
      }
    }

    initLocationAndWeather()

    const weatherTimer = setInterval(initLocationAndWeather, 10 * 60 * 1000)
    return () => {
      isMounted = false
      clearInterval(weatherTimer)
    }
  }, [])

  const WeatherIcon = getWeatherIcon(weatherData.weatherCode)

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Hero Banner — Responsive (Mode HP Ringkas & Elegan, Mode Desktop Lengkap) */}
      {/* Mobile View (HP) — Simpel & Bebas Tabrakan */}
      <div className="sm:hidden relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] p-3.5 text-white shadow-sm">
        {/* Header Baris Atas: RIDE & Direktorat di kiri, Jam & Cuaca di POJOK KANAN ATAS */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-white/10">
          {/* Sisi Kiri: RIDE & Divisi/Direktorat di Bawahnya */}
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-base font-display tracking-wider text-white">
                RIDE
              </span>
              <span className="rounded bg-[#60A5FA]/20 px-1.5 py-0.2 text-[8.5px] font-bold text-[#93C5FD] tracking-wide uppercase border border-[#60A5FA]/30">
                Platform
              </span>
              <button
                type="button"
                onClick={() => setIsMoodModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all px-2 py-0.5 border border-white/25 text-white cursor-pointer shadow-2xs"
                title="Pilih Suasana Hati Anda Hari Ini"
              >
                <span className={`text-sm ${currentMood.animation}`}>{currentMood.emoji}</span>
                <span className="text-[9.5px] font-medium text-white/95">{currentMood.label}</span>
                <Sparkles className="h-2 w-2 text-amber-300 shrink-0 opacity-80" />
              </button>
            </div>
            <div className="text-[10.5px] font-medium text-white/80 truncate">
              {user?.division || 'Direktorat Legal & Compliance'}
            </div>
          </div>

          {/* Pojok Kanan Atas: Jam Bundar Putih & Cuaca Sangat Jelas */}
          <div className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-md px-2.5 py-1.5 border border-white/20 shrink-0 shadow-sm">
            <AnalogClock date={currentTime} className="h-7 w-7 shrink-0" />
            <div className="text-right leading-tight">
              <div className="font-mono text-xs font-bold text-white tracking-wider">
                {currentTime
                  ? currentTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })
                  : '--:--:--'}
              </div>
              <div className="text-[9.5px] text-white/85 mt-0.5 flex items-center justify-end gap-1">
                <MapPin className="h-2.5 w-2.5 text-[#F87171] shrink-0" />
                <span className="truncate max-w-[55px]">{weatherData.location.split(',')[0]}</span>
                <span className="text-white/40">•</span>
                <span className="font-bold text-white">
                  {weatherData.temperature !== null ? `${weatherData.temperature}°` : '--'}
                </span>
                <WeatherIcon className="h-2.5 w-2.5 text-[#FBBF24] shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Sapaan Pengguna: Bebas Ruang, 100% Tidak Menabrak */}
        <div className="space-y-0.5">
          <div className="text-[11px] text-white/75 font-medium">Selamat Datang,</div>
          <h1 className="text-base font-bold font-display text-white tracking-tight">
            {user?.employeeName || 'Pengguna'} 👋
          </h1>
          <p className="text-[10px] text-white/70">
            {user?.role || 'Karyawan'} • Request Integrated Document Ecosystem
          </p>
        </div>
      </div>

      {/* Desktop / Tablet View — Bebas Tabrakan di Segala Resolusi */}
      <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] p-5 sm:p-6 text-white shadow-md">
        {/* Header Baris Atas: RIDE & Direktorat di kiri, Jam & Cuaca di POJOK KANAN ATAS */}
        <div className="flex items-center justify-between gap-4 pb-3 mb-3.5 border-b border-white/10">
          {/* Sisi Kiri: RIDE & Divisi/Direktorat di Bawahnya */}
          <div className="space-y-0.5 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl font-display tracking-wider text-white">
                RIDE
              </span>
              <span className="rounded-md bg-[#60A5FA]/20 px-1.5 py-0.5 text-[9.5px] font-bold text-[#93C5FD] tracking-wide uppercase border border-[#60A5FA]/30">
                Platform
              </span>
              <button
                type="button"
                onClick={() => setIsMoodModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 hover:border-white/35 active:scale-95 transition-all px-2.5 py-0.5 border border-white/25 text-white cursor-pointer shadow-2xs group ml-1"
                title="Klik untuk memilih suasana hati Anda hari ini"
              >
                <span className={`text-base ${currentMood.animation}`}>{currentMood.emoji}</span>
                <span className="text-[10.5px] font-medium text-white/95 group-hover:text-white">{currentMood.label}</span>
                <Sparkles className="h-2.5 w-2.5 text-amber-300 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <div className="text-xs font-semibold text-white/85 tracking-tight truncate">
              {user?.division || 'Direktorat Legal & Compliance'}
            </div>
          </div>

          {/* Pojok Kanan Atas: Jam Bundar Putih & Cuaca Sangat Jelas */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur-md px-3 py-1.5 border border-white/20 shrink-0 shadow-sm">
            <AnalogClock date={currentTime} className="h-8.5 w-8.5 shrink-0" />
            <div className="text-right leading-tight">
              <div className="font-mono text-sm font-bold text-white tracking-wider">
                {currentTime
                  ? currentTime.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })
                  : '--:--:--'}
                <span className="text-[10px] text-[#93C5FD] ml-1 font-sans font-semibold">WIB</span>
              </div>
              <div className="text-[11px] text-white/85 mt-1 flex items-center justify-end gap-1.5">
                <MapPin className="h-3 w-3 text-[#F87171] shrink-0" />
                <span>{weatherData.location.split(',')[0]}</span>
                <span className="text-white/40">•</span>
                <WeatherIcon className="h-3.5 w-3.5 text-[#FBBF24] shrink-0" />
                <span className="font-bold text-white">
                  {weatherData.temperature !== null ? `${weatherData.temperature}°C` : '--°C'}
                </span>
                <span className="text-white/70 text-[10px] hidden md:inline">{weatherData.condition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Konten Utama Banner: Sapaan & Tombol Aksi */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
              Selamat Datang, {user?.employeeName || 'Pengguna'} 👋
            </h1>
            <p className="text-xs text-white/75 max-w-xl leading-relaxed">
              Pantau pengajuan berkas, tracking persetujuan, dan jatuh tempo kontrak Anda dalam satu ekosistem terpadu.
            </p>
          </div>

          <Button
            onClick={() => setCurrentView('tracking', 'new')}
            className="h-9 sm:h-10 bg-white text-[#163A70] hover:bg-[#EBF2FF] font-bold text-xs shadow-md border-0 shrink-0 cursor-pointer rounded-xl gap-2 px-4 transition-transform active:scale-95 self-start md:self-auto"
          >
            <Plus className="h-4 w-4 text-[#163A70]" />
            <span>Ajukan Dokumen</span>
          </Button>
        </div>
      </div>

      {/* 4 Simple KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Documents */}
        <Card
          onClick={() => setCurrentView('myDocuments')}
          className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] cursor-pointer rounded-2xl overflow-hidden"
        >
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#EBF2FF] text-[#163A70]">
                <Inbox className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-[#059669]">
                Semua
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Pengajuan Saya</div>
            <div className="text-xl sm:text-3xl font-extrabold text-[#0B2147] mt-0.5">
              {totalCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-0.5">Total berkas terdaftar</div>
          </CardContent>
        </Card>

        {/* Revision Needed */}
        <Card
          onClick={() => setCurrentView('tracking', 'progress')}
          className={`hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] cursor-pointer rounded-2xl overflow-hidden ${
            revisionCount > 0 ? 'ring-1 ring-[#D97706]/40 bg-[#FFFBEB]/30' : ''
          }`}
        >
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FFFBEB] text-[#D97706]">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-[#D97706] border border-[#FDE68A]">
                Tindakan
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Perlu Revisi</div>
            <div className="text-xl sm:text-3xl font-extrabold text-[#D97706] mt-0.5">
              {revisionCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-0.5">Menunggu perbaikan</div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card
          onClick={() => setCurrentView('tracking', 'progress')}
          className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] cursor-pointer rounded-2xl overflow-hidden"
        >
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                <FileCheck2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-[#2563EB]">
                Berjalan
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Sedang Diproses</div>
            <div className="text-xl sm:text-3xl font-extrabold text-[#2563EB] mt-0.5">
              {inProgressCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-0.5">Peninjauan &amp; draf</div>
          </CardContent>
        </Card>

        {/* Completed / Final Documents */}
        <Card
          onClick={() => setCurrentView('myDocuments')}
          className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] cursor-pointer rounded-2xl overflow-hidden"
        >
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#ECFDF5] text-[#059669]">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-[#059669]">
                Sah
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Dokumen Final</div>
            <div className="text-xl sm:text-3xl font-extrabold text-[#059669] mt-0.5">
              {completedCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-0.5">Bertanda tangan sah</div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Expiry & Reminders Section */}
      <Card className="border-[#E2E8F0] shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-4 sm:p-6 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#D97706] shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-display text-[#0B2147]">
                  Pengingat Jatuh Tempo Kontrak
                </h2>
                <p className="text-[11px] sm:text-xs text-[#64748B]">
                  Dokumen kontrak yang mendekati tanggal berakhir (&le; 60 hari).
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('tracking', 'progress')}
              className="self-start sm:self-auto text-xs h-8 sm:h-9 font-semibold text-[#163A70] rounded-xl cursor-pointer gap-1"
            >
              <span>Lacak Jatuh Tempo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            {expiringDocs.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#64748B]">
                Tidak ada dokumen kontrak yang mendekati jatuh tempo saat ini.
              </div>
            ) : (
              expiringDocs.slice(0, 4).map((doc) => {
                const end = new Date(doc.contractEnd!)
                const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const isCritical = diffDays <= 7
                const isUrgent = diffDays <= 30 && diffDays > 7

                return (
                  <div
                    key={doc._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] p-3.5 sm:p-4 hover:border-[#CBD5E1] transition-all bg-[#F8FAFC]/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#163A70]">
                          {doc.docNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-bold ${
                            isCritical
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                              : isUrgent
                              ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                              : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                          }`}
                        >
                          {diffDays < 0
                            ? `Lewat ${Math.abs(diffDays)} Hari`
                            : diffDays === 0
                            ? 'Jatuh Tempo Hari Ini'
                            : `H-${diffDays} Jatuh Tempo`}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-[#0F172A]">{doc.name}</div>
                      <div className="text-[11px] text-[#64748B] flex flex-wrap items-center gap-1.5">
                        <span>{doc.division}</span>
                        <span>•</span>
                        <span>Berakhir: {end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {canManageExpiry && (
                      <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 w-full sm:w-auto pt-1 sm:pt-0">
                        <Button
                          size="sm"
                          onClick={() => handleOpenDecision(doc, 'renew')}
                          className="h-7 sm:h-8 text-[10.5px] sm:text-xs bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl cursor-pointer px-2 justify-center"
                        >
                          <RefreshCw className="h-3 w-3 mr-1 shrink-0" />
                          <span>Perpanjang</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDecision(doc, 'amendment')}
                          className="h-7 sm:h-8 text-[10.5px] sm:text-xs text-[#2563EB] hover:bg-[#EFF6FF] border-[#BFDBFE] font-bold rounded-xl cursor-pointer px-2 justify-center"
                        >
                          <FileEdit className="h-3 w-3 mr-1 shrink-0" />
                          <span>Adendum</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDecision(doc, 'terminate')}
                          className="h-7 sm:h-8 text-[10.5px] sm:text-xs text-[#DC2626] hover:bg-[#FEF2F2] border-[#FCA5A5] font-bold rounded-xl cursor-pointer px-2 justify-center"
                        >
                          <Ban className="h-3 w-3 mr-1 shrink-0" />
                          <span>Terminasi</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time 7-Stage Workflow Progress Tracker */}
      <Card className="border-[#E2E8F0] shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardContent className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-base font-bold font-display text-[#0B2147]">
                Status Alur Persetujuan &amp; Versi Dokumen
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pemantauan 7 tahapan alur kerja legal dari pengajuan draf hingga berkas final sah.
              </p>
            </div>

            <select
              value={trackerDocNo}
              onChange={(e) => setTrackerDocNo(e.target.value)}
              className="h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] w-full sm:w-auto sm:max-w-xs truncate focus:border-[#163A70] focus:outline-none"
            >
              {documents.map((d) => (
                <option key={d.docNumber} value={d.docNumber}>
                  {d.docNumber} — {d.name}
                </option>
              ))}
            </select>
          </div>

          {activeTrackerDoc && (
            <div className="space-y-4 sm:space-y-6">
              {/* Document Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#163A70]">
                      {activeTrackerDoc.docNumber}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold bg-[#EBF2FF] text-[#163A70]">
                      {activeTrackerDoc.category}
                    </Badge>
                    {activeTrackerDoc.versions?.length > 0 && (
                      <span className="rounded-md bg-[#EEF2FF] text-[#4F46E5] font-bold text-[10px] px-2 py-0.5 font-mono border border-[#C7D2FE]">
                        Versi Aktif: {activeTrackerDoc.versions[activeTrackerDoc.versions.length - 1].version}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-[#0F172A] mt-1 line-clamp-2">
                    {activeTrackerDoc.name}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDocNumber(activeTrackerDoc.docNumber)
                    setCurrentView('tracking', 'progress')
                  }}
                  className="h-8.5 sm:h-9 text-xs bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-xl gap-1.5 w-full sm:w-auto justify-center cursor-pointer"
                >
                  <History className="h-3.5 w-3.5" />
                  Lihat Riwayat &amp; Versi Lengkap
                </Button>
              </div>

              {/* 7 Stage Pipeline */}
              {/* Tampilan Mobile (HP): Stepper Linear Ringkas & Progress Bar */}
              <div className="sm:hidden space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-[#163A70] uppercase tracking-wider">
                      Tahap Saat Ini
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        activeTrackerDoc.revisionRequested
                          ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                          : activeTrackerDoc.stage >= 5
                          ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                          : 'bg-[#EBF2FF] text-[#163A70] border border-[#BFDBFE]'
                      }`}
                    >
                      {activeTrackerDoc.revisionRequested
                        ? 'Perlu Revisi'
                        : activeTrackerDoc.stage >= 5
                        ? 'Dokumen Sah'
                        : `Tahap ${activeTrackerDoc.stage + 1} dari 7`}
                    </span>
                  </div>

                  <div className="text-xs font-extrabold text-[#0B2147]">
                    {STAGES[activeTrackerDoc.stage]?.label || 'Proses'}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#64748B] font-semibold">
                      <span>Kelengkapan Alur</span>
                      <span>{Math.round(((activeTrackerDoc.stage + 1) / 7) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#163A70] to-[#2563EB] rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(((activeTrackerDoc.stage + 1) / 7) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Horizontal stage pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
                  {STAGES.map((st, idx) => {
                    const isPast = activeTrackerDoc.stage > idx
                    const isCurrent = activeTrackerDoc.stage === idx
                    const isRevision = isCurrent && activeTrackerDoc.revisionRequested
                    return (
                      <div
                        key={st.key}
                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10.5px] font-bold snap-start ${
                          isRevision
                            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                            : isCurrent
                            ? 'bg-[#163A70] border-[#163A70] text-white shadow-xs'
                            : isPast
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                        }`}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-extrabold">
                          {isPast ? '✓' : idx + 1}
                        </span>
                        <span className="whitespace-nowrap">{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tampilan Tablet / Desktop: 7 Kolom Grid */}
              <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {STAGES.map((st, idx) => {
                  const Icon = st.icon
                  const isPast = activeTrackerDoc.stage > idx
                  const isCurrent = activeTrackerDoc.stage === idx
                  const isRevision = isCurrent && activeTrackerDoc.revisionRequested

                  return (
                    <div
                      key={st.key}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isRevision
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                          : isCurrent
                          ? 'bg-[#163A70] border-[#163A70] text-white shadow-sm'
                          : isPast
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-1.5 bg-white/20">
                        {isPast ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wide">
                        Tahap {idx + 1}
                      </div>
                      <div className="text-[11px] font-bold mt-0.5 leading-tight line-clamp-1">
                        {st.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Dialog */}
      <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">
              Keputusan Kontrak — {decisionDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Tentukan langkah perpanjangan atau terminasi terhadap kontrak ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">Rekomendasi Tindakan Kontrak</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={decisionType === 'renew' ? 'default' : 'outline'}
                  onClick={() => setDecisionType('renew')}
                  className={`text-xs h-10 ${decisionType === 'renew' ? 'bg-[#059669] hover:bg-[#047857] text-white font-bold' : ''}`}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Perpanjang
                </Button>
                <Button
                  type="button"
                  variant={decisionType === 'amendment' ? 'default' : 'outline'}
                  onClick={() => setDecisionType('amendment')}
                  className={`text-xs h-10 ${decisionType === 'amendment' ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold' : ''}`}
                >
                  <FileEdit className="h-3.5 w-3.5 mr-1" /> Adendum
                </Button>
                <Button
                  type="button"
                  variant={decisionType === 'terminate' ? 'destructive' : 'outline'}
                  onClick={() => setDecisionType('terminate')}
                  className="text-xs h-10"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" /> Terminasi
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">Faktor Pertimbangan</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1">
                {CONSIDERATION_OPTIONS.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={considerations.includes(opt)}
                      onChange={() => toggleConsideration(opt)}
                      className="rounded text-[#163A70]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">Catatan &amp; Justifikasi Keputusan</label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Tuliskan justifikasi keputusan perpanjangan/terminasi..."
                rows={3}
                required
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDecisionOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                Simpan Keputusan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mood Selector Modal / Dialog */}
      <Dialog open={isMoodModalOpen} onOpenChange={setIsMoodModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white shadow-2xl border border-slate-100">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-mood-bounce inline-block">✨</span>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#0B2147] font-display">
                Suasana Hati Anda Hari Ini
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Pilih ekspresi yang menggambarkan kondisi hati Anda hari ini. Emoji akan ditampilkan dengan animasi di kolom RIDE Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = currentMood.id === mood.id
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleSelectMood(mood)}
                  className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-[#163A70] bg-[#163A70]/8 ring-2 ring-[#163A70]/25 shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#163A70] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                  <span className={`text-3xl sm:text-4xl mb-1.5 ${mood.animation}`}>
                    {mood.emoji}
                  </span>
                  <span className="font-bold text-xs text-[#0B2147] group-hover:text-[#163A70]">
                    {mood.label}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                    {mood.desc}
                  </span>
                </button>
              )
            })}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMoodModalOpen(false)}
              className="w-full sm:w-auto text-xs rounded-xl"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
