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
import { RISE_ICON_BASE64 } from '@/lib/assets'

const STAGES = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'review', label: 'Review', icon: Search },
  { key: 'drafting', label: 'Legal Drafting', icon: PenTool },
  { key: 'approval', label: 'Legal Approval', icon: FileCheck2 },
  { key: 'bod', label: 'BOD Approval / Signed', icon: FileSignature },
  { key: 'archived', label: 'Archived', icon: Archive },
  { key: 'renewal', label: 'Expired / Renewal', icon: Clock },
]

const CATEGORY_CHIPS = [
  { name: 'Kontrak Pengadaan Barang', icon: PackageCheck },
  { name: 'Kontrak Pengadaan Jasa', icon: Briefcase },
  { name: 'Perjanjian', icon: FileSignature },
  { name: 'NDA', icon: ShieldAlert },
  { name: 'MoU', icon: Handshake },
  { name: 'Legal Opinion', icon: Scale },
  { name: 'Surat Kuasa Khusus', icon: Award },
  { name: 'Surat Resmi Perusahaan', icon: Building },
]

const CONSIDERATION_OPTIONS = [
  'Good vendor performance',
  'Business need continues',
  'Cost efficiency maintained',
  'No violations / risk',
  'Business need has ended',
  'Budget constraints',
  'Compliance risk identified',
  'Better alternative vendor available',
]

export function DashboardView() {
  const {
    user,
    documents,
    setCurrentView,
    setSelectedDocNumber,
    submitDecision,
  } = useApp()

  // State for Decision Modal
  const [decisionDoc, setDecisionDoc] = useState<DocumentItem | null>(null)
  const [decisionType, setDecisionType] = useState<'renew' | 'terminate'>('renew')
  const [considerations, setConsiderations] = useState<string[]>([])
  const [justification, setJustification] = useState('')
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)

  // Tracking picker
  const [trackerDocNo, setTrackerDocNo] = useState<string>(
    documents[0]?.docNumber || ''
  )

  const activeTrackerDoc =
    documents.find((d) => d.docNumber === trackerDocNo) || documents[0]

  // KPI Calculations
  const totalCount = documents.length
  const underReviewCount = documents.filter((d) => d.stage === 0 || d.stage === 1).length
  const waitingApprovalCount = documents.filter((d) => d.stage === 3 || d.stage === 4).length
  const completedCount = documents.filter((d) => d.stage === 5 || d.stage === 6).length

  // Real Expiry calculation relative to TODAY (Real time)
  const calculateDaysLeft = (endStr: string | null) => {
    if (!endStr) return null
    const diffMs = new Date(endStr).getTime() - new Date().getTime()
    return Math.round(diffMs / (1000 * 60 * 60 * 24))
  }

  const expiringDocs = documents
    .filter((d) => d.contractEnd)
    .map((d) => ({ ...d, daysLeft: calculateDaysLeft(d.contractEnd) }))
    .filter((d) => d.daysLeft !== null && d.daysLeft <= 60)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
    .slice(0, 4)

  const openDecisionModal = (doc: DocumentItem, type: 'renew' | 'terminate') => {
    setDecisionDoc(doc)
    setDecisionType(type)
    setConsiderations([])
    setJustification('')
    setIsDecisionOpen(true)
  }

  const handleDecisionSubmit = async () => {
    if (!decisionDoc || !justification.trim()) {
      toast.error('Mohon isi catatan justifikasi keputusan.')
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
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    )
  }

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#254F8E] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <img
          src={RISE_ICON_BASE64}
          alt=""
          className="pointer-events-none absolute -right-4 -bottom-8 h-48 w-48 opacity-10 select-none object-contain"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                <Calendar className="h-3 w-3" />
                <span>{todayFormatted}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/25 px-2 py-0.5 text-[10px] font-bold text-[#6EE7B7] border border-[#10B981]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Database Local Connected</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
              Selamat Datang, {user?.employeeName || 'Luky'}
            </h1>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Berikut adalah ringkasan perizinan, persetujuan legal, dan pemantauan masa berlaku kontrak korporat Anda.
            </p>
          </div>

          <Button
            onClick={() => setCurrentView('tracking', 'new')}
            className="self-start sm:self-auto h-11 bg-white text-[#163A70] hover:bg-[#EBF2FF] font-bold text-xs shadow-md border-0 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1 text-[#163A70]" />
            <span>Pengajuan Baru</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] relative overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EBF2FF] to-[#DBEAFE] text-[#163A70] shadow-xs">
                <Inbox className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#059669]">
                Live Count
              </span>
            </div>
            <div className="text-xs font-semibold text-[#64748B]">Total Dokumen</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2147] mt-0.5">
              {totalCount}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Seluruh arsip dokumen aktif</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] relative overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] text-[#D97706] shadow-xs">
                <Search className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold text-[#D97706]">
                Review SLA
              </span>
            </div>
            <div className="text-xs font-semibold text-[#64748B]">Sedang Ditinjau</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2147] mt-0.5">
              {underReviewCount}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Tahap Review &amp; Drafting</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] relative overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] text-[#4F46E5] shadow-xs">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5]">
                Persetujuan
              </span>
            </div>
            <div className="text-xs font-semibold text-[#64748B]">Menunggu Persetujuan</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2147] mt-0.5">
              {waitingApprovalCount}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Legal Manager &amp; Direksi</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all hover:translate-y-[-2px] border-[#E2E8F0] relative overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-[#059669] shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#059669]">
                Tereksekusi
              </span>
            </div>
            <div className="text-xs font-semibold text-[#64748B]">Selesai / Diarsipkan</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2147] mt-0.5">
              {completedCount}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Telah disahkan &amp; diarsipkan</div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Expiry & Renewal Reminder Card */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-[#0B2147]">
                  Pengingat Jatuh Tempo &amp; Perpanjangan Kontrak
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Dokumen kontrak yang mendekati tanggal berakhir (&le; 60 hari dari hari ini).
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('tracking', 'progress')}
              className="self-start sm:self-auto text-xs h-9 font-semibold text-[#163A70]"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {expiringDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
              <span>Tidak ada kontrak yang mendekati masa jatuh tempo saat ini.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringDocs.map((doc) => {
                const days = doc.daysLeft ?? 0
                const isExpired = days < 0

                let barColor = 'border-l-[#10B981]'
                let badgeClass = 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                if (isExpired || days <= 15) {
                  barColor = 'border-l-[#EF4444]'
                  badgeClass = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                } else if (days <= 30) {
                  barColor = 'border-l-[#F59E0B]'
                  badgeClass = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                }

                const badgeLabel = isExpired ? `Expired ${Math.abs(days)} hari lalu` : `H-${days} hari`;

                return (
                  <div
                    key={doc._id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-[#E2E8F0] border-l-4 ${barColor} bg-white p-3.5 hover:shadow-xs transition-all`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[#0F172A] truncate">
                        {doc.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B] mt-1">
                        <span className="font-semibold text-[#163A70]">{doc.docNumber}</span>
                        <span>•</span>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>
                          Berakhir:{' '}
                          {doc.contractEnd
                            ? new Date(doc.contractEnd).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                        {doc.decision && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              doc.decision.type === 'renew'
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            }`}
                          >
                            {doc.decision.type === 'renew' ? (
                              <>
                                <RefreshCw className="h-2.5 w-2.5" />
                                <span>Perpanjangan diajukan</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-2.5 w-2.5" />
                                <span>Terminasi diajukan</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      {doc.decision ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocNumber(doc.docNumber)
                            setCurrentView('tracking', 'progress')
                          }}
                          className="h-8 text-xs font-semibold"
                        >
                          Detail
                        </Button>
                      ) : (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => openDecisionModal(doc, 'renew')}
                            className="h-8 text-xs font-bold bg-[#163A70] hover:bg-[#0B2147]"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Perpanjang
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDecisionModal(doc, 'terminate')}
                            className="h-8 text-xs font-bold"
                          >
                            <Ban className="h-3 w-3 mr-1" /> Terminasi
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Request Quick Categories */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-display text-[#0B2147]">
                Kategori Layanan Dokumen
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pilih jenis kontrak atau perizinan untuk memulai pengajuan legal baru.
              </p>
            </div>
            <Button
              onClick={() => setCurrentView('tracking', 'new')}
              className="text-xs h-9 font-bold bg-[#163A70] hover:bg-[#0B2147]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Form Pengajuan
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORY_CHIPS.map((cat) => {
              const IconComp = cat.icon
              return (
                <button
                  key={cat.name}
                  onClick={() => setCurrentView('tracking', 'new')}
                  className="group flex flex-col items-start p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#EBF2FF]/60 hover:border-[#163A70]/40 transition-all hover:shadow-xs text-left cursor-pointer"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#163A70] group-hover:bg-[#163A70] group-hover:text-white transition-colors mb-2.5">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#163A70] line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] mt-1">Template terverifikasi</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Tracking Pipeline */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold font-display text-[#0B2147]">
                Status Alur Persetujuan Dokumen
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pemantauan langsung 7 tahapan legal drafting dan penandatanganan resmi.
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

          {activeTrackerDoc ? (
            <div className="overflow-x-auto pb-4 pt-2">
              <div className="min-w-[760px] flex items-center justify-between relative px-6">
                {STAGES.map((s, idx) => {
                  const isDone = idx < activeTrackerDoc.stage
                  const isCurrent = idx === activeTrackerDoc.stage
                  const isRejected = activeTrackerDoc.rejected && isCurrent

                  let circleStyle = 'border-2 border-[#E2E8F0] bg-white text-[#94A3B8]'
                  if (isDone) circleStyle = 'bg-[#10B981] border-[#10B981] text-white shadow-xs'
                  else if (isRejected) circleStyle = 'bg-[#EF4444] border-[#EF4444] text-white shadow-xs'
                  else if (isCurrent) circleStyle = 'bg-[#163A70] border-[#163A70] text-white animate-pulse-stage shadow-md'

                  return (
                    <div
                      key={s.key}
                      onClick={() => {
                        setSelectedDocNumber(activeTrackerDoc.docNumber)
                        setCurrentView('tracking', 'progress')
                      }}
                      className="flex flex-col items-center relative flex-1 cursor-pointer group"
                    >
                      {idx < STAGES.length - 1 && (
                        <div
                          className={`absolute top-5 left-[50%] w-full h-[3px] z-0 transition-colors ${
                            idx < activeTrackerDoc.stage ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 group-hover:scale-110 ${circleStyle}`}
                      >
                        {isDone ? (
                          <Check className="h-5 w-5 stroke-[2.5]" />
                        ) : isRejected ? (
                          <X className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <s.icon className="h-4 w-4" />
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-[#0F172A] mt-2.5 text-center max-w-[90px] leading-tight">
                        {s.label}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] mt-1 font-medium">
                        {idx <= activeTrackerDoc.stage
                          ? new Date(activeTrackerDoc.updatedAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B]">
              Belum ada dokumen untuk ditampilkan.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Decision Modal Dialog */}
      <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">Keputusan Perpanjangan Kontrak</DialogTitle>
            <DialogDescription>
              {decisionDoc?.docNumber} — {decisionDoc?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecisionType('renew')}
                className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  decisionType === 'renew'
                    ? 'border-[#163A70] bg-[#EBF2FF] shadow-xs'
                    : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8]'
                }`}
              >
                <RefreshCw className="h-5 w-5 text-[#163A70] mb-1.5" />
                <span className="font-bold text-xs text-[#0F172A]">Ajukan Perpanjangan</span>
                <span className="text-[10px] text-[#64748B] mt-0.5">Lanjutkan ke kontrak adendum / baru</span>
              </button>

              <button
                type="button"
                onClick={() => setDecisionType('terminate')}
                className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  decisionType === 'terminate'
                    ? 'border-[#EF4444] bg-[#FEF2F2] shadow-xs'
                    : 'border-[#E2E8F0] bg-white hover:border-[#EF4444]/60'
                }`}
              >
                <Ban className="h-5 w-5 text-[#EF4444] mb-1.5" />
                <span className="font-bold text-xs text-[#0F172A]">Ajukan Terminasi</span>
                <span className="text-[10px] text-[#64748B] mt-0.5">Kontrak diselesaikan &amp; ditutup</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#64748B] block mb-2">
                Pertimbangan (Pilih poin yang relevan):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONSIDERATION_OPTIONS.map((item) => {
                  const isSelected = considerations.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleConsideration(item)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#163A70] bg-[#163A70] text-white shadow-2xs'
                          : 'border-[#CBD5E1] bg-white text-[#475569] hover:border-[#163A70]'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748B]">
                Justifikasi &amp; Catatan Legal
              </label>
              <Textarea
                rows={3}
                placeholder="Tuliskan latar belakang dan pertimbangan bisnis keputusan ini..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsDecisionOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleDecisionSubmit} className="bg-[#163A70] font-bold">
              Kirim Keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
