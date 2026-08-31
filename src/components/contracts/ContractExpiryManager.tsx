"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem, ContractReminderConfig } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Clock,
  RefreshCw,
  Ban,
  FileEdit,
  AlertTriangle,
  CheckCircle2,
  Bell,
  BellRing,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  FolderOpen,
  FileText,
  Check,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

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

export function ContractExpiryManager() {
  const {
    user,
    documents,
    submitDecision,
    updateDocumentReminders,
    setSelectedDocNumber,
    setCurrentView,
  } = useApp()

  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'h60' | 'h30' | 'h15' | 'h7' | 'h1' | 'expired'>('all')
  const [search, setSearch] = useState('')

  // State for Decision / Justification Modal
  const [decisionDoc, setDecisionDoc] = useState<DocumentItem | null>(null)
  const [decisionType, setDecisionType] = useState<'renew' | 'terminate' | 'amendment'>('renew')
  const [considerations, setConsiderations] = useState<string[]>([])
  const [justification, setJustification] = useState('')
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)
  const [submittingDecision, setSubmittingDecision] = useState(false)

  // State for Reminder Config Modal
  const [reminderDoc, setReminderDoc] = useState<DocumentItem | null>(null)
  const [reminderConfig, setReminderConfig] = useState<ContractReminderConfig>({
    h60: true,
    h30: true,
    h15: true,
    h7: true,
    h1: true,
    customNotes: '',
  })
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [savingReminder, setSavingReminder] = useState(false)

  const now = new Date()

  // Filter only documents that have contractEnd (Document Contracts)
  const contractDocs = documents.filter((d) => d.contractEnd && !d.noDuration)

  const getDiffDays = (doc: DocumentItem) => {
    if (!doc.contractEnd) return 9999
    const end = new Date(doc.contractEnd)
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getMilestoneTag = (diffDays: number) => {
    if (diffDays < 0) return { label: `Lewat ${Math.abs(diffDays)} Hari`, type: 'expired', color: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' }
    if (diffDays === 0) return { label: 'Jatuh Tempo Hari Ini', type: 'h1', color: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' }
    if (diffDays === 1) return { label: 'H-1 Jatuh Tempo', type: 'h1', color: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' }
    if (diffDays <= 7) return { label: `H-${diffDays} (Mendesak)`, type: 'h7', color: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' }
    if (diffDays <= 15) return { label: `H-${diffDays} (Peringatan)`, type: 'h15', color: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' }
    if (diffDays <= 30) return { label: `H-${diffDays} (Evaluasi)`, type: 'h30', color: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' }
    if (diffDays <= 60) return { label: `H-${diffDays} (Pra-Evaluasi)`, type: 'h60', color: 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]' }
    return { label: `Tersisa ${diffDays} Hari`, type: 'safe', color: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' }
  }

  const filteredContracts = contractDocs
    .filter((doc) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        doc.docNumber.toLowerCase().includes(q) ||
        doc.name.toLowerCase().includes(q) ||
        doc.division.toLowerCase().includes(q) ||
        doc.pic.toLowerCase().includes(q)

      const diff = getDiffDays(doc)
      let matchesMilestone = true
      if (milestoneFilter === 'expired') matchesMilestone = diff < 0
      else if (milestoneFilter === 'h1') matchesMilestone = diff >= 0 && diff <= 1
      else if (milestoneFilter === 'h7') matchesMilestone = diff > 1 && diff <= 7
      else if (milestoneFilter === 'h15') matchesMilestone = diff > 7 && diff <= 15
      else if (milestoneFilter === 'h30') matchesMilestone = diff > 15 && diff <= 30
      else if (milestoneFilter === 'h60') matchesMilestone = diff > 30 && diff <= 60

      return matchesSearch && matchesMilestone
    })
    .sort((a, b) => getDiffDays(a) - getDiffDays(b))

  const handleOpenDecisionModal = (doc: DocumentItem, defType: 'renew' | 'terminate' | 'amendment' = 'renew') => {
    setDecisionDoc(doc)
    setDecisionType(defType)
    setConsiderations(doc.decision?.considerations || [])
    setJustification(doc.decision?.justification || '')
    setIsDecisionOpen(true)
  }

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!decisionDoc) return
    if (!justification.trim()) {
      toast.error('Uraian justifikasi atau pertimbangan wajib diisi.')
      return
    }

    setSubmittingDecision(true)
    const ok = await submitDecision(decisionDoc._id, {
      type: decisionType,
      justification: justification.trim(),
      considerations,
    })
    setSubmittingDecision(false)

    if (ok) {
      const typeLabel =
        decisionType === 'renew'
          ? 'Perpanjangan'
          : decisionType === 'amendment'
          ? 'Adendum Klausul'
          : 'Terminasi'
      toast.success(`Pertimbangan & Justifikasi ${typeLabel} untuk ${decisionDoc.docNumber} berhasil diajukan!`)
      setIsDecisionOpen(false)
    } else {
      toast.error('Gagal menyimpan justifikasi keputusan.')
    }
  }

  const handleOpenReminderModal = (doc: DocumentItem) => {
    setReminderDoc(doc)
    setReminderConfig({
      h60: doc.reminders?.h60 ?? true,
      h30: doc.reminders?.h30 ?? true,
      h15: doc.reminders?.h15 ?? true,
      h7: doc.reminders?.h7 ?? true,
      h1: doc.reminders?.h1 ?? true,
      customNotes: doc.reminders?.customNotes || '',
    })
    setIsReminderModalOpen(true)
  }

  const handleReminderSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderDoc) return
    setSavingReminder(true)
    const ok = await updateDocumentReminders(reminderDoc._id, reminderConfig)
    setSavingReminder(false)
    if (ok) {
      toast.success(`Pengaturan pengingat untuk ${reminderDoc.docNumber} berhasil disimpan!`)
      setIsReminderModalOpen(false)
    } else {
      toast.error('Gagal memperbarui pengaturan pengingat.')
    }
  }

  const toggleConsideration = (item: string) => {
    setConsiderations((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  // Count summaries
  const expiredCount = contractDocs.filter((d) => getDiffDays(d) < 0).length
  const criticalCount = contractDocs.filter((d) => {
    const diff = getDiffDays(d)
    return diff >= 0 && diff <= 7
  }).length
  const warningCount = contractDocs.filter((d) => {
    const diff = getDiffDays(d)
    return diff > 7 && diff <= 30
  }).length
  const upcomingCount = contractDocs.filter((d) => {
    const diff = getDiffDays(d)
    return diff > 30 && diff <= 60
  }).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md mb-2 border border-white/15">
              <Clock className="h-3.5 w-3.5 text-[#60A5FA]" />
              <span>Sistem Pemantauan Masa Berlaku Kontrak</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
              Manajemen Jatuh Tempo &amp; Pengingat Kontrak
            </h1>
            <p className="text-xs text-white/80 mt-1 max-w-2xl">
              Pantau jadwal berakhir kontrak secara berkala pada interval <b>H-60, H-30, H-15, H-7, dan H-1</b>, serta ajukan evaluasi justifikasi perpanjangan, adendum, atau terminasi.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Milestone Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card
          onClick={() => setMilestoneFilter('h7')}
          className={`border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            milestoneFilter === 'h7' ? 'ring-2 ring-[#DC2626] bg-[#FEF2F2]/30' : ''
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#DC2626]">Mendesak (&le; H-7)</div>
              <div className="text-2xl font-extrabold text-[#DC2626] mt-0.5">{criticalCount} Kontrak</div>
              <div className="text-[10.5px] text-[#94A3B8] mt-0.5">Prioritas tindakan segera</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626]">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setMilestoneFilter('h30')}
          className={`border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            milestoneFilter === 'h30' ? 'ring-2 ring-[#D97706] bg-[#FFFBEB]/30' : ''
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#D97706]">Peringatan (H-15 &amp; H-30)</div>
              <div className="text-2xl font-extrabold text-[#D97706] mt-0.5">{warningCount} Kontrak</div>
              <div className="text-[10.5px] text-[#94A3B8] mt-0.5">Waktu evaluasi &amp; justifikasi</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#D97706]">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setMilestoneFilter('h60')}
          className={`border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            milestoneFilter === 'h60' ? 'ring-2 ring-[#2563EB] bg-[#EFF6FF]/30' : ''
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#2563EB]">Pra-Evaluasi (H-60)</div>
              <div className="text-2xl font-extrabold text-[#2563EB] mt-0.5">{upcomingCount} Kontrak</div>
              <div className="text-[10.5px] text-[#94A3B8] mt-0.5">Persiapan review awal</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
              <Bell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setMilestoneFilter('expired')}
          className={`border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer ${
            milestoneFilter === 'expired' ? 'ring-2 ring-[#64748B] bg-[#F1F5F9]' : ''
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B]">Lewat Jatuh Tempo</div>
              <div className="text-2xl font-extrabold text-[#0B2147] mt-0.5">{expiredCount} Kontrak</div>
              <div className="text-[10.5px] text-[#94A3B8] mt-0.5">Menunggu pengesahan tutup</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B]">
              <Ban className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Cari nomor kontrak, nama, divisi, PIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: `Semua Kontrak (${contractDocs.length})` },
              { id: 'h7', label: 'H-7 / H-1 (Mendesak)' },
              { id: 'h15', label: 'H-15' },
              { id: 'h30', label: 'H-30' },
              { id: 'h60', label: 'H-60' },
              { id: 'expired', label: 'Lewat Jatuh Tempo' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setMilestoneFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  milestoneFilter === f.id
                    ? 'bg-[#163A70] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contracts List Cards */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <Card className="border-[#E2E8F0] p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5F9] text-[#94A3B8] mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <div className="text-sm font-bold text-[#0B2147]">Tidak Ada Dokumen Kontrak</div>
            <p className="text-xs text-[#64748B] mt-1">
              Tidak ditemukan kontrak aktif yang sesuai dengan kriteria filter masa berlaku ini.
            </p>
          </Card>
        ) : (
          filteredContracts.map((doc) => {
            const diffDays = getDiffDays(doc)
            const tag = getMilestoneTag(diffDays)
            const start = doc.contractStart ? new Date(doc.contractStart) : null
            const end = new Date(doc.contractEnd!)
            const reminders = doc.reminders || { h60: true, h30: true, h15: true, h7: true, h1: true }

            return (
              <Card key={doc._id} className="border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all">
                <CardContent className="p-5 space-y-4">
                  {/* Top Row: Ticket No, Tag, Category & Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#163A70]">
                          {doc.docNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-[#EBF2FF] text-[#163A70]">
                          {doc.category}
                        </Badge>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${tag.color}`}>
                          {tag.label}
                        </span>
                        {doc.decision && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {doc.decision.type === 'renew'
                              ? 'Rekomendasi: Perpanjang'
                              : doc.decision.type === 'amendment'
                              ? 'Rekomendasi: Adendum'
                              : 'Rekomendasi: Terminasi'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#0F172A]">{doc.name}</h3>

                      <div className="text-[11.5px] text-[#64748B] flex flex-wrap items-center gap-2">
                        <span>Divisi: <b>{doc.division}</b></span>
                        <span>•</span>
                        <span>PIC: <b>{doc.pic}</b></span>
                        <span>•</span>
                        <span>
                          Masa Berlaku:{' '}
                          {start ? start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}{' '}
                          s/d <b>{end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</b>
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReminderModal(doc)}
                        className="h-8 text-xs border-[#CBD5E1] text-[#163A70] hover:bg-[#EBF2FF] font-bold rounded-lg gap-1.5 cursor-pointer"
                        title="Atur Pengingat H-60, H-30, H-15, H-7, H-1"
                      >
                        <BellRing className="h-3.5 w-3.5 text-[#163A70]" />
                        <span>Set Pengingat</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenDecisionModal(doc, 'renew')}
                        className="h-8 text-xs bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg gap-1 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Perpanjang</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDecisionModal(doc, 'amendment')}
                        className="h-8 text-xs border-[#BFDBFE] text-[#2563EB] hover:bg-[#EFF6FF] font-bold rounded-lg gap-1 cursor-pointer"
                      >
                        <FileEdit className="h-3 w-3" />
                        <span>Adendum</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDecisionModal(doc, 'terminate')}
                        className="h-8 text-xs border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] font-bold rounded-lg gap-1 cursor-pointer"
                      >
                        <Ban className="h-3 w-3" />
                        <span>Terminasi</span>
                      </Button>
                    </div>
                  </div>

                  {/* Reminder Milestone Status Matrix Bar */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                      <Bell className="h-4 w-4 text-[#163A70]" />
                      <span className="font-bold text-[#0B2147]">Status Pengingat Otomatis:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { key: 'h60', label: 'H-60', active: reminders.h60, passed: diffDays <= 60 },
                        { key: 'h30', label: 'H-30', active: reminders.h30, passed: diffDays <= 30 },
                        { key: 'h15', label: 'H-15', active: reminders.h15, passed: diffDays <= 15 },
                        { key: 'h7', label: 'H-7', active: reminders.h7, passed: diffDays <= 7 },
                        { key: 'h1', label: 'H-1', active: reminders.h1, passed: diffDays <= 1 },
                      ].map((m) => (
                        <div
                          key={m.key}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1 border ${
                            !m.active
                              ? 'bg-white text-[#94A3B8] border-[#E2E8F0] opacity-50'
                              : m.passed
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                              : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                          }`}
                        >
                          <span>{m.label}</span>
                          <span>{m.active ? (m.passed ? '🔔' : '✓') : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Previous Decision Summary if exists */}
                  {doc.decision && (
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#166534] font-bold">
                        <span>Justifikasi &amp; Rekomendasi Terdaftar ({doc.decision.decidedBy || 'Pemohon'}):</span>
                        <span className="text-[10.5px] text-[#15803D]">
                          {new Date(doc.decision.decidedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-[#166534] italic">&ldquo;{doc.decision.justification}&rdquo;</p>
                      {doc.decision.considerations?.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {doc.decision.considerations.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white text-[#166534] text-[10px] font-semibold border border-[#BBF7D0]">
                              • {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 1. Modal: Ajukan Justifikasi / Pertimbangan Kontrak */}
      <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-[#163A70]" />
              Formulir Justifikasi Kontrak — {decisionDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Ajukan evaluasi dan justifikasi resmi terhadap masa berlaku kontrak <b>{decisionDoc?.name}</b>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold block">Rekomendasi Tindakan Kontrak</Label>
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
              <Label className="text-xs font-semibold block">Faktor Pertimbangan &amp; Evaluasi (Pilih yang relevan)</Label>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
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
              <Label className="text-xs font-semibold block">Uraian Justifikasi Resmi</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Tuliskan alasan, latar belakang kebutuhan, evaluasi performa, atau justifikasi perpanjangan/adendum..."
                rows={3}
                required
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDecisionOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submittingDecision} className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                {submittingDecision ? 'Menyimpan...' : 'Kirim Justifikasi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Atur Pengingat Jatuh Tempo (H-60 s/d H-1) */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <BellRing className="h-5 w-5 text-[#163A70]" />
              Pengaturan Pengingat — {reminderDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Aktifkan interval pemberitahuan email &amp; portal menjelang tanggal jatuh tempo kontrak.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReminderSave} className="space-y-4 pt-2">
            <div className="space-y-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              {[
                { key: 'h60', label: 'Pengingat H-60 (60 Hari Sebelum Jatuh Tempo)', desc: 'Pra-evaluasi dan review berkas awal' },
                { key: 'h30', label: 'Pengingat H-30 (30 Hari Sebelum Jatuh Tempo)', desc: 'Penyusunan telaah & justifikasi kebutuhan' },
                { key: 'h15', label: 'Pengingat H-15 (15 Hari Sebelum Jatuh Tempo)', desc: 'Peringatan proses draf adendum/perpanjangan' },
                { key: 'h7', label: 'Pengingat H-7 (7 Hari Sebelum Jatuh Tempo)', desc: 'Peringatan kritis persetujuan direksi' },
                { key: 'h1', label: 'Pengingat H-1 (1 Hari Sebelum Jatuh Tempo)', desc: 'Peringatan final batas akhir kontrak' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">{item.label}</div>
                    <div className="text-[10.5px] text-[#64748B]">{item.desc}</div>
                  </div>
                  <Switch
                    checked={(reminderConfig as any)[item.key]}
                    onCheckedChange={(val) =>
                      setReminderConfig((prev) => ({ ...prev, [item.key]: val }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold block">Catatan Khusus Pengingat (Opsional)</Label>
              <Input
                value={reminderConfig.customNotes}
                onChange={(e) => setReminderConfig((prev) => ({ ...prev, customNotes: e.target.value }))}
                placeholder="misal: Mohon hubungi legal 2 minggu sebelum jatuh tempo"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsReminderModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={savingReminder} className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                {savingReminder ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
