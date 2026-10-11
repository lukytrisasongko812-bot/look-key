"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem, DocumentFile, DocumentVersionItem } from '@/context/AppContext'
import {
  normalizeRole,
  isLegalManagement,
  isBoardOfDirectors,
  isLegalOfficer,
  isSystemAdmin,
  isStandardUser,
  isGuest,
  isDocumentOwnerOrPic,
  canUploadLegalDraft,
  canUploadLegalApproval,
  canUploadBodSigned,
  canUploadFinalDocument,
  canRequestRevision,
  canApproveCurrentStage,
} from '@/lib/roles'
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
  { key: 'review', label: 'Kajian Kelayakan', icon: Search },
  { key: 'drafting', label: 'Penyusunan Draf', icon: PenTool },
  { key: 'approval', label: 'Persetujuan Legal', icon: FileCheck2 },
  { key: 'bod', label: 'Persetujuan Direksi', icon: FileSignature },
  { key: 'archived', label: 'Selesai & Arsip', icon: Archive },
  { key: 'renewal', label: 'Jatuh Tempo', icon: Clock },
]

const CONSIDERATION_OPTIONS = [
  'Kinerja vendor memuaskan',
  'Kebutuhan operasional berlanjut',
  'Efisiensi biaya & ketersediaan anggaran',
  'Kepatuhan & legalitas aman',
  'Perubahan ruang lingkup (SOW)',
  'Pekerjaan selesai / tidak dilanjutkan',
  'Tersedia vendor alternatif',
  'Perlu adendum klausul / nilai / jangka waktu',
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
  const [reqCategory, setReqCategory] = useState('Kontrak Hukum')
  const [reqDivision, setReqDivision] = useState(user?.division || 'Direktorat Umum')
  const [reqPriority, setReqPriority] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal')
  const [reqConfidentiality, setReqConfidentiality] = useState<'Internal' | 'Confidential' | 'Restricted'>('Internal')
  const [reqStart, setReqStart] = useState('')
  const [reqEnd, setReqEnd] = useState('')
  const [reqNoDuration, setReqNoDuration] = useState(false)
  const [reqNotes, setReqNotes] = useState('')
  const [uploadedFile, setUploadedFile] = useState<DocumentFile | null>(null)
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

  // Role-Based Stage Upload Modal State
  const [isStageUploadModalOpen, setIsStageUploadModalOpen] = useState(false)
  const [stageUploadMode, setStageUploadMode] = useState<
    'legal_draft' | 'legal_approval' | 'bod_signed' | 'requester_revision' | 'final'
  >('legal_draft')
  const [stageUploadFile, setStageUploadFile] = useState<DocumentFile | null>(null)
  const [stageUploadTag, setStageUploadTag] = useState('')
  const [stageUploadNotes, setStageUploadNotes] = useState('')
  const [stageUploadAdvance, setStageUploadAdvance] = useState(true)
  const [stageUploadLoading, setStageUploadLoading] = useState(false)

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

  // Helper: Upload File to API / Google Drive with FormData
  const uploadBinaryFile = async (file: File): Promise<DocumentFile | null> => {
    try {
      const formData = new FormData()
      formData.append('files', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        if (data.files && data.files.length > 0) {
          return data.files[0]
        }
      }
    } catch (e) {
      console.warn('[Upload Binary Error, falling back to dataUrl]', e)
    }

    // Fallback: Read as dataUrl if <= 2MB
    if (file.size <= 2 * 1024 * 1024) {
      const dataUrl = await readFileAsDataUrl(file)
      return {
        originalName: file.name,
        filename: file.name.toLowerCase().replace(/\s+/g, '_'),
        size: file.size,
        mimeType: file.type || 'application/pdf',
        url: dataUrl,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      }
    }

    return {
      originalName: file.name,
      filename: file.name.toLowerCase().replace(/\s+/g, '_'),
      size: file.size,
      mimeType: file.type || 'application/pdf',
      url: `/files/${encodeURIComponent(file.name)}`,
      uploadedAt: new Date().toISOString(),
    }
  }

  // Single File Upload Handler for New Submission (Max 25 MB)
  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error(`Ukuran berkas "${file.name}" melebihi batas maksimal 25 MB.`)
      e.target.value = ''
      return
    }
    try {
      const docFile = await uploadBinaryFile(file)
      if (docFile) {
        setUploadedFile(docFile)
        toast.success(`Berkas "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) siap diajukan.`)
      } else {
        toast.error('Gagal memproses berkas dokumen.')
      }
    } catch (err) {
      toast.error('Gagal membaca berkas dokumen.')
    }
  }

  const handleRevFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error(`Berkas revisi melebihi batas maksimal 25 MB.`)
      return
    }
    try {
      const docFile = await uploadBinaryFile(file)
      if (docFile) {
        setRevFile(docFile)
        toast.success(`Berkas revisi "${file.name}" siap diunggah.`)
      } else {
        toast.error('Gagal memproses berkas revisi.')
      }
    } catch (err) {
      toast.error('Gagal membaca berkas revisi.')
    }
  }

  const handleFinalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error(`Berkas dokumen final melebihi batas maksimal 25 MB.`)
      return
    }
    try {
      const docFile = await uploadBinaryFile(file)
      if (docFile) {
        setFinalFile(docFile)
        toast.success(`Berkas final "${file.name}" siap diunggah.`)
      } else {
        toast.error('Gagal memproses berkas final.')
      }
    } catch (err) {
      toast.error('Gagal membaca berkas final.')
    }
  }

  // Generic Stage Upload Handlers (Role Authority Matrix)
  const handleStageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas maksimal 25 MB.')
      return
    }
    try {
      const docFile = await uploadBinaryFile(file)
      if (docFile) {
        setStageUploadFile(docFile)
        toast.success(`Berkas "${file.name}" siap diunggah.`)
      } else {
        toast.error('Gagal memproses berkas dokumen.')
      }
    } catch {
      toast.error('Gagal membaca berkas dokumen.')
    }
  }

  const openStageUpload = (
    mode: 'legal_draft' | 'legal_approval' | 'bod_signed' | 'requester_revision' | 'final',
    defaultTag?: string
  ) => {
    setStageUploadMode(mode)
    const currentRevCount = (activeDoc?.revisionDocuments?.length || 0) + 1
    let initialTag = defaultTag || `Rev.${currentRevCount.toString().padStart(2, '0')}`

    if (mode === 'legal_draft') {
      initialTag = defaultTag || (activeDoc?.stage === 1 ? 'Kajian-Legal-V1' : `Draf-Legal-V${currentRevCount}`)
    } else if (mode === 'legal_approval') {
      initialTag = defaultTag || 'Clearance-Legal'
    } else if (mode === 'bod_signed') {
      initialTag = defaultTag || 'BOD-Signed'
    } else if (mode === 'final') {
      initialTag = 'FINAL'
    } else if (mode === 'requester_revision') {
      initialTag = `Rev.${currentRevCount.toString().padStart(2, '0')}`
    }

    setStageUploadTag(initialTag)
    setStageUploadNotes('')
    setStageUploadFile(null)
    setStageUploadAdvance(true)
    setIsStageUploadModalOpen(true)
  }

  const handleStageUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDoc || !stageUploadFile) {
      toast.error('Berkas dokumen wajib diunggah.')
      return
    }

    setStageUploadLoading(true)

    const cleanFile: DocumentFile = {
      ...stageUploadFile,
      dataUrl: stageUploadFile.size > 2 * 1024 * 1024 ? undefined : stageUploadFile.dataUrl,
    }

    let actionLabel = ''
    let fileType: 'initial' | 'revision' | 'supporting' | 'final' = 'revision'
    let isFinal = false

    if (stageUploadMode === 'legal_draft') {
      actionLabel = `Unggah Dokumen Kajian Legal / Draf Perjanjian (${stageUploadTag})`
      fileType = 'revision'
    } else if (stageUploadMode === 'legal_approval') {
      actionLabel = `Unggah Lembar Persetujuan Legal Clearance (${stageUploadTag})`
      fileType = 'revision'
    } else if (stageUploadMode === 'bod_signed') {
      actionLabel = `Unggah Dokumen Pengesahan Direksi (${stageUploadTag})`
      fileType = 'revision'
    } else if (stageUploadMode === 'final') {
      actionLabel = 'Unggah Dokumen Final Resmi (FINAL)'
      fileType = 'final'
      isFinal = true
    } else {
      actionLabel = `Unggah Berkas Perbaikan Pemohon (${stageUploadTag})`
      fileType = 'revision'
    }

    let ok = false
    if (isFinal) {
      ok = await uploadFinalDocument(activeDoc._id, cleanFile, stageUploadNotes)
    } else {
      ok = await uploadRevision(activeDoc._id, cleanFile, stageUploadNotes, stageUploadTag, {
        actionLabel,
        advanceStage: stageUploadAdvance,
        fileType,
      })
    }

    setStageUploadLoading(false)

    if (ok) {
      toast.success(`Berkas ${stageUploadTag} berhasil diunggah dan disimpan ke sistem!`)
      setIsStageUploadModalOpen(false)
      setStageUploadFile(null)
      setStageUploadNotes('')
    } else {
      toast.error('Gagal mengunggah berkas. Periksa kewenangan atau ukuran berkas.')
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
    const fileName = file.originalName || file.filename || 'dokumen'
    const viewUrl = `/api/documents/${doc.docNumber || doc._id}/view?name=${encodeURIComponent(fileName)}`
    window.open(viewUrl, '_blank')
  }

  // Create Request Submit
  const handleNewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim()) {
      toast.error('Nama dokumen / kontrak wajib diisi.')
      return
    }

    const sanitizeFile = (f: DocumentFile | null): DocumentFile | null => {
      if (!f) return null
      const isLarge = f.size > 2 * 1024 * 1024
      return {
        ...f,
        url: isLarge ? `/files/${encodeURIComponent(f.filename || f.originalName)}` : (f.url || `/files/${encodeURIComponent(f.filename || f.originalName)}`),
        dataUrl: isLarge ? undefined : f.dataUrl,
      }
    }

    const cleanInitialFile = sanitizeFile(uploadedFile)
    const allFiles = cleanInitialFile ? [cleanInitialFile] : []

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
      initialDocument: cleanInitialFile,
      supportingDocuments: [],
      files: allFiles,
      pic: user?.employeeName || 'Pengaju',
      picEmail: user?.email || '',
      createdBy: user?.id || (user as any)?.userId || user?.email,
    } as any)
    setIsSubmitting(false)

    if (newDoc) {
      toast.success(`Pengajuan ${newDoc.docNumber} berhasil dibuat dan masuk ke sistem!`)
      setSelectedDocNumber(newDoc.docNumber)
      setTrackSubTab('progress')
      // Reset
      setReqName('')
      setReqNotes('')
      setUploadedFile(null)
    } else {
      toast.error('Gagal membuat pengajuan dokumen. Silakan periksa kembali isian berkas atau coba beberapa saat lagi.')
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

    const cleanRevFile: DocumentFile = {
      ...revFile,
      dataUrl: revFile.size > 2 * 1024 * 1024 ? undefined : revFile.dataUrl,
    }

    setRevLoading(true)
    const ok = await uploadRevision(activeDoc._id, cleanRevFile, revNotes)
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

    const cleanFinalFile: DocumentFile = {
      ...finalFile,
      dataUrl: finalFile.size > 2 * 1024 * 1024 ? undefined : finalFile.dataUrl,
    }

    setFinalLoading(true)
    const ok = await uploadFinalDocument(activeDoc._id, cleanFinalFile, finalNotes)
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

  // Corporate Authority Matrix Checkers
  const userRole = normalizeRole(user?.role)
  const isDocOwner = isDocumentOwnerOrPic(user, activeDoc)
  const userCanLegalDraft = canUploadLegalDraft(userRole)
  const userCanLegalApproval = canUploadLegalApproval(userRole)
  const userCanBodSign = canUploadBodSigned(userRole)
  const userCanFinalDoc = canUploadFinalDocument(userRole)
  const userCanReview = canRequestRevision(userRole)
  const userCanApprove = canApproveCurrentStage(userRole, activeDoc?.stage ?? 0)

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-[#0B2147] tracking-tight">
          {trackSubTab === 'new' ? 'Pengajuan Dokumen' : 'Pelacakan Dokumen'}
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          {trackSubTab === 'new'
            ? 'Formulir registrasi dokumen dan permohonan kajian hukum.'
            : 'Pelacakan alur berkas, kajian klausul hukum, dan persetujuan 7 tahap.'}
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
          <span>Lacak Alur</span>
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
                  Lengkapi data pengajuan berkas.
                </p>
              </div>
            </div>

            <form onSubmit={handleNewRequestSubmit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Dokumen <span className="text-[#DC2626]">*</span></Label>
                <Input
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Contoh: Perjanjian Sewa Alat Berat"
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
                    <option value="Kontrak Hukum">Kontrak Hukum</option>
                    <option value="NDA">NDA (Non-Disclosure Agreement)</option>
                    <option value="MoU">MoU (Memorandum of Understanding)</option>
                    <option value="Legal Opinion / Analyst">Legal Opinion / Analyst</option>
                    <option value="Perizinan">Perizinan</option>
                    <option value="Surat Menyurat Resmi">Surat Menyurat Resmi (Korespondensi)</option>
                    <option value="Dokumen Lainnya">Dokumen Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tingkat Prioritas</Label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as 'Normal' | 'Urgent' | 'Critical')}
                    className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                  >
                    <option value="Normal">Normal (15 Hari)</option>
                    <option value="Urgent">Mendesak (10 Hari)</option>
                    <option value="Critical">Kritis (5 Hari)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Divisi</Label>
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
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Rahasia (Confidential)</option>
                    <option value="Restricted">Terbatas (Restricted)</option>
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
                  placeholder="Catatan tambahan untuk reviewer..."
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Single File Upload Box (Max 20 MB) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#0B2147] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#163A70]" />
                    Unggah Berkas Dokumen <span className="text-[#DC2626]">*</span>
                  </Label>
                  <span className="text-[11px] font-medium text-[#64748B]">
                    PDF, DOCX, XLSX, JPG, PNG (Maks. 20 MB)
                  </span>
                </div>

                {!uploadedFile ? (
                  <label
                    htmlFor="main-file-upload"
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CBD5E1] p-6 text-center hover:border-[#163A70] hover:bg-[#F8FAFC] transition-all bg-[#F8FAFC]/50 cursor-pointer group"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-[#EBF2FF] text-[#163A70] group-hover:bg-[#163A70] group-hover:text-white transition-all flex items-center justify-center mb-2.5">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-xs font-bold text-[#0F172A]">
                      Pilih atau seret berkas ke sini
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 mb-3">
                      Format: PDF, Word, Excel, Gambar (Maks. 20 MB)
                    </p>
                    <div className="px-4 py-2 rounded-xl bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs shadow-2xs inline-flex items-center gap-2">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Pilih Berkas</span>
                    </div>
                    <input
                      id="main-file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                      onChange={handleSingleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="h-9 w-9 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-[#065F46] truncate">{uploadedFile.originalName}</div>
                        <div className="text-[10.5px] text-[#047857] flex items-center gap-1.5 mt-0.5">
                          <span>{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className="font-semibold uppercase">{uploadedFile.originalName.split('.').pop()}</span>
                          <span>•</span>
                          <span className="text-[#059669] font-bold">Siap Diajukan</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-[#DC2626] hover:bg-[#FEE2E2] p-2 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                      title="Hapus / Ganti Berkas"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#F1F5F9]">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PROGRESS & DOCUMENT HISTORY */}
      {trackSubTab === 'progress' && (
        documents.length === 0 ? (
          <Card className="max-w-2xl mx-auto border-[#E2E8F0] shadow-xs rounded-3xl p-8 sm:p-12 text-center bg-white my-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-[#EFF6FF] text-[#163A70] flex items-center justify-center mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold font-display text-[#0B2147] mb-1">
              Belum Ada Pengajuan Dokumen
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto mb-6">
              Akun Anda belum memiliki riwayat pengajuan dokumen. Klik tombol di bawah untuk membuat draf pengajuan dokumen baru.
            </p>
            <Button
              onClick={() => setTrackSubTab('new')}
              className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Pengajuan Baru</span>
            </Button>
          </Card>
        ) : (
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
                          {activeDoc.priority === 'Critical' ? 'Kritis (5 Hari)' : activeDoc.priority === 'Urgent' ? 'Mendesak (10 Hari)' : 'Normal (15 Hari)'}
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

                    {/* Action Buttons Toolbar Sesuai Matriks Kewenangan */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F1F5F9]">
                      <a
                        href={activeDoc.driveFolderUrl || `https://drive.google.com/drive/search?q=${encodeURIComponent(activeDoc.docNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] bg-[#0F9D58] hover:bg-[#0B8043] text-white font-bold rounded-xl shadow-2xs"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Drive</span>
                      </a>
                      <a
                        href={`/api/documents/${activeDoc._id}/sync-drive`}
                        download={`${activeDoc.docNumber}_log_riwayat.txt`}
                        className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#163A70] font-bold rounded-xl shadow-2xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Log (.txt)</span>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncingDrive}
                        onClick={() => handleSyncGoogleDrive(activeDoc._id)}
                        className="h-7 sm:h-8 text-[11px] border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-bold rounded-xl gap-1 shadow-2xs px-2.5 cursor-pointer"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncingDrive ? 'animate-spin' : ''}`} />
                        <span>{syncingDrive ? 'Menyinkronkan...' : 'Sinkron'}</span>
                      </Button>

                      {/* Tombol Unggah Kajian Legal (Legal Officer / Legal Management) */}
                      {userCanLegalDraft && activeDoc.stage < 5 && (
                        <Button
                          size="sm"
                          onClick={() => openStageUpload('legal_draft')}
                          className="h-7 sm:h-8 text-[11px] bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5 cursor-pointer"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Kajian Legal</span>
                        </Button>
                      )}

                      {/* Tombol Unggah Persetujuan Legal (Legal Management) */}
                      {userCanLegalApproval && activeDoc.stage >= 2 && activeDoc.stage < 5 && (
                        <Button
                          size="sm"
                          onClick={() => openStageUpload('legal_approval')}
                          className="h-7 sm:h-8 text-[11px] bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5 cursor-pointer"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          <span>Legal Clearance</span>
                        </Button>
                      )}

                      {/* Tombol Unggah Dokumen Bertanda Tangan Direksi (BOD) */}
                      {userCanBodSign && activeDoc.stage >= 3 && activeDoc.stage < 5 && (
                        <Button
                          size="sm"
                          onClick={() => openStageUpload('bod_signed')}
                          className="h-7 sm:h-8 text-[11px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5 cursor-pointer"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                          <span>Pengesahan Direksi</span>
                        </Button>
                      )}

                      {/* Tombol Unggah Dokumen Final (Legal Management / Admin) */}
                      {userCanFinalDoc && (
                        <Button
                          size="sm"
                          onClick={() => openStageUpload('final')}
                          className="h-7 sm:h-8 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5 cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Dokumen Final</span>
                        </Button>
                      )}

                      {/* Tombol Unggah Berkas Perbaikan Pemohon jika ada status revisi */}
                      {activeDoc.revisionRequested && (isDocOwner || isStandardUser(userRole) || isGuest(userRole)) && (
                        <Button
                          size="sm"
                          onClick={() => openStageUpload('requester_revision')}
                          className="h-7 sm:h-8 text-[11px] bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl gap-1 shadow-2xs px-2.5 cursor-pointer animate-pulse"
                        >
                          <FileUp className="h-3.5 w-3.5" />
                          <span>Perbaikan Berkas</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 7 Stage Visual Pipeline */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-[#163A70]" />
                        <span>Alur Status</span>
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                      {STAGES.map((stg, idx) => {
                        const Icon = stg.icon
                        const isCompleted = (activeDoc.stage ?? 0) > idx
                        const isCurrent = (activeDoc.stage ?? 0) === idx

                        return (
                          <div
                            key={stg.key}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'border-[#163A70] bg-[#EBF2FF] shadow-2xs'
                                : isCompleted
                                ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                                : 'border-[#F1F5F9] bg-[#F8FAFC]'
                            }`}
                          >
                            <div
                              className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg mb-1 ${
                                isCurrent
                                  ? 'bg-[#163A70] text-white'
                                  : isCompleted
                                  ? 'bg-[#059669] text-white'
                                  : 'bg-[#E2E8F0] text-[#94A3B8]'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              ) : (
                                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              )}
                            </div>
                            <span
                              className={`text-[9px] sm:text-[10px] font-bold truncate max-w-full px-0.5 ${
                                isCurrent
                                  ? 'text-[#163A70]'
                                  : isCompleted
                                  ? 'text-[#065F46]'
                                  : 'text-[#94A3B8]'
                              }`}
                            >
                              {stg.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>

                {/* Stage Controls & Workflow Action Buttons */}
                <div className="p-3 sm:p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#64748B]">Tahap Aktif:</span>
                    <Badge className="bg-[#163A70] text-white text-[10.5px] font-bold">
                      {STAGES[activeDoc.stage ?? 0]?.label || 'Pengajuan Baru'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Kondisi Revisi Aktif */}
                    {activeDoc.revisionRequested && (
                      <>
                        {(isDocOwner || isStandardUser(userRole) || isGuest(userRole) || isSystemAdmin(userRole)) && (
                          <Button
                            size="sm"
                            onClick={() => openStageUpload('requester_revision')}
                            className="h-7 text-[11px] bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-lg cursor-pointer animate-pulse"
                          >
                            <FileUp className="h-3 w-3 mr-1" />
                            Unggah Berkas Perbaikan
                          </Button>
                        )}
                        {userCanReview && (
                          <Button
                            size="sm"
                            onClick={() => transitionDocument(activeDoc._id, 'approve', 'Perbaikan berkas telah diperiksa dan disetujui untuk melanjutkan tahapan')}
                            className="h-7 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Setujui Perbaikan
                          </Button>
                        )}
                      </>
                    )}

                    {/* 2. Kondisi Normal Berdasarkan Tahap & Kewenangan */}
                    {!activeDoc.revisionRequested && activeDoc.stage < 5 && (
                      <>
                        {/* Stage 0: Pengajuan Baru */}
                        {activeDoc.stage === 0 && userCanLegalDraft && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'approve', 'Pengajuan diterima, mulai peninjauan kelayakan')}
                              className="h-7 text-[11px] bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Kaji Kelayakan (T2)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStageUpload('legal_draft', 'Kajian-Legal-V1')}
                              className="h-7 text-[11px] border-[#163A70] text-[#163A70] hover:bg-[#EBF2FF] font-bold rounded-lg cursor-pointer"
                            >
                              <FileEdit className="h-3 w-3 mr-1" />
                              Unggah Kajian Legal
                            </Button>
                          </>
                        )}

                        {/* Stage 1: Peninjauan Kelayakan */}
                        {activeDoc.stage === 1 && userCanLegalDraft && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openStageUpload('legal_draft', 'Kajian-Legal-V1')}
                              className="h-7 text-[11px] bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <FileEdit className="h-3 w-3 mr-1" />
                              Unggah Kajian Legal
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'approve', 'Kelayakan dokumen disetujui, lanjut penyusunan draf')}
                              className="h-7 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Setujui Kelayakan (T3)
                            </Button>
                          </>
                        )}

                        {/* Stage 2: Penyusunan Draf (Drafting) */}
                        {activeDoc.stage === 2 && userCanLegalDraft && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openStageUpload('legal_draft', 'Draf-Legal-V1')}
                              className="h-7 text-[11px] bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <FileEdit className="h-3 w-3 mr-1" />
                              Unggah Draf Perjanjian
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'approve', 'Penyusunan draf selesai, diajukan ke Legal Management')}
                              className="h-7 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Setujui Draf (T4)
                            </Button>
                          </>
                        )}

                        {/* Stage 3: Persetujuan Legal (Legal Management) */}
                        {activeDoc.stage === 3 && userCanLegalApproval && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openStageUpload('legal_approval', 'Clearance-Legal')}
                              className="h-7 text-[11px] bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <FileCheck2 className="h-3 w-3 mr-1" />
                              Unggah Legal Clearance
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'approve', 'Legal clearance disetujui penuh oleh Legal Management')}
                              className="h-7 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Teruskan ke Direksi (T5)
                            </Button>
                          </>
                        )}

                        {/* Stage 4: Persetujuan Direksi (BOD Signed) */}
                        {activeDoc.stage === 4 && (userCanBodSign || userCanLegalApproval) && (
                          <>
                            {userCanBodSign && (
                              <Button
                                size="sm"
                                onClick={() => openStageUpload('bod_signed', 'BOD-Signed')}
                                className="h-7 text-[11px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg cursor-pointer"
                              >
                                <FileSignature className="h-3 w-3 mr-1" />
                                Unggah Pengesahan Direksi
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => transitionDocument(activeDoc._id, 'approve', 'Persetujuan eksekutif disahkan oleh Dewan Direksi')}
                              className="h-7 text-[11px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg cursor-pointer"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Sahkan Dokumen Final
                            </Button>
                          </>
                        )}

                              {/* Minta Revisi (Dapat diminta oleh Legal Officer, Management, BOD, Admin) */}
                              {userCanReview && (
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

                              {/* Tolak Dokumen */}
                              {userCanReview && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsRejectModalOpen(true)}
                                  className="h-7 text-[11px] text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2] font-bold rounded-lg cursor-pointer"
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Tolak
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
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
                            <span className="text-xs sm:text-sm font-bold font-display text-[#0B2147]">Masa Berlaku &amp; Pengingat</span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${tag.color}`}>{tag.label}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            Masa Berlaku: {start ? start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} s/d <b className="text-[#0F172A]">{end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</b>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleOpenReminderModal(activeDoc)} className="h-7 text-[11px] border-[#CBD5E1] text-[#163A70] font-bold rounded-lg shadow-2xs px-2.5"><BellRing className="h-3 w-3 mr-1" />Pengingat</Button>
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
                        <h3 className="text-xs sm:text-sm font-bold text-[#0B2147]">Paket Berkas &amp; Versi</h3>
                        <p className="text-[10.5px] sm:text-[11px] text-[#64748B]">Riwayat versi berkas dan dokumen final.</p>
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
                                Dokumen Pendukung ({supportingList.length})
                              </h4>
                              <p className="text-[10px] text-[#64748B]">
                                Lampiran pendukung dari pemohon.
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
                      <h3 className="text-xs sm:text-sm font-bold text-[#0B2147]">Riwayat Dokumen</h3>
                      <p className="text-[10.5px] sm:text-[11px] text-[#64748B]">Log audit riwayat status dan tindakan.</p>
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
      ))}

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
              <Label className="text-xs font-semibold">Pilih Berkas Revisi (PDF / DOCX) <span className="text-[#DC2626]">*</span></Label>
              {!revFile ? (
                <label
                  htmlFor="rev-file-upload"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] p-4 text-center hover:border-[#D97706] hover:bg-[#FFFBEB]/40 transition-all bg-[#F8FAFC] cursor-pointer"
                >
                  <FileUp className="h-6 w-6 text-[#D97706] mb-1" />
                  <span className="text-xs font-bold text-[#0F172A]">Klik untuk Memilih Berkas Revisi</span>
                  <span className="text-[10px] text-[#64748B]">Maksimal 20 MB</span>
                  <input
                    id="rev-file-upload"
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleRevFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="h-4 w-4 text-[#D97706] shrink-0" />
                    <span className="font-bold text-[#92400E] truncate">{revFile.originalName}</span>
                    <Badge className="text-[9px] bg-[#D97706] text-white">
                      {(revFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevFile(null)}
                    className="text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-lg cursor-pointer"
                    title="Hapus / Ganti"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catatan Revisi &amp; Poin Perubahan</Label>
              <Textarea
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
                placeholder="Contoh: Penyesuaian klausul denda keterlambatan Pasal 12 dan durasi sewa..."
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
              <Label className="text-xs font-semibold">Pilih Berkas Dokumen Final Sah (PDF) <span className="text-[#DC2626]">*</span></Label>
              {!finalFile ? (
                <label
                  htmlFor="final-file-upload"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] p-4 text-center hover:border-[#059669] hover:bg-[#ECFDF5]/40 transition-all bg-[#F8FAFC] cursor-pointer"
                >
                  <ShieldCheck className="h-6 w-6 text-[#059669] mb-1" />
                  <span className="text-xs font-bold text-[#0F172A]">Klik untuk Memilih Berkas Final</span>
                  <span className="text-[10px] text-[#64748B]">Maksimal 20 MB (PDF)</span>
                  <input
                    id="final-file-upload"
                    type="file"
                    required
                    accept=".pdf"
                    onChange={handleFinalFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="h-4 w-4 text-[#059669] shrink-0" />
                    <span className="font-bold text-[#065F46] truncate">{finalFile.originalName}</span>
                    <Badge className="text-[9px] bg-[#059669] text-white">
                      {(finalFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFinalFile(null)}
                    className="text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-lg cursor-pointer"
                    title="Hapus / Ganti"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catatan Pengesahan Dokumen Final</Label>
              <Textarea
                value={finalNotes}
                onChange={(e) => setFinalNotes(e.target.value)}
                placeholder="Contoh: Dokumen telah ditandatangani lengkap oleh Direktur Utama dan sah berlaku..."
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
              Permintaan Revisi — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Catatan perbaikan yang harus diselesaikan pemohon.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Textarea
              value={requestRevReason}
              onChange={(e) => setRequestRevReason(e.target.value)}
              placeholder="Jelaskan bagian yang perlu direvisi..."
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
              Minta Revisi
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
              Tolak Dokumen — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Alasan penolakan pengajuan dokumen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-3 pt-2">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan dokumen..."
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
                {rejectLoading ? 'Menolak...' : 'Tolak Dokumen'}
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
              Justifikasi Kontrak — {activeDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>
              Evaluasi dan justifikasi masa berlaku kontrak.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold block">Rekomendasi Tindakan</Label>
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
              <Label className="text-xs font-semibold block">Faktor Pertimbangan</Label>
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
              <Label className="text-xs font-semibold block">Uraian Justifikasi</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Tuliskan alasan evaluasi kebutuhan perpanjangan/adendum..."
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
              Interval notifikasi sebelum tanggal jatuh tempo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReminderSave} className="space-y-4 pt-2">
            <div className="space-y-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              {[
                { key: 'h60', label: 'H-60 (60 Hari)', desc: 'Evaluasi awal berkas' },
                { key: 'h30', label: 'H-30 (30 Hari)', desc: 'Penyusunan kajian kebutuhan' },
                { key: 'h15', label: 'H-15 (15 Hari)', desc: 'Penyusunan draf kelanjutan' },
                { key: 'h7', label: 'H-7 (7 Hari)', desc: 'Persetujuan pimpinan' },
                { key: 'h1', label: 'H-1 (1 Hari)', desc: 'Batas akhir kontrak' },
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
              <Label className="text-xs font-semibold block">Catatan Tambahan (Opsional)</Label>
              <Input
                value={reminderConfig.customNotes}
                onChange={(e) => setReminderConfig((prev) => ({ ...prev, customNotes: e.target.value }))}
                placeholder="Contoh: Hubungi tim legal segera"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsReminderModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={savingReminder} className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                {savingReminder ? 'Menyimpan...' : 'Simpan Pengingat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Role-Based Stage Upload Modal (Corporate Authority Matrix) */}
      <Dialog open={isStageUploadModalOpen} onOpenChange={setIsStageUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  stageUploadMode === 'legal_draft'
                    ? 'bg-[#EBF2FF] text-[#163A70]'
                    : stageUploadMode === 'legal_approval'
                    ? 'bg-[#ECFDF5] text-[#059669]'
                    : stageUploadMode === 'bod_signed'
                    ? 'bg-[#F5F3FF] text-[#7C3AED]'
                    : stageUploadMode === 'final'
                    ? 'bg-[#F0FDF4] text-[#16A34A]'
                    : 'bg-[#FFFBEB] text-[#D97706]'
                }`}
              >
                {stageUploadMode === 'legal_draft' && <FileText className="h-5 w-5" />}
                {stageUploadMode === 'legal_approval' && <ShieldCheck className="h-5 w-5" />}
                {stageUploadMode === 'bod_signed' && <PenTool className="h-5 w-5" />}
                {stageUploadMode === 'final' && <CheckCircle2 className="h-5 w-5" />}
                {stageUploadMode === 'requester_revision' && <FileUp className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-[#0B2147] text-base font-bold font-display">
                  {stageUploadMode === 'legal_draft' && 'Unggah Kajian Legal / Draf Perjanjian'}
                  {stageUploadMode === 'legal_approval' && 'Unggah Lembar Persetujuan (Legal Clearance)'}
                  {stageUploadMode === 'bod_signed' && 'Unggah Dokumen Pengesahan Direksi'}
                  {stageUploadMode === 'final' && 'Unggah Dokumen Final Resmi (Arsip)'}
                  {stageUploadMode === 'requester_revision' && 'Unggah Berkas Perbaikan Pemohon'}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#64748B] mt-0.5">
                  {stageUploadMode === 'legal_draft' &&
                    'Unggah dokumen hasil kajian klausul hukum atau draf perjanjian ke sistem.'}
                  {stageUploadMode === 'legal_approval' &&
                    'Unggah lembar clearance dan persetujuan resmi Legal Management.'}
                  {stageUploadMode === 'bod_signed' &&
                    'Unggah salinan dokumen resmi yang telah disahkan Dewan Direksi.'}
                  {stageUploadMode === 'final' &&
                    'Unggah berkas final bertanda tangan lengkap untuk pengarsipan resmi.'}
                  {stageUploadMode === 'requester_revision' &&
                    'Unggah perbaikan berkas sesuai catatan rekomendasi tim legal.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleStageUploadSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nomor Berkas</Label>
                <Input
                  value={activeDoc?.docNumber || ''}
                  disabled
                  className="h-9 text-xs rounded-xl bg-[#F8FAFC] font-semibold text-[#0F172A]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Label / Tag Versi <span className="text-[#DC2626]">*</span>
                </Label>
                <Input
                  value={stageUploadTag}
                  onChange={(e) => setStageUploadTag(e.target.value)}
                  placeholder="Contoh: Kajian-Legal-V1, Clearance-Legal"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Berkas Dokumen <span className="text-[#DC2626]">*</span>
              </Label>
              <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#163A70] rounded-2xl p-4 text-center transition-colors bg-[#F8FAFC]">
                {stageUploadFile ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 bg-[#EBF2FF] text-[#163A70] rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="text-left truncate">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          {stageUploadFile.originalName}
                        </p>
                        <p className="text-[10.5px] text-[#64748B]">
                          {(stageUploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStageUploadFile(null)}
                      className="text-[#DC2626] hover:bg-[#FEF2F2] h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FileUp className="h-7 w-7 mx-auto text-[#94A3B8] mb-1.5" />
                    <p className="text-xs font-bold text-[#0F172A]">Pilih berkas untuk diunggah</p>
                    <p className="text-[10.5px] text-[#64748B] mt-0.5">
                      PDF, DOCX, XLSX (Maks. 20 MB)
                    </p>
                    <label className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#163A70] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#0B2147] transition-all">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Cari Berkas</span>
                      <input
                        type="file"
                        onChange={handleStageFileUpload}
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.zip"
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Catatan / Keterangan Dokumen</Label>
              <Textarea
                value={stageUploadNotes}
                onChange={(e) => setStageUploadNotes(e.target.value)}
                placeholder="Tuliskan ringkasan kajian hukum, penyesuaian pasal, atau instruksi kerja..."
                rows={3}
                className="text-xs rounded-xl"
              />
            </div>

            {/* Advance Stage Option */}
            {stageUploadMode !== 'final' && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">
                    Lanjutkan ke Tahap Berikutnya
                  </div>
                  <div className="text-[10.5px] text-[#64748B]">
                    Otomatis perbarui status dan ajukan berkas ke proses selanjutnya.
                  </div>
                </div>
                <Switch
                  checked={stageUploadAdvance}
                  onCheckedChange={setStageUploadAdvance}
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStageUploadModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={stageUploadLoading || !stageUploadFile}
                className={`font-bold text-white ${
                  stageUploadMode === 'final'
                    ? 'bg-[#16A34A] hover:bg-[#15803D]'
                    : 'bg-[#163A70] hover:bg-[#0B2147]'
                }`}
              >
                {stageUploadLoading ? 'Mengunggah...' : 'Unggah & Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
