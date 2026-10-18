"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem, DocumentFile } from '@/context/AppContext'
import {
  normalizeRole,
  isDocumentOwnerOrPic,
  isStandardUser,
  isGuest,
  canUserEditDocument,
  canUserDeleteDocument,
} from '@/lib/roles'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Download,
  GitPullRequestDraft,
  Inbox,
  AlertCircle,
  FileCheck2,
  Archive,
  ArrowUpDown,
  Trash2,
  Layers,
  FileText,
  FolderOpen,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Paperclip,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export function MyDocumentsView() {
  const {
    user,
    documents,
    searchQuery,
    setSearchQuery,
    setCurrentView,
    setSelectedDocNumber,
    updateDocument,
    deleteDocument,
  } = useApp()

  const [statusFilter, setStatusFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all')
  const [viewModalDoc, setViewModalDoc] = useState<DocumentItem | null>(null)
  const [editModalDoc, setEditModalDoc] = useState<DocumentItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editPic, setEditPic] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDivision, setEditDivision] = useState('')
  const [editPriority, setEditPriority] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal')
  const [editNotes, setEditNotes] = useState('')

  const userRole = normalizeRole(user?.role)
  const isPrivileged = userRole !== 'User' && userRole !== 'Guest'

  const getDocStatusLabel = (doc: DocumentItem) => {
    if (doc.rejected) return 'Ditolak'
    if (doc.revisionRequested) return 'Perlu Revisi'
    if (doc.stage <= 2) return 'Sedang Diproses'
    if (doc.stage === 3 || doc.stage === 4) return 'Menunggu Persetujuan'
    return 'Dokumen Final'
  }

  const filteredDocs = documents.filter((doc) => {
    // Ownership scope filter for privileged roles
    if (isPrivileged && scopeFilter === 'mine') {
      if (!isDocumentOwnerOrPic(user, doc)) return false
    }

    const q = searchQuery.toLowerCase()
    const matchesQuery =
      !q ||
      doc.docNumber.toLowerCase().includes(q) ||
      doc.name.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.pic.toLowerCase().includes(q)

    const label = getDocStatusLabel(doc)
    const matchesStatus = !statusFilter || label === statusFilter

    return matchesQuery && matchesStatus
  })

  // Summary Metrics
  const scopedList = isPrivileged && scopeFilter === 'mine'
    ? documents.filter((d) => isDocumentOwnerOrPic(user, d))
    : documents

  const inProgressCount = scopedList.filter((d) => !d.rejected && d.stage < 5 && !d.revisionRequested).length
  const revisionCount = scopedList.filter((d) => d.revisionRequested && !d.rejected).length
  const finalCount = scopedList.filter((d) => d.stage >= 5 || d.stageStatus === 'completed').length

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalDoc) return
    const ok = await updateDocument(editModalDoc._id, {
      name: editName,
      pic: editPic,
      category: editCategory,
      division: editDivision,
      priority: editPriority,
      notes: editNotes,
    })
    if (ok) {
      toast.success('Data pengajuan berhasil diperbarui.')
      setEditModalDoc(null)
    } else {
      toast.error('Gagal memperbarui data.')
    }
  }

  const handleDelete = async (doc: DocumentItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengajuan ${doc.docNumber}?`)) {
      const ok = await deleteDocument(doc._id)
      if (ok) {
        toast.success(`Pengajuan ${doc.docNumber} berhasil dihapus.`)
      }
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

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[#0B2147] tracking-tight">
            {isPrivileged ? 'Arsip Dokumen' : 'Dokumen Saya'}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isPrivileged
              ? `Daftar dokumen sesuai kewenangan ${userRole}.`
              : `Daftar dan status dokumen pengajuan Anda.`}
          </p>
        </div>

        <Button
          onClick={() => setCurrentView('tracking', 'new')}
          className="self-start sm:self-auto h-10 sm:h-11 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl gap-2 shadow-sm cursor-pointer px-4"
        >
          <Plus className="h-4 w-4" />
          <span>Ajukan Dokumen</span>
        </Button>
      </div>

      {/* Scope Filter for Privileged Roles (Kewenangan vs Dokumen Saya) */}
      {isPrivileged && (
        <div className="flex bg-[#F1F5F9] p-1 rounded-2xl gap-1 max-w-sm sm:max-w-md">
          <button
            onClick={() => setScopeFilter('all')}
            className={`flex-1 py-1.5 sm:py-2 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5 ${
              scopeFilter === 'all'
                ? 'bg-white text-[#163A70] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Semua Dokumen</span>
            <span className="rounded-full bg-[#EBF2FF] px-1.5 py-0.2 text-[9.5px] font-bold text-[#163A70]">
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setScopeFilter('mine')}
            className={`flex-1 py-1.5 sm:py-2 px-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1.5 ${
              scopeFilter === 'mine'
                ? 'bg-white text-[#163A70] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Dokumen Saya</span>
            <span className="rounded-full bg-[#EBF2FF] px-1.5 py-0.2 text-[9.5px] font-bold text-[#163A70]">
              {documents.filter((d) => isDocumentOwnerOrPic(user, d)).length}
            </span>
          </button>
        </div>
      )}

      {/* 3 Overview Metric Badges (3-Kolom Rapi di Mobile & Desktop) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-[#E2E8F0] shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#64748B] truncate">Diproses</div>
              <div className="text-lg sm:text-2xl font-black text-[#2563EB] mt-0.5">{inProgressCount}</div>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <FileCheck2 className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#64748B] truncate">Perlu Revisi</div>
              <div className="text-lg sm:text-2xl font-black text-[#D97706] mt-0.5">{revisionCount}</div>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
              <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#64748B] truncate">Final Sah</div>
              <div className="text-lg sm:text-2xl font-black text-[#059669] mt-0.5">{finalCount}</div>
            </div>
            <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Cari dokumen atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 sm:h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar pb-0.5">
            {['', 'Sedang Diproses', 'Perlu Revisi', 'Menunggu Persetujuan', 'Dokumen Final'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#163A70] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {st === '' ? 'Semua Status' : st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table Card (Desktop) & Mobile Cards (Phone) */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Pengajuan</th>
                  <th className="py-3.5 px-4">Nama Dokumen</th>
                  <th className="py-3.5 px-4">Kategori / Divisi</th>
                  <th className="py-3.5 px-4">Versi Aktif</th>
                  <th className="py-3.5 px-4">Status Alur</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                      Tidak ada dokumen yang sesuai dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const activeVersion = doc.versions?.length > 0
                      ? doc.versions[doc.versions.length - 1].version
                      : 'V0'
                    const statusLabel = getDocStatusLabel(doc)

                    return (
                      <tr key={doc._id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#163A70] whitespace-nowrap">
                          {doc.docNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A] line-clamp-1">{doc.name}</div>
                          <div className="text-[11px] text-[#64748B]">PIC: {doc.pic}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#334155]">{doc.category}</div>
                          <div className="text-[10px] text-[#94A3B8]">{doc.division}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              activeVersion === 'FINAL'
                                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                                : activeVersion === 'V0'
                                ? 'bg-[#F1F5F9] text-[#163A70] border border-[#CBD5E1]'
                                : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                            }`}
                          >
                            {activeVersion}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              statusLabel === 'Dokumen Final'
                                ? 'bg-[#ECFDF5] text-[#059669]'
                                : statusLabel === 'Perlu Revisi'
                                ? 'bg-[#FFFBEB] text-[#D97706]'
                                : statusLabel === 'Ditolak'
                                ? 'bg-[#FEF2F2] text-[#DC2626]'
                                : 'bg-[#EFF6FF] text-[#2563EB]'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={
                                doc.driveFolderUrl ||
                                `https://drive.google.com/drive/search?q=${encodeURIComponent(doc.docNumber)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-[#0F9D58] hover:bg-[#E6F4EA] cursor-pointer"
                              title="Buka Folder di Google Drive"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </a>
                            <a
                              href={`/api/documents/${doc._id}/sync-drive`}
                              download={`${doc.docNumber}_log_riwayat.txt`}
                              className="p-1.5 rounded-lg text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                              title="Unduh Log Riwayat Teks (.txt)"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => {
                                setSelectedDocNumber(doc.docNumber)
                                setCurrentView('tracking', 'progress')
                              }}
                              className="p-1.5 rounded-lg text-[#163A70] hover:bg-[#EBF2FF] cursor-pointer"
                              title="Lacak & Riwayat Revisi"
                            >
                              <GitPullRequestDraft className="h-4 w-4" />
                            </button>
                            {doc.contractEnd && !doc.noDuration && (
                              <button
                                onClick={() => {
                                  setSelectedDocNumber(doc.docNumber)
                                  setCurrentView('tracking', 'progress')
                                }}
                                className="p-1.5 rounded-lg text-[#D97706] hover:bg-[#FFFBEB] cursor-pointer"
                                title="Lacak Pengingat & Justifikasi Jatuh Tempo Kontrak"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setViewModalDoc(doc)}
                              className="p-1.5 rounded-lg text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                              title="Lihat Paket Dokumen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canUserEditDocument(user, doc) && (
                              <button
                                onClick={() => {
                                  setEditModalDoc(doc)
                                  setEditName(doc.name)
                                  setEditPic(doc.pic)
                                  setEditCategory(doc.category)
                                  setEditDivision(doc.division)
                                  setEditPriority(doc.priority === 'Critical' ? 'Urgent' : (doc.priority || 'Normal'))
                                  setEditNotes(doc.notes || '')
                                }}
                                className="p-1.5 rounded-lg text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                                title="Edit Data"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                            {canUserDeleteDocument(user, doc) && (
                              <button
                                onClick={() => handleDelete(doc)}
                                className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Feed */}
          <div className="block md:hidden divide-y divide-[#E2E8F0] bg-white">
            {filteredDocs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B] px-4">
                Tidak ada dokumen yang sesuai dengan pencarian atau filter.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const activeVersion = doc.versions?.length > 0
                  ? doc.versions[doc.versions.length - 1].version
                  : 'V0'
                const statusLabel = getDocStatusLabel(doc)

                return (
                  <div key={doc._id} className="p-4 space-y-3 hover:bg-[#F8FAFC]/70 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#163A70]">
                          {doc.docNumber}
                        </span>
                        <h3 className="font-bold text-sm text-[#0F172A] mt-0.5 leading-snug">
                          {doc.name}
                        </h3>
                      </div>
                      <span
                        className={`inline-block shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          statusLabel === 'Dokumen Final'
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : statusLabel === 'Perlu Revisi'
                            ? 'bg-[#FFFBEB] text-[#D97706]'
                            : statusLabel === 'Ditolak'
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-[#EFF6FF] text-[#2563EB]'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                      <Badge variant="outline" className="text-[10px] bg-[#F1F5F9] text-[#334155]">
                        {doc.category}
                      </Badge>
                      <span>•</span>
                      <span>PIC: <strong className="text-[#0F172A]">{doc.pic}</strong></span>
                      <span>•</span>
                      <span
                        className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          activeVersion === 'FINAL'
                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            : activeVersion === 'V0'
                            ? 'bg-[#F1F5F9] text-[#163A70] border border-[#CBD5E1]'
                            : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                        }`}
                      >
                        {activeVersion}
                      </span>
                    </div>

                    {/* Mobile Quick Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={
                            doc.driveFolderUrl ||
                            `https://drive.google.com/drive/search?q=${encodeURIComponent(doc.docNumber)}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-[#E6F4EA] text-[#0F9D58]"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Drive</span>
                        </a>
                        <button
                          onClick={() => setViewModalDoc(doc)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-[#F1F5F9] text-[#475569]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>
                        {canUserEditDocument(user, doc) && (
                          <button
                            onClick={() => {
                              setEditModalDoc(doc)
                              setEditName(doc.name)
                              setEditPic(doc.pic)
                              setEditCategory(doc.category)
                              setEditDivision(doc.division)
                              setEditPriority(doc.priority === 'Critical' ? 'Urgent' : (doc.priority || 'Normal'))
                              setEditNotes(doc.notes || '')
                            }}
                            className="flex items-center gap-1 text-xs font-semibold p-1.5 rounded-xl bg-[#F1F5F9] text-[#475569]"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canUserDeleteDocument(user, doc) && (
                          <button
                            onClick={() => handleDelete(doc)}
                            className="flex items-center gap-1 text-xs font-semibold p-1.5 rounded-xl bg-[#FEF2F2] text-[#DC2626]"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDocNumber(doc.docNumber)
                          setCurrentView('tracking', 'progress')
                        }}
                        className="h-8 text-xs bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-xl gap-1"
                      >
                        <GitPullRequestDraft className="h-3.5 w-3.5" />
                        <span>Lacak Alur</span>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Package Modal */}
      <Dialog open={!!viewModalDoc} onOpenChange={(open) => !open && setViewModalDoc(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#163A70]" />
              Paket Berkas — {viewModalDoc?.docNumber}
            </DialogTitle>
            <DialogDescription>{viewModalDoc?.name}</DialogDescription>
          </DialogHeader>

          {viewModalDoc && (
            <div className="space-y-4 pt-2">
              <div className="text-xs space-y-1 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <div><b>Kategori:</b> {viewModalDoc.category}</div>
                <div><b>Divisi:</b> {viewModalDoc.division}</div>
                <div><b>PIC:</b> {viewModalDoc.pic}</div>
                <div><b>Prioritas (Target SLA):</b> {viewModalDoc.priority === 'Urgent' || viewModalDoc.priority === 'Critical' ? 'Executive Fast-Track SLA (5 Hari Kerja)' : 'Standard Corporate SLA (10 Hari Kerja)'}</div>
                <div><b>Status:</b> {viewModalDoc.statusLabel || getDocStatusLabel(viewModalDoc)}</div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#0B2147] block mb-2">
                    Daftar Versi Berkas:
                  </span>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {viewModalDoc.versions?.map((ver, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#163A70] text-white">
                            {ver.version}
                          </span>
                          <span className="truncate font-semibold text-[#0F172A]">
                            {ver.file.originalName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewFile(viewModalDoc, ver.file)}
                            className="p-1 text-[#163A70] hover:bg-[#EBF2FF] rounded cursor-pointer"
                            title="Lihat / Buka Dokumen"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(viewModalDoc, ver.file)}
                            className="p-1 text-[#163A70] hover:bg-[#EBF2FF] rounded cursor-pointer"
                            title="Unduh Berkas"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const supportingList =
                    viewModalDoc.supportingDocuments && viewModalDoc.supportingDocuments.length > 0
                      ? viewModalDoc.supportingDocuments
                      : viewModalDoc.files && viewModalDoc.files.length > 1
                      ? viewModalDoc.files.slice(1)
                      : []

                  if (supportingList.length === 0) return null

                  return (
                    <div>
                      <span className="text-xs font-bold text-[#0B2147] block mb-2 flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-[#059669]" />
                        Dokumen Pendukung ({supportingList.length}):
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {supportingList.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-3.5 w-3.5 text-[#059669] shrink-0" />
                              <span className="truncate font-medium text-[#0F172A]">
                                {f.originalName || f.filename}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewFile(viewModalDoc, f)}
                                className="p-1 text-[#059669] hover:bg-[#ECFDF5] rounded cursor-pointer"
                                title="Lihat / Buka Lampiran"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(viewModalDoc, f)}
                                className="p-1 text-[#163A70] hover:bg-[#EBF2FF] rounded cursor-pointer"
                                title="Unduh Lampiran"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                if (viewModalDoc) {
                  setSelectedDocNumber(viewModalDoc.docNumber)
                  setViewModalDoc(null)
                  setCurrentView('tracking', 'progress')
                }
              }}
              className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs"
            >
              Lihat Riwayat Alur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModalDoc} onOpenChange={(open) => !open && setEditModalDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">
              Edit Dokumen — {editModalDoc?.docNumber}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama Dokumen</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kategori</Label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                >
                  <option value="Kontrak Hukum">Kontrak Hukum</option>
                  <option value="NDA">NDA</option>
                  <option value="MoU">MoU</option>
                  <option value="Legal Opinion / Analyst">Legal Opinion / Analyst</option>
                  <option value="Perizinan">Perizinan</option>
                  <option value="Surat Menyurat Resmi">Surat Menyurat Resmi</option>
                  <option value="Dokumen Lainnya">Dokumen Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tingkat Prioritas (Target SLA)</Label>
                <select
                  value={editPriority === 'Critical' ? 'Urgent' : editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] focus:border-[#163A70] focus:outline-none"
                >
                  <option value="Normal">Standard Corporate SLA (10 Hari Kerja)</option>
                  <option value="Urgent">Executive Fast-Track SLA (5 Hari Kerja)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Divisi</Label>
                <Input
                  value={editDivision}
                  onChange={(e) => setEditDivision(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">PIC</Label>
                <Input
                  value={editPic}
                  onChange={(e) => setEditPic(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Catatan</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="text-xs rounded-xl resize-none"
                placeholder="Catatan tambahan dokumen..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalDoc(null)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
