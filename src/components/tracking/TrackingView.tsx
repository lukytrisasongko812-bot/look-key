"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem, DocumentFile, DocumentVersionItem } from '@/context/AppContext'
import { normalizeRole, isLegalManagement, isBoardOfDirectors, isLegalOfficer, isSystemAdmin } from '@/lib/roles'
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
  FolderOpen,
  Lock,
  Bell,
  BellRing,
  FileEdit,
  ExternalLink,
  Paperclip,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ContractReminderConfig } from '@/context/AppContext'

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
    submitDecision,
    updateDocumentReminders,
    fetchDocuments,
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

  // New Request Separate File States (Draf Utama & Dokumen Pendukung)
  const [mainDraftFile, setMainDraftFile] = useState<DocumentFile | null>(null)
  const [supportingFilesList, setSupportingFilesList] = useState<DocumentFile[]>([])

  // Active Doc Selection
  const activeDoc: DocumentItem | undefined =
    documents.find((d) => d.docNumber === selectedDocNumber) || documents[0]

  // Helper: Read File as Base64 Data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Upload Handlers for New Submission
  const handleMainDraftUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error(`Berkas "${file.name}" melebihi batas ukuran maksimal 20 MB.`)
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const docFile: DocumentFile = {
        originalName: file.name,
        filename: file.name.toLowerCase().replace(/\s+/g, '_'),
        size: file.size,
        mimeType: file.type || 'application/pdf',
        url: dataUrl,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      }
      setMainDraftFile(docFile)
      toast.success(`Draf dokumen utama "${file.name}" siap diajukan.`)
    } catch (err) {
      toast.error('Gagal membaca berkas draf utama.')
    }
  }

  const handleSupportingFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const newDocs: DocumentFile[] = []
    for (const file of Array.from(fileList)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Berkas "${file.name}" melebihi batas maksimal 20 MB.`)
        continue
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        newDocs.push({
          originalName: file.name,
          filename: file.name.toLowerCase().replace(/\s+/g, '_'),
          size: file.size,
          mimeType: file.type || 'application/pdf',
          url: dataUrl,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Error reading supporting file:', file.name, err)
      }
    }

    setSupportingFilesList((prev) => [...prev, ...newDocs])
    toast.success(`${newDocs.length} dokumen pendukung berhasil ditambahkan.`)
  }

  // Combined fallback uploader
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const newFiles: DocumentFile[] = []
    for (const f of Array.from(fileList)) {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`Berkas "${f.name}" melebihi batas maksimal 20 MB.`)
        continue
      }
      try {
        const dataUrl = await readFileAsDataUrl(f)
        newFiles.push({
          originalName: f.name,
          filename: f.name.toLowerCase().replace(/\s+/g, '_'),
          size: f.size,
          mimeType: f.type || 'application/pdf',
          url: dataUrl,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Error reading file:', f.name, err)
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles])
    toast.success(`${newFiles.length} berkas berhasil ditambahkan ke formulir pengajuan.`)
  }

  const handleRevFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error(`Berkas revisi melebihi batas maksimal 20 MB.`)
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setRevFile({
        originalName: file.name,
        filename: file.name.toLowerCase().replace(/\s+/g, '_'),
        size: file.size,
        mimeType: file.type || 'application/pdf',
        url: dataUrl,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      })
    } catch (err) {
      toast.error('Gagal membaca berkas revisi.')
    }
  }

  const handleFinalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error(`Berkas dokumen final melebihi batas maksimal 20 MB.`)
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setFinalFile({
        originalName: file.name,
        filename: file.name.toLowerCase().replace(/\s+/g, '_'),
        size: file.size,
        mimeType: file.type || 'application/pdf',
        url: dataUrl,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      })
    } catch (err) {
      toast.error('Gagal membaca berkas final.')
    }
  }

  // Reliable file download & view handlers (Anti-404)
  const handleDownloadFile = (doc: DocumentItem, file: DocumentFile) => {
    const fileName = file.originalName || file.filename || 'dokumen'
    if (file.dataUrl && file.dataUrl.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = file.dataUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }
    const downloadUrl = `/api/documents/${doc.docNumber || doc._id}/download?name=${encodeURIComponent(fileName)}`
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleViewFile = (doc: DocumentItem, file: DocumentFile) => {
    if (file.driveViewUrl && file.driveViewUrl.startsWith('https://')) {
      window.open(file.driveViewUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (file.dataUrl && file.dataUrl.startsWith('data:')) {
      window.open(file.dataUrl, '_blank')
      return
    }
    const fileName = file.originalName || file.filename || 'dokumen'
    window.open(`/api/documents/${doc.docNumber || doc._id}/view?name=${encodeURIComponent(fileName)}`, '_blank')
  }

  // Create Request Submit
  const handleNewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim()) {
      toast.error('Nama dokumen / kontrak wajib diisi.')
      return
    }

    const effectiveInitial = mainDraftFile || (uploadedFiles.length > 0 ? uploadedFiles[0] : null)
    const effectiveSupporting = [
      ...supportingFilesList,
      ...(uploadedFiles.length > 1 ? uploadedFiles.slice(1) : []),
    ]
    const allFiles = [
      ...(effectiveInitial ? [effectiveInitial] : []),
      ...effectiveSupporting,
    ]

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
      initialDocument: effectiveInitial,
      supportingDocuments: effectiveSupporting,
      files: allFiles,
    } as any)
    setIsSubmitting(false)

    if (newDoc) {
      toast.success(`Pengajuan ${newDoc.docNumber} berhasil dibuat dan disinkronkan ke Google Drive!`)
      setSelectedDocNumber(newDoc.docNumber)
      setTrackSubTab('progress')
      // Reset
      setReqName('')
      setReqNotes('')
      setUploadedFiles([])
      setMainDraftFile(null)
      setSupportingFilesList([])
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

  // Reject Document Action (Non-Requester: Reviewer, Approver, Admin, etc.)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDoc) return
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan dokumen wajib diisi.')
      return
    }

    setRejectLoading(true)
    const ok = await transitionDocument(activeDoc._id, 'reject', rejectReason.trim())
    setRejectLoading(false)

    if (ok) {
      toast.error(`Pengajuan ${activeDoc.docNumber} telah ditolak.`)
      setIsRejectModalOpen(false)
      setRejectReason('')
    }
  }

  // Google Drive synchronization handler
  const [syncingDrive, setSyncingDrive] = useState(false)
  const handleSyncGoogleDrive = async (id: string) => {
    setSyncingDrive(true)
    try {
      const res = await fetch(`/api/documents/${id}/sync-drive`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Folder Google Drive dan log teks berhasil disinkronkan!')
        await fetchDocuments()
      } else {
        toast.error(data.error || 'Gagal sinkronisasi Google Drive')
      }
    } catch {
      toast.error('Gagal terhubung ke Google Drive')
    } finally {
      setSyncingDrive(false)
    }
  }

  // Contract Expiry & Reminders & Decision States
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)
  const [decisionType, setDecisionType] = useState<'renew' | 'terminate' | 'amendment'>('renew')
  const [considerations, setConsiderations] = useState<string[]>([])
  const [justification, setJustification] = useState('')
  const [submittingDecision, setSubmittingDecision] = useState(false)

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [reminderConfig, setReminderConfig] = useState<ContractReminderConfig>({
    h60: true,
    h30: true,
    h15: true,
    h7: true,
    h1: true,
    customNotes: '',
  })
  const [savingReminder, setSavingReminder] = useState(false)

  const now = new Date()

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

  const handleOpenDecisionModal = (doc: DocumentItem, defType: 'renew' | 'terminate' | 'amendment' = 'renew') => {
    setDecisionType(defType)
    setConsiderations(doc.decision?.considerations || [])
    setJustification(doc.decision?.justification || '')
    setIsDecisionOpen(true)
  }

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDoc) return
    if (!justification.trim()) {
      toast.error('Uraian justifikasi atau pertimbangan wajib diisi.')
      return
    }

    setSubmittingDecision(true)
    const ok = await submitDecision(activeDoc._id, {
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
      toast.success(`Pertimbangan & Justifikasi ${typeLabel} untuk ${activeDoc.docNumber} berhasil diajukan!`)
      setIsDecisionOpen(false)
    } else {
      toast.error('Gagal menyimpan justifikasi keputusan.')
    }
  }

  const handleOpenReminderModal = (doc: DocumentItem) => {
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
    if (!activeDoc) return
    setSavingReminder(true)
    const ok = await updateDocumentReminders(activeDoc._id, reminderConfig)
    setSavingReminder(false)
    if (ok) {
      toast.success(`Pengaturan pengingat untuk ${activeDoc.docNumber} berhasil disimpan!`)
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

  // Permissions check
  const isDocumentController = isLegalManagement(user?.role) || isSystemAdmin(user?.role)
  const isApprover = isBoardOfDirectors(user?.role) || isSystemAdmin(user?.role)
  const isReviewer = isLegalOfficer(user?.role) || isLegalManagement(user?.role) || isSystemAdmin(user?.role)

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-[#0B2147] tracking-tight">
          Lacak &amp; Ajukan Dokumen
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Pemesanan berkas baru, inspeksi riwayat revisi bertahap (V0, Rev.01, Rev.02), dan alur 7 tahap legal.
        </p>
      </div>

      {/* Segmented Sub-Tabs Navigasi Rapi */}
      <div className="flex bg-[#F1F5F9] p-1 rounded-2xl gap-1 max-w-sm sm:max-w-md">
        <button
          onClick={() => setTrackSubTab('new')}
          className={`flex-1 py-1.5 sm:py-2 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5 ${
            trackSubTab === 'new'
              ? 'bg-white text-[#163A70] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Pengajuan Baru</span>
        </button>

        <button
          onClick={() => setTrackSubTab('progress')}
          className={`flex-1 py-1.5 sm:py-2 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5 ${
            trackSubTab === 'progress'
              ? 'bg-white text-[#163A70] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Lacak &amp; Riwayat</span>
          <span className="rounded-full bg-[#EBF2FF] px-1.5 py-0.2 text-[9.5px] font-bold text-[#163A70]">
            {documents.length}
          </span>
        </button>
      </div>

      {/* TAB 1: NEW REQUEST FORM */}
      {trackSubTab === 'new' && (
        <Card className="max-w-3xl border-[#E2E8F0] shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-[#F1F5F9]">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#EBF2FF] text-[#163A70] shrink-0">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-display text-[#0B2147]">
                  Formulir Pengajuan Dokumen
                </h2>
                <p className="text-[11px] sm:text-xs text-[#64748B]">
                  Lengkapi data pemesanan atau pengajuan draf awal dokumen (V0).
                </p>
              </div>
            </div>

            <form onSubmit={handleNewRequestSubmit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Judul / Perihal Dokumen <span className="text-[#DC2626]">*</span></Label>
                <Input
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Contoh: Perjanjian Sewa Alat Berat Pertambangan Pomalaa"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Kategori Dokumen</Label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
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

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tingkat Prioritas</Label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as 'Normal' | 'Urgent' | 'Critical')}
                    className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                  >
                    <option value="Normal">Normal (SLA Standar 3 Hari)</option>
                    <option value="Urgent">Mendesak / Urgent (SLA 24 Jam)</option>
                    <option value="Critical">Kritis / Critical (SLA Segera Hari Ini)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Divisi Pemrakarsa</Label>
                  <Input
                    value={reqDivision}
                    onChange={(e) => setReqDivision(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    placeholder="Contoh: Direktorat Operasi"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tingkat Kerahasiaan</Label>
                  <select
                    value={reqConfidentiality}
                    onChange={(e) => setReqConfidentiality(e.target.value as 'Internal' | 'Confidential' | 'Restricted')}
                    className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                  >
                    <option value="Internal">Internal (Hanya Staf Grup)</option>
                    <option value="Confidential">Confidential (Rahasia Perusahaan)</option>
                    <option value="Restricted">Restricted (Akses Terbatas Direksi)</option>
                  </select>
                </div>
              </div>

              {/* Duration Dates */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A]">Masa Berlaku Kontrak</span>
                  <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reqNoDuration}
                      onChange={(e) => setReqNoDuration(e.target.checked)}
                      className="rounded text-[#163A70]"
                    />
                    <span>Tanpa Batas Waktu</span>
                  </label>
                </div>

                {!reqNoDuration && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#64748B]">Tanggal Mulai</Label>
                      <Input
                        type="date"
                        value={reqStart}
                        onChange={(e) => setReqStart(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#64748B]">Tanggal Jatuh Tempo</Label>
                      <Input
                        type="date"
                        value={reqEnd}
                        onChange={(e) => setReqEnd(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Catatan Pengajuan</Label>
                <Textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Jelaskan kebutuhan pengajuan atau catatan untuk reviewer..."
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Upload Main Draft File (V0) */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold text-[#0B2147] flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#163A70]" />
                  Draf Dokumen Utama (V0) <span className="text-[#DC2626]">*</span>
                </Label>
                <div className="rounded-2xl border-2 border-dashed border-[#CBD5E1] p-3.5 text-center hover:border-[#163A70] transition-colors bg-[#F8FAFC]">
                  <Upload className="mx-auto h-5 w-5 text-[#94A3B8] mb-1" />
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Pilih Berkas Draf Utama (PDF / Word DOCX)
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleMainDraftUpload}
                    className="mt-2 block w-full text-xs text-[#64748B] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#163A70] file:text-white hover:file:bg-[#0B2147] cursor-pointer"
                  />
                </div>

                {mainDraftFile && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="h-4 w-4 text-[#059669] shrink-0" />
                      <span className="font-bold text-[#065F46] truncate">{mainDraftFile.originalName}</span>
                      <Badge className="text-[9px] bg-[#059669] text-white">
                        Draf Utama (V0) • {(mainDraftFile.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMainDraftFile(null)}
                      className="text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Supporting Documents (Lampiran Pengajuan) */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#0B2147] flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-[#059669]" />
                    Dokumen Pendukung / Lampiran Pengajuan (Opsional)
                  </Label>
                  <span className="text-[11px] text-[#64748B]">PDF, DOCX, XLSX, JPG, PNG (Maks 20MB)</span>
                </div>
                <div className="rounded-2xl border-2 border-dashed border-[#CBD5E1] p-3.5 text-center hover:border-[#059669] transition-colors bg-[#F8FAFC]">
                  <Upload className="mx-auto h-5 w-5 text-[#94A3B8] mb-1" />
                  <div className="text-xs font-semibold text-[#0F172A]">
                    Pilih satu atau beberapa berkas pendukung (KTP, NPWP, Memo, Spesifikasi, Penawaran)
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleSupportingFilesUpload}
                    className="mt-2 block w-full text-xs text-[#64748B] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#059669] file:text-white hover:file:bg-[#047857] cursor-pointer"
                  />
                </div>

                {supportingFilesList.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {supportingFilesList.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl border border-[#E2E8F0] bg-white text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="h-3.5 w-3.5 text-[#059669] shrink-0" />
                          <span className="font-semibold text-[#0F172A] truncate">{f.originalName}</span>
                          <Badge variant="outline" className="text-[9.5px] font-mono text-[#059669] border-[#A7F3D0]">
                            Lampiran • {(f.size / 1024).toFixed(1)} KB
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSupportingFilesList((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[#DC2626] hover:bg-[#FEF2F2] p-1 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#F1F5F9]">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
          {/* Left Column: Document Selector & Overview */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 sm:p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="text-xs font-bold text-[#0B2147]">Daftar Pengajuan</span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#163A70]">
                  {documents.length} Dokumen
                </span>
              </div>

              <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
                {documents.map((doc) => {
                  const isSelected = doc.docNumber === activeDoc?.docNumber
                  const activeVersion = doc.versions?.length > 0
                    ? doc.versions[doc.versions.length - 1].version
                    : 'V0'

                  return (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDocNumber(doc.docNumber)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EBF2FF] border-[#163A70] shadow-2xs ring-1 ring-[#163A70]'
                          : 'bg-[#F8FAFC]/50 border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-mono text-xs font-bold text-[#163A70]">
                          {doc.docNumber}
                        </span>
                        <span className="font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-white text-[#4F46E5] border border-[#C7D2FE]">
                          {activeVersion}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-[#0F172A] line-clamp-1">
                        {doc.name}
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-[#64748B] mt-1">
                        <span>{doc.category}</span>
                        <span className={doc.revisionRequested ? 'text-[#D97706] font-bold' : ''}>
                          {doc.revisionRequested ? 'Perlu Revisi' : doc.statusLabel || STAGES[doc.stage]?.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Document Package, Versions & History */}
          {activeDoc && (
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Document Header & Quick Actions */}
              <Card className="border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-3.5 sm:p-5 space-y-3">
                  <div className="space-y-3">
                    {/* Top Section: Full Width Document Metadata */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-[#163A70] tracking-wide whitespace-nowrap bg-[#EBF2FF] px-2.5 py-0.5 rounded-lg border border-[#BFDBFE]">
                          {activeDoc.docNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] sm:text-[10.5px] font-bold bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]">
                          {activeDoc.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-[10.5px] font-bold ${
                            activeDoc.priority === 'Critical'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                              : activeDoc.priority === 'Urgent'
                              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {activeDoc.priority === 'Critical' ? 'Kritis' : activeDoc.priority === 'Urgent' ? 'Mendesak' : 'Normal'}
                        </Badge>
                      </div>

                      <h2 className="text-sm sm:text-base font-bold font-display text-[#0B2147] leading-snug">
                        {activeDoc.name}
                      </h2>
                      
                      <div className="text-[11px] sm:text-xs text-[#64748B] flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span>Divisi: <b className="text-[#334155]">{activeDoc.division}</b></span>
                        <span>•</span>
                        <span>PIC: <b className="text-[#334155]">{activeDoc.pic}</b></span>
                        <span>•</span>
                        <span>Kerahasiaan: <b className="text-[#334155]">{activeDoc.confidentiality === 'Confidential' ? 'Rahasia' : activeDoc.confidentiality === 'Restricted' ? 'Terbatas' : 'Internal'}</b></span>
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F1F5F9]">
                      <a
                        href={activeDoc.driveFolderUrl || `https://drive.google.com/drive/search?q=${encodeURIComponent(activeDoc.docNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] bg-[#0F9D58] hover:bg-[#0B8043] text-white font-bold rounded-xl shadow-2xs"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Google Drive</span>
                      </a>
                      <a
                        href={`/api/documents/${activeDoc._id}/sync-drive`}
                        download={`${activeDoc.docNumber}_log_riwayat.txt`}
                        className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#163A70] font-bold rounded-xl shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Log Riwayat (.txt)</span>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncingDrive}
                        onClick={() => handleSyncGoogleDrive(activeDoc._id)}
                        className="h-7 sm:h-8 text-[11px] border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-bold rounded-xl gap-1 shadow-2xs px-2.5"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncingDrive ? 'animate-spin' : ''}`} />
                        <span>{syncingDrive ? 'Menyinkronkan...' : 'Sinkronisasi'}</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsRevModalOpen(true)}
                        className="h-7 sm:h-8 text-[11px] bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5"
                      >
                        <FileUp className="h-3.5 w-3.5" />
                        <span>Revisi</span>
                      </Button>
                      {isDocumentController && (
                        <Button
                          size="sm"
                          onClick={() => setIsFinalModalOpen(true)}
                          className="h-7 sm:h-8 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Final</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 7 Stage Visual Pipeline */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-[#163A70]" />
                        <span>Alur Status 7 Tahap</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#163A70]">
                        Tahap {activeDoc.stage + 1} / 7
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#163A70] to-[#2563EB] transition-all duration-500 rounded-full"
                        style={{ width: `${Math.round(((activeDoc.stage + 1) / 7) * 100)}%` }}
                      />
                    </div>

                    <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                      {STAGES.map((st, i) => {
                        const Icon = st.icon
                        const isDone = i < activeDoc.stage
                        const isCurrent = i === activeDoc.stage
                        return (
                          <div
                            key={st.key}
                            className={`min-w-[95px] sm:min-w-0 p-2 rounded-xl text-center flex flex-col justify-between transition-all shrink-0 ${
                              isDone
                                ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]'
                                : isCurrent
                                ? activeDoc.revisionRequested
                                  ? 'bg-[#FFFBEB] border-2 border-[#D97706] text-[#D97706] shadow-xs'
                                  : 'bg-[#EBF2FF] border-2 border-[#163A70] text-[#163A70] shadow-xs'
                                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-0.5">
                              {isDone ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                              ) : isCurrent ? (
                                activeDoc.revisionRequested ? (
                                  <AlertTriangle className="h-3.5 w-3.5 text-[#D97706] animate-pulse" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-[#163A70] animate-pulse" />
                                )
                              ) : (
                                <Icon className="h-3.5 w-3.5 text-[#CBD5E1]" />
                              )}
                            </div>
                            <div className="text-[10px] font-bold font-mono">T{i + 1}</div>
                            <div className="text-[10px] font-semibold line-clamp-1 mt-0.5">{st.label}</div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-[11.5px] text-[#475569] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>Status Saat Ini:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[10.5px] ${
                            activeDoc.rejected
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                              : activeDoc.revisionRequested
                              ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                              : 'bg-[#EBF2FF] text-[#163A70] border border-[#BFDBFE]'
                          }`}
                        >
                          {activeDoc.rejected
                            ? 'Ditolak (Dibatalkan)'
                            : activeDoc.revisionRequested
                            ? 'Perlu Revisi (Revisi Diminta)'
                            : activeDoc.statusLabel || STAGES[activeDoc.stage]?.label}
                        </span>
                      </div>

                      {/* Workflow Operational Controls (Hanya untuk Non-Pemohon / Verifikator) */}
                      {!(normalizeRole(user?.role) === 'User' || normalizeRole(user?.role) === 'Guest') && !activeDoc.rejected && activeDoc.stage < 5 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!activeDoc.revisionRequested && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsRequestRevOpen(true)}
                              className="h-7 text-[11px] text-[#D97706] border-[#FDE68A] hover:bg-[#FFFBEB] font-bold rounded-lg cursor-pointer"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Minta Revisi
                            </Button>
                          )}

                          {activeDoc.revisionRequested && (
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'resolve_revision', 'Revisi telah diverifikasi')}
                              className="h-7 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Verifikasi Revisi
                            </Button>
                          )}

                          {!activeDoc.revisionRequested && (
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'approve', 'Disetujui untuk lanjut ke tahap berikutnya')}
                              className="h-7 text-[11px] bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Setujui Tahap
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsRejectModalOpen(true)}
                            className="h-7 text-[11px] text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2] font-bold rounded-lg cursor-pointer"
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Tolak Dokumen
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KONTRAK EXPIRE, PENGINGAT (H-60, H-30, H-15, H-7, H-1) & JUSTIFIKASI */}
              {activeDoc.contractEnd && !activeDoc.noDuration && (() => {
                const diffDays = getDiffDays(activeDoc)
                const tag = getMilestoneTag(diffDays)
                const start = activeDoc.contractStart ? new Date(activeDoc.contractStart) : null
                const end = new Date(activeDoc.contractEnd)
                const reminders = activeDoc.reminders || { h60: true, h30: true, h15: true, h7: true, h1: true }

                return (
                  <Card className="border-[#CBD5E1] shadow-2xs bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-2xl overflow-hidden">
                    <CardContent className="p-3.5 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#E2E8F0]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Clock className="h-3.5 w-3.5 text-[#163A70]" />
                            <span className="text-xs sm:text-sm font-bold font-display text-[#0B2147]">Masa Berlaku &amp; Pengingat Jatuh Tempo</span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${tag.color}`}>{tag.label}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            Masa Berlaku: {start ? start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} s/d <b className="text-[#0F172A]">{end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</b>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleOpenReminderModal(activeDoc)} className="h-7 text-[11px] border-[#CBD5E1] text-[#163A70] font-bold rounded-lg shadow-2xs px-2.5"><BellRing className="h-3 w-3 mr-1" />Set Pengingat</Button>
                          <Button size="sm" onClick={() => handleOpenDecisionModal(activeDoc, 'renew')} className="h-7 text-[11px] bg-[#059669] text-white font-bold rounded-lg px-2.5"><RefreshCw className="h-3 w-3 mr-1" />Perpanjang</Button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                          <Bell className="h-3.5 w-3.5 text-[#163A70]" />
                          <span className="font-bold text-[#0B2147]">Status Pengingat:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { key: 'h60', label: 'H-60', active: reminders.h60, passed: diffDays <= 60 },
                            { key: 'h30', label: 'H-30', active: reminders.h30, passed: diffDays <= 30 },
                            { key: 'h15', label: 'H-15', active: reminders.h15, passed: diffDays <= 15 },
                            { key: 'h7', label: 'H-7', active: reminders.h7, passed: diffDays <= 7 },
                            { key: 'h1', label: 'H-1', active: reminders.h1, passed: diffDays <= 1 },
                          ].map((m) => (
                            <div key={m.key} className={`px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-0.5 border ${!m.active ? 'bg-white text-[#94A3B8] border-[#E2E8F0]' : m.passed ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'}`}>
                              <span>{m.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* STRUCTURED DOCUMENT PACKAGE & VERSIONS (Area 5 & 6) */}
              <Card className="border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-3.5 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#163A70]" />
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#0B2147]">Paket Rangkaian Berkas &amp; Versi</h3>
                        <p className="text-[10.5px] sm:text-[11px] text-[#64748B]">Seluruh riwayat versi dan dokumen final dalam satu tiket.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeDoc.versions && activeDoc.versions.length > 0 ? (
                      activeDoc.versions.map((ver, idx) => {
                        const isFinalVer = ver.version === 'FINAL' || ver.isFinal
                        const isInitialVer = ver.version === 'V0'
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              isFinalVer
                                ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                                : isInitialVer
                                ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                                : 'bg-[#FFFBEB]/60 border-[#FDE68A]'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-mono text-[10.5px] font-extrabold ${
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
                                {ver.file.size && (
                                  <span className="text-[10px] text-[#64748B]">
                                    ({(ver.file.size / 1024).toFixed(1)} KB)
                                  </span>
                                )}
                              </div>
                              {ver.notes && (
                                <p className="text-[10.5px] text-[#64748B] italic truncate pl-1">
                                  Catatan: {ver.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewFile(activeDoc, ver.file)}
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold bg-[#163A70] text-white hover:bg-[#0B2147] shadow-2xs cursor-pointer"
                                title="Lihat / Buka Dokumen"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {ver.file.driveViewUrl ? 'Buka di Drive' : 'Lihat'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(activeDoc, ver.file)}
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold bg-white text-[#163A70] border border-[#CBD5E1] shadow-2xs hover:bg-[#F8FAFC] cursor-pointer"
                                title="Unduh Berkas Utuh"
                              >
                                <Download className="h-3 w-3" />
                                Unduh
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-3 text-xs text-[#64748B]">Belum ada riwayat versi.</div>
                    )}
                  </div>

                  {/* DOKUMEN PENDUKUNG / LAMPIRAN PENGAJUAN */}
                  {(() => {
                    const supportingList =
                      activeDoc.supportingDocuments && activeDoc.supportingDocuments.length > 0
                        ? activeDoc.supportingDocuments
                        : activeDoc.files && activeDoc.files.length > 1
                        ? activeDoc.files.slice(1)
                        : []

                    if (supportingList.length === 0) return null

                    return (
                      <div className="pt-3 border-t border-[#F1F5F9] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-[#059669]" />
                            <div>
                              <h4 className="text-xs font-bold text-[#0B2147]">
                                Dokumen Pendukung &amp; Lampiran Pengajuan ({supportingList.length})
                              </h4>
                              <p className="text-[10px] text-[#64748B]">
                                Seluruh berkas lampiran utuh yang diajukan pemohon dalam tiket ini.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {supportingList.map((f, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 text-[#059669] shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-[#0F172A] truncate">
                                      {f.originalName || f.filename}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9.5px] font-mono text-[#059669] border-[#A7F3D0]"
                                    >
                                      Lampiran • {f.size ? (f.size / 1024).toFixed(1) + ' KB' : '-'}
                                    </Badge>
                                  </div>
                                  {f.uploadedAt && (
                                    <div className="text-[10px] text-[#94A3B8]">
                                      Diunggah: {new Date(f.uploadedAt).toLocaleString('id-ID')}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleViewFile(activeDoc, f)}
                                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold bg-[#059669] text-white hover:bg-[#047857] shadow-2xs cursor-pointer"
                                  title="Lihat / Buka Lampiran"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {f.driveViewUrl ? 'Lihat di Drive' : 'Lihat'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(activeDoc, f)}
                                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold bg-white text-[#163A70] border border-[#CBD5E1] shadow-2xs hover:bg-[#F8FAFC] cursor-pointer"
                                  title="Unduh Lampiran Utuh"
                                >
                                  <Download className="h-3 w-3" />
                                  Unduh
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* DOCUMENT HISTORY & AUDIT TRAIL (Area 1) */}
              <Card className="border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-3.5 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#F1F5F9]">
                    <History className="h-4 w-4 text-[#163A70]" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0B2147]">Riwayat Perkembangan Dokumen</h3>
                      <p className="text-[10.5px] sm:text-[11px] text-[#64748B]">Log audit lengkap setiap aksi dan pergantian status.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase">
                          <th className="py-2.5 px-3">Waktu</th>
                          <th className="py-2.5 px-3">Aksi</th>
                          <th className="py-2.5 px-3">Pelaksana</th>
                          <th className="py-2.5 px-3">Versi</th>
                          <th className="py-2.5 px-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white">
                        {activeDoc.history && activeDoc.history.length > 0 ? (
                          activeDoc.history.map((hist, idx) => (
                            <tr key={idx} className="hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-3 text-[#64748B] font-mono text-[10.5px] whitespace-nowrap">
                                {new Date(hist.timestamp).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-[#0F172A]">
                                {hist.action}
                              </td>
                              <td className="py-2.5 px-3 text-[#475569]">
                                {hist.actor}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#163A70]">
                                  {hist.versionTag || 'V0'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#64748B] max-w-xs">
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

      {/* Reject Document Prompt Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#DC2626] flex items-center gap-2">
              <Ban className="h-5 w-5 text-[#DC2626]" />
              Tolak Pengajuan Dokumen — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Tuliskan alasan penolakan dokumen secara jelas untuk pemohon berkas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-3 pt-2">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan pengajuan dokumen ini ditolak..."
              rows={4}
              required
              className="text-xs rounded-xl"
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={rejectLoading}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer"
              >
                {rejectLoading ? 'Menolak...' : 'Konfirmasi Tolak Dokumen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 1. Modal: Ajukan Justifikasi / Pertimbangan Kontrak */}
      <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-[#163A70]" />
              Formulir Justifikasi Kontrak — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Ajukan evaluasi dan justifikasi resmi terhadap masa berlaku kontrak <b>{activeDoc?.name}</b>.
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
              Pengaturan Pengingat — {activeDoc?.docNumber}
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
