"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Check,
  X,
  FileText,
  Clock,
  RefreshCw,
  Ban,
  Trash2,
  Calendar,
  AlertCircle,
  FileCheck,
  Building,
  Layers,
  Send,
  ArrowRight,
  RotateCcw,
  Search,
  PenTool,
  FileCheck2,
  FileSignature,
  Archive,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const STAGES = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'review', label: 'Review', icon: Search },
  { key: 'drafting', label: 'Legal Drafting', icon: PenTool },
  { key: 'approval', label: 'Legal Approval', icon: FileCheck2 },
  { key: 'bod', label: 'BOD Approval / Signed', icon: FileSignature },
  { key: 'archived', label: 'Archived', icon: Archive },
  { key: 'renewal', label: 'Expired / Renewal', icon: Clock },
]

const REMINDER_MILESTONES = [60, 45, 30, 15, 7, 0]

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

interface UploadedFileInfo {
  originalName: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

export function TrackingView() {
  const {
    user,
    documents,
    trackSubTab,
    setTrackSubTab,
    selectedDocNumber,
    setSelectedDocNumber,
    createDocument,
    submitDecision,
    transitionDocument,
    setCurrentView,
  } = useApp()

  // New Request Form State
  const [reqDivision, setRegDivision] = useState('Direktorat Umum')
  const [reqCategory, setReqCategory] = useState('Perjanjian')
  const [reqPriority, setReqPriority] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal')
  const [reqConf, setReqConf] = useState<'Internal' | 'Confidential' | 'Restricted'>('Internal')
  const [reqName, setReqName] = useState('')
  const [reqNoDuration, setReqNoDuration] = useState(false)
  const [reqStart, setReqStart] = useState('')
  const [reqEnd, setReqEnd] = useState('')
  const [reqNotes, setReqNotes] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track Progress State
  const activeDoc: DocumentItem | undefined =
    documents.find((d) => d.docNumber === selectedDocNumber) || documents[0]

  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Decision Modal
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)
  const [decisionType, setDecisionType] = useState<'renew' | 'terminate'>('renew')
  const [considerations, setConsiderations] = useState<string[]>([])
  const [justification, setJustification] = useState('')

  // Workflow Action Modal (for revision notes or rejection reason)
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<'advance' | 'approve' | 'revision' | 'reject' | 'resolve_revision'>('advance')
  const [workflowNotes, setWorkflowNotes] = useState('')

  // File Upload Handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)

    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('files', file))

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.files) {
        setUploadedFiles((prev) => [...prev, ...data.files])
        toast.success(`${data.files.length} berkas berhasil diunggah.`)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengunggah berkas.')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim()) {
      toast.error('Mohon isi nama dokumen pengajuan.')
      return
    }

    if (!reqNoDuration && reqStart && reqEnd && reqEnd < reqStart) {
      toast.error('Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.')
      return
    }

    setIsSubmitting(true)
    const newDoc = await createDocument({
      name: reqName,
      category: reqCategory,
      division: reqDivision,
      priority: reqPriority,
      confidentiality: reqConf,
      contractStart: reqNoDuration ? null : reqStart || null,
      contractEnd: reqNoDuration ? null : reqEnd || null,
      noDuration: reqNoDuration,
      notes: reqNotes,
      files: uploadedFiles,
    })
    setIsSubmitting(false)

    if (newDoc) {
      toast.success(`Pengajuan ${newDoc.docNumber} berhasil dibuat dan disimpan di MongoDB!`)
      setSelectedDocNumber(newDoc.docNumber)
      setTrackSubTab('progress')
    }
  }

  // Real Expiry Days relative to TODAY
  const daysLeft = activeDoc?.contractEnd
    ? Math.round(
        (new Date(activeDoc.contractEnd).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const getSLA = (doc: DocumentItem, idx: number) => {
    if (doc.revisionRequested && idx === doc.stage) {
      return '5 hari kerja (revisi pemohon)'
    }
    return `${3 + idx} hari kerja`
  }

  const getFileIconColor = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'text-[#EF4444] bg-[#FEF2F2]'
    if (ext === 'doc' || ext === 'docx') return 'text-[#2563EB] bg-[#EFF6FF]'
    if (ext === 'xls' || ext === 'xlsx') return 'text-[#10B981] bg-[#ECFDF5]'
    return 'text-[#8B5CF6] bg-[#F5F3FF]'
  }

  // Execute Workflow Action
  const handleExecuteWorkflow = async () => {
    if (!activeDoc) return
    setActionLoading(true)
    const res = await transitionDocument(activeDoc._id, workflowAction, workflowNotes)
    setActionLoading(false)

    if (res.success) {
      toast.success(res.message || 'Tahapan alur berhasil diperbarui!')
      setIsWorkflowModalOpen(false)
      setWorkflowNotes('')
    } else {
      toast.error(res.error || 'Gagal memperbarui tahapan dokumen.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">Document Tracking</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Pengajuan berkas legal baru serta pemantauan dan persetujuan tahapan dokumen di MongoDB.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-4">
        {user?.role !== 'Director / BOD' && (
          <button
            onClick={() => setTrackSubTab('new')}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              trackSubTab === 'new'
                ? 'border-[#163A70] text-[#163A70]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>＋ Formulir Pengajuan Baru</span>
          </button>
        )}
        <button
          onClick={() => setTrackSubTab('progress')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            trackSubTab === 'progress'
              ? 'border-[#163A70] text-[#163A70]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <span>📊 Lacak Progres Approval</span>
          <span className="rounded-full bg-[#EBF2FF] px-2 py-0.5 text-[10px] font-bold text-[#163A70]">
            Live MongoDB
          </span>
        </button>
      </div>

      {/* TAB 1: NEW REQUEST FORM */}
      {trackSubTab === 'new' && (
        <Card className="max-w-3xl border-[#E2E8F0] shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#F1F5F9]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2FF] text-[#163A70]">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-[#0B2147]">
                  Formulir Pengajuan Dokumen Legal
                </h2>
                <p className="text-xs text-[#64748B]">
                  Lengkapi informasi perizinan atau kontrak di bawah ini.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] font-display flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" /> Klasifikasi &amp; Divisi
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Divisi Pemohon</Label>
                    <select
                      value={reqDivision}
                      onChange={(e) => setRegDivision(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 text-xs text-[#0F172A] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                    >
                      <option>Direktorat Umum</option>
                      <option>Direktorat Keuangan</option>
                      <option>Direktorat Operasi</option>
                      <option>Human Capital</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Kategori Dokumen</Label>
                    <select
                      value={reqCategory}
                      onChange={(e) => setReqCategory(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 text-xs text-[#0F172A] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                    >
                      <option>Kontrak Pengadaan Barang</option>
                      <option>Kontrak Pengadaan Jasa</option>
                      <option>Perjanjian</option>
                      <option>NDA</option>
                      <option>MoU</option>
                      <option>Legal Opinion</option>
                      <option>Surat Kuasa Khusus</option>
                      <option>Surat Resmi Perusahaan</option>
                      <option>Kontrak Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label>Tingkat Prioritas</Label>
                    <select
                      value={reqPriority}
                      onChange={(e) => setReqPriority(e.target.value as 'Normal' | 'Urgent' | 'Critical')}
                      className="flex h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 text-xs text-[#0F172A] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                    >
                      <option>Normal</option>
                      <option>Urgent</option>
                      <option>Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Tingkat Kerahasiaan</Label>
                    <select
                      value={reqConf}
                      onChange={(e) => setReqConf(e.target.value as 'Internal' | 'Confidential' | 'Restricted')}
                      className="flex h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 text-xs text-[#0F172A] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                    >
                      <option>Internal</option>
                      <option>Confidential</option>
                      <option>Restricted</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] font-display flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Detail Kontrak &amp; Durasi
                </span>

                <div className="space-y-1.5">
                  <Label>Nama Dokumen / Judul Kontrak</Label>
                  <Input
                    placeholder="e.g. Perjanjian Sewa Alat Berat - PT Sumber Makmur"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    required
                    className="h-11 text-xs rounded-xl"
                  />
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-4 bg-[#F8FAFC]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#163A70]" />
                      <Label className="font-bold text-xs">Masa Berlaku Perjanjian</Label>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={reqNoDuration}
                        onChange={(e) => setReqNoDuration(e.target.checked)}
                        className="rounded text-[#163A70] h-4 w-4"
                      />
                      <span>Tanpa tanggal berakhir tetap</span>
                    </label>
                  </div>

                  {!reqNoDuration && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#64748B]">Tanggal Mulai Efektif</Label>
                        <Input
                          type="date"
                          value={reqStart}
                          onChange={(e) => setReqStart(e.target.value)}
                          className="h-10 text-xs rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-[#64748B]">Tanggal Berakhir Kontrak</Label>
                        <Input
                          type="date"
                          value={reqEnd}
                          onChange={(e) => setReqEnd(e.target.value)}
                          className="h-10 text-xs rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Catatan Tambahan / Ringkasan Kebutuhan</Label>
                  <Textarea
                    rows={3}
                    placeholder="Jelaskan kebutuhan pengadaan, vendor pelaksana, atau urgensi legal..."
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8] font-display flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Berkas Pendukung Kontrak
                </span>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileUpload(e.dataTransfer.files)
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-7 text-center hover:border-[#163A70] hover:bg-[#EBF2FF]/50 transition-all cursor-pointer group"
                  onClick={() => document.getElementById('reqFileInput')?.click()}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-[#163A70] group-hover:scale-105 transition-transform mb-2.5">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {isUploading ? 'Sedang mengunggah berkas...' : 'Drag & drop berkas di sini, atau klik untuk memilih'}
                  </span>
                  <span className="text-[11px] text-[#64748B] mt-1">
                    Mendukung PDF, DOCX, XLSX, JPG, PNG (Maksimal 10MB per file)
                  </span>
                  <input
                    id="reqFileInput"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getFileIconColor(file.originalName)} shrink-0`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-[#0F172A] block truncate">
                              {file.originalName}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {(file.size / 1024).toFixed(0)} KB · Terlampir
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-[#EF4444] hover:bg-[#FEF2F2] p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentView('dashboard')}
                  className="rounded-xl h-11 px-5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl h-11 px-6 font-bold bg-[#163A70] hover:bg-[#0B2147] shadow-md shadow-[#163A70]/20"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {isSubmitting ? 'Memproses...' : 'Kirim Pengajuan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TRACK PROGRESS */}
      {trackSubTab === 'progress' && (
        <div className="space-y-6">
          {/* Document Picker & Timeline */}
          <Card className="border-[#E2E8F0] shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
                <div>
                  <h2 className="text-base font-bold font-display text-[#0B2147]">
                    Alur Tahapan Legal &amp; Approval
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Pilih dokumen yang ingin diproses atau dipantau alurnya.
                  </p>
                </div>

                <select
                  value={selectedDocNumber || ''}
                  onChange={(e) => {
                    setSelectedDocNumber(e.target.value)
                    setSelectedStageIndex(null)
                    setSelectedMilestone(null)
                  }}
                  className="h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-xs font-bold text-[#0F172A] max-w-sm truncate focus:border-[#163A70]"
                >
                  {documents.map((d) => (
                    <option key={d.docNumber} value={d.docNumber}>
                      {d.docNumber} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeDoc ? (
                <>
                  <div className="overflow-x-auto pb-6 pt-2">
                    <div className="min-w-[760px] flex items-center justify-between relative px-6">
                      {STAGES.map((s, idx) => {
                        const isDone = idx < activeDoc.stage
                        const isCurrent = idx === activeDoc.stage
                        const isRejected = activeDoc.rejected && isCurrent

                        let circleStyle = 'border-2 border-[#E2E8F0] bg-white text-[#94A3B8]'
                        if (isDone) circleStyle = 'bg-[#10B981] border-[#10B981] text-white shadow-xs'
                        else if (isRejected) circleStyle = 'bg-[#EF4444] border-[#EF4444] text-white shadow-xs'
                        else if (isCurrent) circleStyle = 'bg-[#163A70] border-[#163A70] text-white animate-pulse-stage shadow-md'

                        return (
                          <div
                            key={s.key}
                            onClick={() => setSelectedStageIndex(idx)}
                            className="flex flex-col items-center relative flex-1 cursor-pointer group"
                          >
                            {idx < STAGES.length - 1 && (
                              <div
                                className={`absolute top-5 left-[50%] w-full h-[3px] z-0 transition-colors ${
                                  idx < activeDoc.stage ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
                                }`}
                              />
                            )}

                            <div
                              className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold shadow-xs transition-all duration-200 group-hover:scale-110 ${circleStyle}`}
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
                            <span className="text-[10px] text-[#64748B] mt-1">
                              {idx <= activeDoc.stage
                                ? new Date(activeDoc.updatedAt).toLocaleDateString('id-ID', {
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

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-6 pt-4 text-[11px] text-[#64748B] border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#CBD5E1]" />
                      <span>Menunggu (Waiting)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#163A70]" />
                      <span>Sedang Berjalan (Active)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                      <span>Selesai (Completed)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                      <span>Ditolak / Revisi</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  Tidak ada dokumen yang dipilih.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stage Details & Real Action Execution Card */}
          {activeDoc && (
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold font-display text-[#0B2147]">
                      Inspeksi Tahapan &amp; Eksekusi Alur Kerja
                    </h2>
                    <span className="text-[11px] text-[#64748B]">
                      Aksi di bawah ini langsung mengeksekusi perubahan status dan tahapan dokumen ke MongoDB.
                    </span>
                  </div>

                  {/* Real Action Buttons for Active Stage */}
                  <div className="flex flex-wrap items-center gap-2">
                    {activeDoc.stage < 5 && !activeDoc.rejected && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setWorkflowAction('advance')
                            setWorkflowNotes('')
                            setIsWorkflowModalOpen(true)
                          }}
                          className="h-9 text-xs font-bold bg-[#163A70] hover:bg-[#0B2147]"
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-1" />
                          {activeDoc.stage === 4 ? 'Tandatangani & Sahkan' : 'Maju ke Tahap Berikutnya'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setWorkflowAction('revision')
                            setWorkflowNotes('')
                            setIsWorkflowModalOpen(true)
                          }}
                          className="h-9 text-xs font-bold text-[#D97706] border-[#FDE68A] hover:bg-[#FFFBEB]"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Minta Revisi
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setWorkflowAction('reject')
                            setWorkflowNotes('')
                            setIsWorkflowModalOpen(true)
                          }}
                          className="h-9 text-xs font-bold"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Tolak
                        </Button>
                      </>
                    )}

                    {activeDoc.revisionRequested && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setWorkflowAction('resolve_revision')
                          setWorkflowNotes('')
                          setIsWorkflowModalOpen(true)
                        }}
                        className="h-9 text-xs font-bold bg-[#10B981] hover:bg-[#059669]"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Selesaikan Revisi
                      </Button>
                    )}
                  </div>
                </div>

                {(() => {
                  const currentIdx = selectedStageIndex ?? activeDoc.stage
                  const stageObj = STAGES[currentIdx]
                  const isCurrent = currentIdx === activeDoc.stage

                  let statusBadge = (
                    <Badge variant="outline" className="text-xs inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-[#94A3B8]" />
                      <span>Menunggu Giliran</span>
                    </Badge>
                  )
                  if (currentIdx < activeDoc.stage) {
                    statusBadge = (
                      <Badge variant="success" className="text-xs inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Selesai Diverifikasi</span>
                      </Badge>
                    )
                  } else if (isCurrent) {
                    if (activeDoc.rejected) {
                      statusBadge = (
                        <Badge variant="destructive" className="text-xs inline-flex items-center gap-1.5">
                          <XCircle className="h-3 w-3" />
                          <span>Ditolak / Tidak Disetujui</span>
                        </Badge>
                      )
                    } else if (activeDoc.revisionRequested) {
                      statusBadge = (
                        <Badge variant="warning" className="text-xs inline-flex items-center gap-1.5">
                          <RotateCcw className="h-3 w-3" />
                          <span>Perlu Revisi Pemohon</span>
                        </Badge>
                      )
                    } else {
                      statusBadge = (
                        <Badge variant="default" className="text-xs bg-[#163A70] inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3 animate-pulse" />
                          <span>Sedang Diproses PIC</span>
                        </Badge>
                      )
                    }
                  }

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
                      <div>
                        <span className="text-[#64748B] block font-medium">Nomor Dokumen</span>
                        <span className="font-bold text-[#163A70] text-sm">
                          {activeDoc.docNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Nama Dokumen</span>
                        <span className="font-bold text-[#0F172A] truncate block">
                          {activeDoc.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Tahap Terpilih</span>
                        <span className="font-bold text-[#0B2147]">
                          {stageObj?.label}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">PIC Penanggung Jawab</span>
                        <span className="font-bold text-[#0F172A]">{activeDoc.pic}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Target SLA Pengerjaan</span>
                        <span className="font-bold text-[#0B2147]">
                          {getSLA(activeDoc, currentIdx)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Status Tahapan</span>
                        <div className="mt-1">{statusBadge}</div>
                      </div>
                    </div>
                  )
                })()}

                {/* Audit History Log */}
                {activeDoc.history && activeDoc.history.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                    <span className="text-xs font-bold text-[#0B2147] block mb-2">
                      Riwayat Audit Persetujuan (Real-Time Database Log):
                    </span>
                    <div className="space-y-2">
                      {activeDoc.history.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-[#64748B] bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                          <span className="h-2 w-2 rounded-full bg-[#163A70] mt-1 shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold text-[#0F172A]">{h.action}</span>
                            <span className="text-[11px] text-[#94A3B8] ml-2">
                              oleh {h.actor} · {new Date(h.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {h.notes && <p className="text-[11px] text-[#334155] mt-0.5 font-medium">&quot;{h.notes}&quot;</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract Expiry Timeline */}
          {activeDoc && (
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-bold font-display text-[#0B2147]">
                      Jadwal Pengingat Masa Berlaku (Expiry Reminder)
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Pengingat otomatis dihitung dari hari ini ({new Date().toLocaleDateString('id-ID')}) menuju tanggal berakhir.
                    </p>
                  </div>

                  {daysLeft !== null && (
                    <div
                      className={`rounded-2xl p-4 text-center min-w-[150px] font-bold shadow-xs border ${
                        daysLeft < 0 || daysLeft <= 15
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : daysLeft <= 30
                          ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                          : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      }`}
                    >
                      <span className="text-2xl font-extrabold block">
                        {daysLeft < 0 ? 'Expired' : `${daysLeft} Hari`}
                      </span>
                      <span className="text-[10px] font-semibold opacity-90">
                        {daysLeft < 0 ? `Telah lewat ${Math.abs(daysLeft)} hari` : 'Menuju jatuh tempo'}
                      </span>
                    </div>
                  )}
                </div>

                {daysLeft !== null ? (
                  <div className="overflow-x-auto py-3">
                    <div className="min-w-[640px] flex items-center justify-between relative px-6">
                      {REMINDER_MILESTONES.map((days, idx) => {
                        const isExpiredStage = days === 0
                        const isSent = daysLeft <= days
                        const isSelected = selectedMilestone === days

                        let circleColor = 'border-[#E2E8F0] bg-white text-[#94A3B8]'
                        if (isExpiredStage && isSent) {
                          circleColor = 'bg-[#EF4444] border-[#EF4444] text-white shadow-xs'
                        } else if (isSent) {
                          circleColor = 'bg-[#F59E0B] border-[#F59E0B] text-white shadow-xs'
                        }

                        return (
                          <div
                            key={days}
                            onClick={() => setSelectedMilestone(days)}
                            className={`flex flex-1 flex-col items-center relative cursor-pointer group transition-transform ${
                              isSelected ? 'scale-110' : ''
                            }`}
                          >
                            {idx < REMINDER_MILESTONES.length - 1 && (
                              <div
                                className={`absolute top-4 left-[50%] w-full h-[2.5px] z-0 ${
                                  daysLeft <= days ? 'bg-[#F59E0B]' : 'bg-[#E2E8F0]'
                                }`}
                              />
                            )}

                            <div
                              className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border-2 shadow-2xs transition-all ${circleColor}`}
                            >
                              {isExpiredStage ? <AlertTriangle className="h-4 w-4" /> : isSent ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Clock className="h-4 w-4" />}
                            </div>

                            <span className="text-[11px] font-bold text-[#0F172A] mt-2">
                              {days === 0 ? 'Expired' : `H-${days}`}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {isSent ? 'Terkirim' : 'Terjadwal'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
                    Tidak ada tanggal jatuh tempo spesifik yang ditentukan untuk dokumen ini.
                  </div>
                )}

                {/* Decision Panel */}
                <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
                  {activeDoc.decision ? (
                    <div className="rounded-xl border border-[#E2E8F0] p-4 bg-[#F8FAFC] space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={activeDoc.decision.type === 'renew' ? 'success' : 'destructive'}
                          className="text-xs font-bold px-3 py-1"
                        >
                          {activeDoc.decision.type === 'renew' ? (
                            <span className="inline-flex items-center gap-1.5">
                              <RefreshCw className="h-3 w-3" />
                              <span>Permohonan Perpanjangan Diajukan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <Ban className="h-3 w-3" />
                              <span>Permohonan Terminasi Diajukan</span>
                            </span>
                          )}
                        </Badge>
                        <span className="text-[11px] text-[#64748B]">
                          Diputuskan pada{' '}
                          {new Date(activeDoc.decision.decidedAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#0F172A]">
                        <b>Catatan Justifikasi:</b> {activeDoc.decision.justification}
                      </p>
                      {activeDoc.decision.considerations?.length > 0 && (
                        <p className="text-xs text-[#64748B]">
                          <b>Poin Pertimbangan:</b> {activeDoc.decision.considerations.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : daysLeft !== null && daysLeft <= 30 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
                      <div>
                        <span className="text-xs font-bold text-[#92400E] block">
                          Kontrak Dalam Jendela Keputusan (&le; 30 Hari)
                        </span>
                        <span className="text-[11px] text-[#B45309]">
                          Tentukan keputusan untuk memperpanjang kerja sama atau mengakhiri kontrak.
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => {
                            setDecisionType('renew')
                            setConsiderations([])
                            setJustification('')
                            setIsDecisionOpen(true)
                          }}
                          className="text-xs font-bold bg-[#163A70] hover:bg-[#0B2147] h-9"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Perpanjang
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDecisionType('terminate')
                            setConsiderations([])
                            setJustification('')
                            setIsDecisionOpen(true)
                          }}
                          className="text-xs font-bold h-9"
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" /> Terminasi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#64748B] flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-[#94A3B8]" />
                      <span>Tombol keputusan perpanjangan/terminasi akan aktif otomatis saat kontrak memasuki H-30 hari sebelum berakhir.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Action Modal (Advance/Approve/Revision/Reject) */}
          <Dialog open={isWorkflowModalOpen} onOpenChange={setIsWorkflowModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#0B2147]">
                  {workflowAction === 'advance'
                    ? 'Lanjutkan ke Tahap Berikutnya'
                    : workflowAction === 'approve'
                    ? 'Persetujuan Dokumen Legal'
                    : workflowAction === 'revision'
                    ? 'Ajukan Permintaan Revisi'
                    : workflowAction === 'resolve_revision'
                    ? 'Selesaikan Revisi Dokumen'
                    : 'Tolak Pengajuan Dokumen'}
                </DialogTitle>
                <DialogDescription>
                  {activeDoc?.docNumber} — {activeDoc?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-1">
                <Label>Catatan / Alasan Verifikasi:</Label>
                <Textarea
                  rows={3}
                  placeholder="Tuliskan catatan verifikasi hukum, instruksi revisi, atau alasan persetujuan..."
                  value={workflowNotes}
                  onChange={(e) => setWorkflowNotes(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setIsWorkflowModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleExecuteWorkflow}
                  disabled={actionLoading}
                  className={`font-bold ${
                    workflowAction === 'reject'
                      ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                      : workflowAction === 'revision'
                      ? 'bg-[#D97706] hover:bg-[#B45309]'
                      : 'bg-[#163A70] hover:bg-[#0B2147]'
                  }`}
                >
                  {actionLoading ? 'Memproses...' : 'Konfirmasi & Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Decision Modal */}
          <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#0B2147]">Keputusan Perpanjangan Kontrak</DialogTitle>
                <DialogDescription>
                  {activeDoc?.docNumber} — {activeDoc?.name}
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
                    Pertimbangan Keputusan (Pilih yang sesuai):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONSIDERATION_OPTIONS.map((item) => {
                      const isSelected = considerations.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setConsiderations((prev) =>
                              prev.includes(item)
                                ? prev.filter((c) => c !== item)
                                : [...prev, item]
                            )
                          }}
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
                <Button
                  onClick={async () => {
                    if (!activeDoc || !justification.trim()) {
                      toast.error('Mohon isi catatan justifikasi.')
                      return
                    }
                    const ok = await submitDecision(activeDoc._id, {
                      type: decisionType,
                      justification,
                      considerations,
                    })
                    if (ok) {
                      toast.success('Keputusan berhasil disimpan ke MongoDB!')
                      setIsDecisionOpen(false)
                    }
                  }}
                  className="bg-[#163A70] font-bold"
                >
                  Kirim Keputusan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
