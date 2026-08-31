"use client"

import React, { useState } from 'react'
import { useApp, DocumentItem } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
} from 'lucide-react'
import { toast } from 'sonner'

export function MyDocumentsView() {
  const {
    documents,
    searchQuery,
    setSearchQuery,
    setCurrentView,
    setSelectedDocNumber,
    updateDocument,
    deleteDocument,
  } = useApp()

  const [statusFilter, setStatusFilter] = useState('')
  const [viewModalDoc, setViewModalDoc] = useState<DocumentItem | null>(null)
  const [editModalDoc, setEditModalDoc] = useState<DocumentItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editPic, setEditPic] = useState('')

  const getDocStatusLabel = (doc: DocumentItem) => {
    if (doc.rejected) return 'Ditolak'
    if (doc.revisionRequested) return 'Perlu Revisi'
    if (doc.stage <= 2) return 'Sedang Diproses'
    if (doc.stage === 3 || doc.stage === 4) return 'Menunggu Persetujuan'
    return 'Dokumen Final'
  }

  const filteredDocs = documents.filter((doc) => {
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
  const inProgressCount = documents.filter((d) => !d.rejected && d.stage < 5 && !d.revisionRequested).length
  const revisionCount = documents.filter((d) => d.revisionRequested && !d.rejected).length
  const finalCount = documents.filter((d) => d.stage >= 5 || d.stageStatus === 'completed').length

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalDoc) return
    const ok = await updateDocument(editModalDoc._id, { name: editName, pic: editPic })
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0B2147]">
            Dokumen Saya (Daftar Bundel Pengajuan)
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Daftar seluruh berkas per nomor pengajuan RIDE dengan inspeksi versi, draf perbaikan, dan berkas final.
          </p>
        </div>

        <Button
          onClick={() => setCurrentView('tracking', 'new')}
          className="self-start sm:self-auto h-11 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl gap-2 shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Ajukan Dokumen Baru</span>
        </Button>
      </div>

      {/* 3 Overview Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B]">Sedang Diproses</div>
              <div className="text-2xl font-extrabold text-[#2563EB]">{inProgressCount}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B]">Perlu Revisi</div>
              <div className="text-2xl font-extrabold text-[#D97706]">{revisionCount}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B]">Dokumen Final Sah</div>
              <div className="text-2xl font-extrabold text-[#059669]">{finalCount}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
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
              placeholder="Cari nomor tiket, nama dokumen, PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['', 'Sedang Diproses', 'Perlu Revisi', 'Menunggu Persetujuan', 'Dokumen Final'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#163A70] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {st === '' ? 'Semua Dokumen' : st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table Card */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                            <button
                              onClick={() => setViewModalDoc(doc)}
                              className="p-1.5 rounded-lg text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                              title="Lihat Paket Dokumen"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditModalDoc(doc)
                                setEditName(doc.name)
                                setEditPic(doc.pic)
                              }}
                              className="p-1.5 rounded-lg text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                              title="Edit Data"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc)}
                              className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
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
                <div><b>Status:</b> {viewModalDoc.statusLabel || getDocStatusLabel(viewModalDoc)}</div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#0B2147] block mb-2">
                  Daftar Versi Berkas:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto">
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
                      <a
                        href={ver.file.url}
                        download={ver.file.originalName}
                        className="p-1 text-[#163A70] hover:bg-[#EBF2FF] rounded cursor-pointer"
                        title="Unduh"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
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
              Buka di Halaman Tracking &amp; Riwayat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModalDoc} onOpenChange={(open) => !open && setEditModalDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">
              Edit Pengajuan — {editModalDoc?.docNumber}
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

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Penanggung Jawab (PIC)</Label>
              <Input
                value={editPic}
                onChange={(e) => setEditPic(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalDoc(null)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
