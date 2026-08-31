"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem, DocumentFile, DocumentVersionItem } from '@/context/AppContext'
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
  BarChart3,
  Plus,
  History,
  Download,
  FileUp,
  ShieldCheck,
  Lock,
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
  { key: 'submitted', label: 'Pengajuan Baru', icon: Send },
  { key: 'review', label: 'Review Kelayakan', icon: Search },
  { key: 'drafting', label: 'Penyusunan Draf', icon: PenTool },
  { key: 'approval', label: 'Persetujuan Legal', icon: FileCheck2 },
  { key: 'bod', label: 'Persetujuan Direksi', icon: FileSignature },
  { key: 'archived', label: 'Selesai & Arsip', icon: Archive },
  { key: 'renewal', label: 'Jatuh Tempo', icon: Clock },
]

export function TrackingView() {
  const {
    user,
    documents,
    trackSubTab,
    setTrackSubTab,
    selectedDocNumber,
    setSelectedDocNumber,
    createDocument,
    transitionDocument,
    uploadRevision,
    uploadFinalDocument,
  } = useApp()

  // New Request Form State
  const [reqName, setReqName] = useState('')
  const [reqCategory, setReqCategory] = useState('Perjanjian')
  const [reqDivision, setReqDivision] = useState(user?.division || 'Direktorat Umum')
  const [reqPriority, setReqPriority] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal')
  const [reqConfidentiality, setReqConfidentiality] = useState<'Internal' | 'Confidential' | 'Restricted'>('Internal')
  const [reqStart, setReqStart] = useState('')
  const [reqEnd, setReqEnd] = useState('')
  const [reqNoDuration, setReqNoDuration] = useState(false)
  const [reqNotes, setReqNotes] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<DocumentFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Upload Revision Modal State
  const [isRevModalOpen, setIsRevModalOpen] = useState(false)
  const [revFile, setRevFile] = useState<DocumentFile | null>(null)
  const [revNotes, setRevNotes] = useState('')
  const [revLoading, setRevLoading] = useState(false)

  // Upload Final Document Modal State
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false)
  const [finalFile, setFinalFile] = useState<DocumentFile | null>(null)
  const [finalNotes, setFinalNotes] = useState('')
  const [finalLoading, setFinalLoading] = useState(false)

  // Request Revision Prompt Modal State
  const [isRequestRevOpen, setIsRequestRevOpen] = useState(false)
  const [requestRevReason, setRequestRevReason] = useState('')

  // Active Doc Selection
  const activeDoc: DocumentItem | undefined =
    documents.find((d) => d.docNumber === selectedDocNumber) || documents[0]

  // File Upload Handlers (Simulation to real structured metadata)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const newFiles: DocumentFile[] = Array.from(fileList).map((f) => ({
      originalName: f.name,
      filename: f.name.toLowerCase().replace(/\s+/g, '_'),
      size: f.size,
      mimeType: f.type || 'application/pdf',
      url: `/files/${f.name}`,
      uploadedAt: new Date().toISOString(),
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
    toast.success(`${newFiles.length} berkas berhasil ditambahkan ke formulir pengajuan.`)
  }

  const handleRevFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRevFile({
      originalName: file.name,
      filename: file.name.toLowerCase().replace(/\s+/g, '_'),
      size: file.size,
      mimeType: file.type || 'application/pdf',
      url: `/files/${file.name}`,
      uploadedAt: new Date().toISOString(),
    })
  }

  const handleFinalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFinalFile({
      originalName: file.name,
      filename: file.name.toLowerCase().replace(/\s+/g, '_'),
      size: file.size,
      mimeType: file.type || 'application/pdf',
      url: `/files/${file.name}`,
      uploadedAt: new Date().toISOString(),
    })
  }

  // Create Request Submit
  const handleNewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim()) {
      toast.error('Nama dokumen / kontrak wajib diisi.')
      return
    }

    setIsSubmitting(true)
    const newDoc = await createDocument({
      name: reqName,
      category: reqCategory,
      division: reqDivision,
      priority: reqPriority,
      confidentiality: reqConfidentiality,
      contractStart: reqNoDuration ? null : reqStart || null,
      contractEnd: reqNoDuration ? null : reqEnd || null,
      noDuration: reqNoDuration,
      notes: reqNotes,
      files: uploadedFiles,
    })
    setIsSubmitting(false)

    if (newDoc) {
      toast.success(`Pengajuan ${newDoc.docNumber} berhasil dibuat!`)
      setSelectedDocNumber(newDoc.docNumber)
      setTrackSubTab('progress')
      // Reset
      setReqName('')
      setReqNotes('')
      setUploadedFiles([])
    }
  }

  // Submit Revision
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDoc || !revFile) {
      toast.error('File revisi wajib diunggah.')
      return
    }
    if (!revNotes.trim()) {
      toast.error('Catatan revisi wajib diisi.')
      return
    }

    setRevLoading(true)
    const ok = await uploadRevision(activeDoc._id, revFile, revNotes)
    setRevLoading(false)

    if (ok) {
      toast.success('Draf revisi berhasil diunggah dan diverifikasi!')
      setIsRevModalOpen(false)
      setRevFile(null)
      setRevNotes('')
    }
  }

  // Submit Final Document
  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDoc || !finalFile) {
      toast.error('File dokumen final wajib diunggah.')
      return
    }

    setFinalLoading(true)
    const ok = await uploadFinalDocument(activeDoc._id, finalFile, finalNotes)
    setFinalLoading(false)

    if (ok) {
      toast.success('Dokumen final resmi berhasil diterbitkan dan diarsipkan!')
      setIsFinalModalOpen(false)
      setFinalFile(null)
      setFinalNotes('')
    }
  }

  // Submit Request Revision Action
  const handleRequestRevisionSubmit = async () => {
    if (!activeDoc) return
    if (!requestRevReason.trim()) {
      toast.error('Alasan permintaan revisi wajib diisi.')
      return
    }

    const ok = await transitionDocument(activeDoc._id, 'revision', requestRevReason)
    if (ok) {
      toast.success('Permintaan revisi berhasil dikirim ke pengaju.')
      setIsRequestRevOpen(false)
      setRequestRevReason('')
    }
  }

  // Permissions check
  const isDocumentController = user?.role === 'Document Controller' || user?.role === 'Administrator'
  const isApprover = user?.role === 'Approver' || user?.role === 'Director / BOD' || user?.role === 'Administrator'
  const isReviewer = user?.role === 'Reviewer' || user?.role === 'Legal Manager' || user?.role === 'Legal Officer' || user?.role === 'Administrator'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">
          Lacak &amp; Ajukan Dokumen (Tracking &amp; History)
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Pemesanan berkas baru, inspeksi riwayat revisi bertahap (V0, Rev.01, Rev.02), dan pengesahan Dokumen Final.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-4">
        <button
          onClick={() => setTrackSubTab('new')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            trackSubTab === 'new'
              ? 'border-[#163A70] text-[#163A70]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Formulir Pengajuan Baru</span>
        </button>

        <button
          onClick={() => setTrackSubTab('progress')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            trackSubTab === 'progress'
              ? 'border-[#163A70] text-[#163A70]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Lacak &amp; Riwayat Revisi</span>
          <span className="rounded-full bg-[#EBF2FF] px-2 py-0.5 text-[10px] font-bold text-[#163A70]">
            {documents.length} Dokumen
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
                  Formulir Pengajuan Dokumen
                </h2>
                <p className="text-xs text-[#64748B]">
                  Lengkapi data pemesanan atau pengajuan draf awal dokumen (V0).
                </p>
              </div>
            </div>

            <form onSubmit={handleNewRequestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nama Dokumen / Kontrak / Perizinan</Label>
                <Input
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="misal: Perjanjian Kerja Sama Distribusi Mineral Kuartal I"
                  required
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kategori Dokumen</Label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                  >
                    <option value="Perjanjian">Perjanjian / Kontrak</option>
                    <option value="Perizinan">Perizinan / Regulasi</option>
                    <option value="Adendum">Adendum / Perubahan Kontrak</option>
                    <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                    <option value="MoU">Memorandum of Understanding (MoU)</option>
                    <option value="Legal Opinion">Legal Opinion</option>
                    <option value="Surat Kuasa">Surat Kuasa Khusus</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Divisi Pemohon</Label>
                  <Input
                    value={reqDivision}
                    onChange={(e) => setReqDivision(e.target.value)}
                    required
                    className="h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tingkat Prioritas</Label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as 'Normal' | 'Urgent' | 'Critical')}
                    className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                  >
                    <option value="Normal">Normal (SLA Standar 5 Hari)</option>
                    <option value="Urgent">Urgent (SLA 2 Hari)</option>
                    <option value="Critical">Critical (SLA 24 Jam)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Klasifikasi Kerahasiaan</Label>
                  <select
                    value={reqConfidentiality}
                    onChange={(e) => setReqConfidentiality(e.target.value as 'Internal' | 'Confidential' | 'Restricted')}
                    className="w-full h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                  >
                    <option value="Internal">Internal (Hanya Staf Grup)</option>
                    <option value="Confidential">Confidential (Rahasia Perusahaan)</option>
                    <option value="Restricted">Restricted (Akses Terbatas Direksi)</option>
                  </select>
                </div>
              </div>

              {/* Duration Dates */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A]">Masa Berlaku Kontrak</span>
                  <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reqNoDuration}
                      onChange={(e) => setReqNoDuration(e.target.checked)}
                      className="rounded text-[#163A70]"
                    />
                    <span>Berlaku Selamanya (Tanpa Batas Waktu)</span>
                  </label>
                </div>

                {!reqNoDuration && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#64748B]">Tanggal Mulai Berlaku</Label>
                      <Input
                        type="date"
                        value={reqStart}
                        onChange={(e) => setReqStart(e.target.value)}
                        className="h-10 text-xs rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#64748B]">Tanggal Jatuh Tempo / Berakhir</Label>
                      <Input
                        type="date"
                        value={reqEnd}
                        onChange={(e) => setReqEnd(e.target.value)}
                        className="h-10 text-xs rounded-xl bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Catatan Pengajuan &amp; Latar Belakang</Label>
                <Textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Jelaskan kebutuhan pengajuan, tujuan kontrak, atau catatan penting untuk tim reviewer..."
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Upload Initial Files (V0) */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold">Unggah Draf Awal (V0) &amp; Berkas Pendukung</Label>
                <div className="rounded-xl border-2 border-dashed border-[#CBD5E1] p-6 text-center hover:border-[#163A70] transition-colors bg-[#F8FAFC]">
                  <Upload className="mx-auto h-8 w-8 text-[#94A3B8] mb-2" />
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Klik atau seret file PDF / Word ke area ini
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    File pertama akan dicatat sebagai Draf Awal (V0)
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="mt-3 block w-full text-xs text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#163A70] file:text-white hover:file:bg-[#0B2147] cursor-pointer"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-xs font-bold text-[#0F172A] block">Berkas Terpilih:</span>
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-[#163A70] shrink-0" />
                          <span className="font-semibold text-[#0F172A] truncate">{f.originalName}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {i === 0 ? 'Draf Awal (V0)' : 'Lampiran Pendukung'}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[#DC2626] hover:bg-[#FEF2F2] p-1 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#F1F5F9]">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-8 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Dokumen'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PROGRESS & DOCUMENT HISTORY */}
      {trackSubTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Document Selector & Overview */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                  <span className="text-xs font-bold text-[#0B2147]">Daftar Pengajuan</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {documents.length} Dokumen
                  </Badge>
                </div>

                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {documents.map((doc) => {
                    const isSelected = doc.docNumber === activeDoc?.docNumber
                    const activeVersion = doc.versions?.length > 0
                      ? doc.versions[doc.versions.length - 1].version
                      : 'V0'

                    return (
                      <div
                        key={doc._id}
                        onClick={() => setSelectedDocNumber(doc.docNumber)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EBF2FF] border-[#163A70] shadow-xs'
                            : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-bold text-[#163A70]">
                            {doc.docNumber}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-[#4F46E5] border border-[#C7D2FE]">
                            {activeVersion}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-[#0F172A] line-clamp-1">
                          {doc.name}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1.5">
                          <span>{doc.category}</span>
                          <span className={doc.revisionRequested ? 'text-[#D97706] font-bold' : ''}>
                            {doc.revisionRequested ? 'Perlu Revisi' : doc.statusLabel || STAGES[doc.stage]?.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Detailed Document Package, Versions & History */}
          {activeDoc && (
            <div className="lg:col-span-8 space-y-6">
              {/* Document Header & Quick Actions */}
              <Card className="border-[#E2E8F0] shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-[#163A70]">
                          {activeDoc.docNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-[#EBF2FF] text-[#163A70]">
                          {activeDoc.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            activeDoc.priority === 'Critical'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                              : activeDoc.priority === 'Urgent'
                              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {activeDoc.priority}
                        </Badge>
                      </div>

                      <h2 className="text-lg font-bold font-display text-[#0B2147]">
                        {activeDoc.name}
                      </h2>
                      <div className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Divisi: <b>{activeDoc.division}</b></span>
                        <span>•</span>
                        <span>PIC: <b>{activeDoc.pic}</b></span>
                        <span>•</span>
                        <span>Kerahasiaan: <b>{activeDoc.confidentiality}</b></span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Upload Revision Button */}
                      <Button
                        size="sm"
                        onClick={() => setIsRevModalOpen(true)}
                        className="h-9 text-xs bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileUp className="h-3.5 w-3.5" />
                        Unggah Revisi
                      </Button>

                      {/* Upload Final Document Button (Doc Controller / Approver / Admin) */}
                      {isDocumentController && (
                        <Button
                          size="sm"
                          onClick={() => setIsFinalModalOpen(true)}
                          className="h-9 text-xs bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Unggah Dokumen Final
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 7 Stage Visual Pipeline */}
                  <div className="pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {STAGES.map((st, idx) => {
                        const Icon = st.icon
                        const isPast = activeDoc.stage > idx
                        const isCurrent = activeDoc.stage === idx
                        const isRevision = isCurrent && activeDoc.revisionRequested

                        return (
                          <div
                            key={st.key}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isRevision
                                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                                : isCurrent
                                ? 'bg-[#163A70] border-[#163A70] text-white shadow-xs'
                                : isPast
                                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg mx-auto mb-1 bg-white/20">
                              {isPast ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Icon className="h-3.5 w-3.5" />}
                            </div>
                            <div className="text-[9.5px] font-bold uppercase tracking-wider">
                              T{idx + 1}
                            </div>
                            <div className="text-[10.5px] font-semibold mt-0.5 leading-tight truncate">
                              {st.label}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Workflow Operational Controls */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#475569]">
                      Status Saat Ini: <b className="text-[#0B2147]">{activeDoc.statusLabel || STAGES[activeDoc.stage]?.label}</b>
                    </div>

                    <div className="flex items-center gap-2">
                      {isReviewer && !activeDoc.revisionRequested && activeDoc.stage < 4 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsRequestRevOpen(true)}
                          className="h-8 text-xs text-[#D97706] border-[#FDE68A] hover:bg-[#FFFBEB] font-bold rounded-lg cursor-pointer"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Minta Revisi
                        </Button>
                      )}

                      {activeDoc.revisionRequested && (
                        <Button
                          size="sm"
                          onClick={() => transitionDocument(activeDoc._id, 'resolve_revision', 'Revisi telah diverifikasi')}
                          className="h-8 text-xs bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Verifikasi Revisi Selesai
                        </Button>
                      )}

                      {isReviewer && !activeDoc.revisionRequested && activeDoc.stage < 5 && (
                        <Button
                          size="sm"
                          onClick={() => transitionDocument(activeDoc._id, 'approve', 'Disetujui untuk lanjut ke tahap berikutnya')}
                          className="h-8 text-xs bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-lg cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Setujui &amp; Lanjut Tahap
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* STRUCTURED DOCUMENT PACKAGE & VERSIONS (Area 5 & 6) */}
              <Card className="border-[#E2E8F0] shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-[#163A70]" />
                      <div>
                        <h3 className="text-sm font-bold text-[#0B2147]">
                          Paket Rangkaian Berkas &amp; Pelacakan Versi (Version Tracking)
                        </h3>
                        <p className="text-[11px] text-[#64748B]">
                          Seluruh dokumen awal, riwayat revisi, berkas pendukung, dan dokumen final dalam satu tiket pengajuan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Versions List */}
                  <div className="space-y-3">
                    {activeDoc.versions && activeDoc.versions.length > 0 ? (
                      activeDoc.versions.map((ver, idx) => {
                        const isFinalVer = ver.version === 'FINAL' || ver.isFinal
                        const isInitialVer = ver.version === 'V0'

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isFinalVer
                                ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                                : isInitialVer
                                ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                                : 'bg-[#FFFBEB]/60 border-[#FDE68A]'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-mono text-xs font-extrabold ${
                                    isFinalVer
                                      ? 'bg-[#059669] text-white'
                                      : isInitialVer
                                      ? 'bg-[#163A70] text-white'
                                      : 'bg-[#D97706] text-white'
                                  }`}
                                >
                                  {ver.version}
                                </span>
                                <span className="font-bold text-xs text-[#0F172A] truncate">
                                  {ver.file.originalName}
                                </span>
                              </div>

                              {ver.notes && (
                                <div className="text-[11px] text-[#475569] bg-white/70 p-2 rounded-lg border border-black/5">
                                  <b>Catatan Perubahan:</b> {ver.notes}
                                </div>
                              )}

                              <div className="text-[10px] text-[#64748B]">
                                Diunggah oleh: <b>{ver.uploadedBy}</b> •{' '}
                                {new Date(ver.uploadedAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={ver.file.url}
                                download={ver.file.originalName}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-white text-[#163A70] border border-[#CBD5E1] hover:bg-[#F1F5F9] shadow-2xs cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Unduh {ver.version}
                              </a>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4 text-xs text-[#64748B]">
                        Belum ada riwayat versi pada dokumen ini.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* DOCUMENT HISTORY & AUDIT TRAIL (Area 1) */}
              <Card className="border-[#E2E8F0] shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
                    <History className="h-5 w-5 text-[#163A70]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#0B2147]">
                        Riwayat Perkembangan Dokumen (Document History &amp; Traceability)
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        Log audit lengkap setiap aksi, pergantian status, catatan koreksi, dan pengesahan dokumen.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          <th className="py-3 px-4">Waktu</th>
                          <th className="py-3 px-4">Aksi / Perkembangan</th>
                          <th className="py-3 px-4">Aktor / Pelaksana</th>
                          <th className="py-3 px-4">Versi</th>
                          <th className="py-3 px-4">Catatan Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white">
                        {activeDoc.history && activeDoc.history.length > 0 ? (
                          activeDoc.history.map((hist, idx) => (
                            <tr key={idx} className="hover:bg-[#F8FAFC]">
                              <td className="py-3 px-4 text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                                {new Date(hist.timestamp).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#0F172A]">
                                {hist.action}
                              </td>
                              <td className="py-3 px-4 text-[#475569]">
                                {hist.actor}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#163A70]">
                                  {hist.versionTag || 'V0'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#64748B] max-w-xs">
                                {hist.notes || '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-xs text-[#64748B]">
                              Belum ada entri riwayat audit.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Upload Revision Modal */}
      <Dialog open={isRevModalOpen} onOpenChange={setIsRevModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <FileUp className="h-5 w-5 text-[#D97706]" />
              Unggah Revisi Dokumen — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Unggah berkas draf perbaikan baru beserta catatan poin koreksi yang telah disesuaikan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRevision} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Berkas Revisi (PDF / DOCX)</Label>
              <input
                type="file"
                required
                onChange={handleRevFileUpload}
                className="block w-full text-xs text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#163A70] file:text-white hover:file:bg-[#0B2147] cursor-pointer"
              />
              {revFile && (
                <div className="text-[11px] text-[#059669] font-semibold mt-1">
                  Berkas dipilih: {revFile.originalName}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catatan Revisi &amp; Poin Perubahan</Label>
              <Textarea
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
                placeholder="misal: Penyesuaian klausul denda keterlambatan Pasal 12 dan durasi sewa..."
                rows={3}
                required
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRevModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={revLoading}
                className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold"
              >
                {revLoading ? 'Mengunggah...' : 'Simpan & Terbitkan Revisi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Final Document Modal */}
      <Dialog open={isFinalModalOpen} onOpenChange={setIsFinalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#059669]" />
              Unggah Dokumen Final (FINAL) — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Unggah berkas final bertanda tangan resmi dan kunci versi final untuk pengarsipan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFinal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pilih Berkas Dokumen Final Sah (PDF)</Label>
              <input
                type="file"
                required
                onChange={handleFinalFileUpload}
                className="block w-full text-xs text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#059669] file:text-white hover:file:bg-[#047857] cursor-pointer"
              />
              {finalFile && (
                <div className="text-[11px] text-[#059669] font-semibold mt-1">
                  Berkas final: {finalFile.originalName}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catatan Pengesahan Dokumen Final</Label>
              <Textarea
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="misal: Dokumen telah ditandatangani lengkap oleh Direktur Utama dan sah berlaku..."
                rows={3}
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFinalModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={finalLoading}
                className="bg-[#059669] hover:bg-[#047857] text-white font-bold"
              >
                {finalLoading ? 'Menerbitkan...' : 'Terbitkan Dokumen Final'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Revision Prompt Modal */}
      <Dialog open={isRequestRevOpen} onOpenChange={setIsRequestRevOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#D97706]" />
              Permintaan Revisi Dokumen — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Tuliskan alasan perbaikan draf dokumen yang harus diselesaikan oleh pengaju/reviewer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Textarea
              value={requestRevReason}
              onChange={(e) => setRequestRevReason(e.target.value)}
              placeholder="Jelaskan pasal atau bagian mana yang membutuhkan perbaikan..."
              rows={4}
              required
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsRequestRevOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleRequestRevisionSubmit}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold"
            >
              Kirim Permintaan Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
