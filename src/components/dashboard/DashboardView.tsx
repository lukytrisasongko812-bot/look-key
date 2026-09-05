"use client"

import React, { useState } from 'react'
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
  FolderOpen,
  ShieldCheck,
  Users,
  Settings,
  User as UserIcon,
  KeyRound,
  Sparkles,
  FilePlus,
  GitPullRequestDraft,
  Files,
} from 'lucide-react'
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

export function DashboardView() {
  const {
    user,
    documents,
    setCurrentView,
    setSelectedDocNumber,
    submitDecision,
  } = useApp()

  const canManageExpiry = user?.role !== 'Requester' && user?.role !== 'User'

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

  const isAdmin = user?.role === 'Administrator' || user?.role === 'Director / BOD'
  const isRequester = user?.role === 'Requester' || user?.role === 'User'
  const reviewBadgeCount = documents.filter((d) => d.stage === 0 || d.stage === 1 || d.revisionRequested).length
  const myDocsBadgeCount = documents.filter((d) => !user || d.pic === user.employeeName || d.picEmail === user.email || d.createdBy === user.email).length

  const quickAppItems = [
    {
      id: 'new_doc',
      title: 'Ajukan',
      icon: FilePlus,
      action: () => setCurrentView('tracking', 'new'),
    },
    {
      id: 'tracking',
      title: 'Lacak Alur',
      icon: GitPullRequestDraft,
      badge: reviewBadgeCount > 0 ? `${reviewBadgeCount}` : undefined,
      action: () => setCurrentView('tracking', 'progress'),
    },
    {
      id: 'myDocuments',
      title: 'Dokumen',
      icon: Files,
      badge: myDocsBadgeCount > 0 ? `${myDocsBadgeCount}` : undefined,
      action: () => setCurrentView('myDocuments'),
    },
    {
      id: 'reminders',
      title: 'Jatuh Tempo',
      icon: Clock,
      action: () => setCurrentView('tracking', 'progress'),
    },
    {
      id: 'gdrive',
      title: 'Google Drive',
      icon: FolderOpen,
      action: () => {
        if (typeof window !== 'undefined') {
          window.open('https://drive.google.com/drive/folders/1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F', '_blank')
        }
      },
    },
    ...(!isRequester
      ? [
          {
            id: 'matrix',
            title: 'Matriks SOP',
            icon: ShieldCheck,
            action: () => setCurrentView('matrix'),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'users',
            title: 'Pengguna',
            icon: Users,
            action: () => setCurrentView('users'),
          },
          {
            id: 'settings',
            title: 'Pengaturan',
            icon: Settings,
            action: () => setCurrentView('settings'),
          },
        ]
      : []),
    {
      id: 'profile',
      title: 'Profil Saya',
      icon: UserIcon,
      action: () => setCurrentView('myAccount'),
    },
    {
      id: 'security',
      title: 'Keamanan 2FA',
      icon: KeyRound,
      action: () => setCurrentView('myAccount'),
    },
  ]

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] p-4 sm:p-7 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-3.5">
            {/* RIDE Title & Kepanjangan */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-2xl sm:text-3xl font-display tracking-wider text-white">
                  RIDE
                </span>
                <span className="rounded-md bg-[#60A5FA]/20 px-2 py-0.5 text-[10px] font-bold text-[#93C5FD] tracking-wide uppercase border border-[#60A5FA]/30">
                  Platform
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-white/80 font-medium">
                  {user?.division || 'Direktorat Legal & Governance'}
                </span>
              </div>

              {/* Tulisan RIDE dibawahnya dijelaskan kepanjangannya */}
              <div className="text-xs sm:text-sm font-semibold text-white/90 tracking-tight">
                Request Integrated Document Ecosystem
              </div>
            </div>

            {/* Greeting & Subtext */}
            <div className="pt-1">
              <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-white/95">
                Selamat Datang, {user?.employeeName || 'Pengguna'}
              </h1>
              <p className="text-xs text-white/75 mt-0.5 max-w-xl leading-relaxed">
                Pantau pengajuan berkas, tracking persetujuan, dan jatuh tempo kontrak Anda dalam satu ekosistem terpadu.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setCurrentView('tracking', 'new')}
            className="self-start md:self-auto h-10 sm:h-11 bg-white text-[#163A70] hover:bg-[#EBF2FF] font-bold text-xs shadow-md border-0 shrink-0 cursor-pointer rounded-xl gap-2 px-4.5 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4 text-[#163A70]" />
            <span>Ajukan Dokumen</span>
          </Button>
        </div>
      </div>

      {/* Menu Layanan & Fitur (Khusus Tampilan Mobile — Di Desktop Navigasi Menggunakan Sidebar) */}
      <div className="md:hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#E2E8F0] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#163A70]" />
            <h2 className="text-xs sm:text-sm font-extrabold font-display text-[#0B2147] tracking-tight">
              Menu Layanan &amp; Fitur
            </h2>
          </div>
          <span className="text-[11px] font-bold text-[#64748B]">
            {quickAppItems.length} Menu
          </span>
        </div>

        <div className="grid grid-cols-4 gap-y-4 gap-x-2 sm:gap-x-4">
          {quickAppItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center text-center group cursor-pointer active:scale-90 transition-transform"
              >
                <div className="relative mb-1.5">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#F0F4FA] text-[#163A70] border border-[#D9E2EC] shadow-2xs group-hover:bg-[#163A70] group-hover:text-white group-hover:border-[#163A70] group-hover:shadow-md transition-all">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
                  </div>

                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-black text-white shadow-xs ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] leading-tight text-center break-words w-full px-0.5 group-hover:text-[#163A70] transition-colors">
                  {item.title}
                </span>
              </button>
            )
          })}
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
              className="h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] max-w-xs truncate focus:border-[#163A70] focus:outline-none"
            >
              {documents.map((d) => (
                <option key={d.docNumber} value={d.docNumber}>
                  {d.docNumber} — {d.name}
                </option>
              ))}
            </select>
          </div>

          {activeTrackerDoc && (
            <div className="space-y-6">
              {/* Document Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
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
                  <div className="font-bold text-sm text-[#0F172A] mt-1">{activeTrackerDoc.name}</div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDocNumber(activeTrackerDoc.docNumber)
                    setCurrentView('tracking', 'progress')
                  }}
                  className="h-9 text-xs bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-xl gap-1.5"
                >
                  <History className="h-3.5 w-3.5" />
                  Lihat Riwayat &amp; Versi Lengkap
                </Button>
              </div>

              {/* 7 Stage Visual Pipeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
    </div>
  )
}
