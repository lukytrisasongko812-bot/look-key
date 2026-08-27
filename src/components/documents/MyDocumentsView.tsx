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
} from 'lucide-react'
import { toast } from 'sonner'

const STAGE_LABELS: Record<number, string> = {
  0: 'Submitted',
  1: 'Review',
  2: 'Legal Drafting',
  3: 'Legal Approval',
  4: 'BOD Approval / Signed',
  5: 'Archived',
  6: 'Expired / Renewal',
}

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
    if (doc.rejected) return 'Rejected'
    if (doc.revisionRequested) return 'Revision Needed'
    if (doc.stage <= 1) return 'Review'
    if (doc.stage === 2) return 'Legal Drafting'
    if (doc.stage === 3 || doc.stage === 4) return 'Waiting Approval'
    if (doc.stage === 5) return 'Completed'
    return 'Archived'
  }

  const getDocBadgeVariant = (doc: DocumentItem) => {
    if (doc.rejected) return 'destructive'
    if (doc.revisionRequested) return 'warning'
    if (doc.stage <= 2) return 'secondary'
    if (doc.stage <= 4) return 'default'
    return 'success'
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
  const inProgressCount = documents.filter((d) => !d.rejected && d.stage < 5).length
  const attentionCount = documents.filter((d) => d.rejected || d.revisionRequested).length
  const archivedCount = documents.filter((d) => d.stage >= 5).length

  // Download metadata as text file
  const handleDownload = (doc: DocumentItem) => {
    const content = `RISE — Resources Integrated System for Efficiency
Shared Service Center of MIND ID

Document Number : ${doc.docNumber}
Document Name   : ${doc.name}
Category        : ${doc.category}
Division        : ${doc.division}
Priority        : ${doc.priority}
Confidentiality : ${doc.confidentiality}
Responsible PIC : ${doc.pic}
Current Stage   : ${STAGE_LABELS[doc.stage]}
Last Updated    : ${new Date(doc.updatedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}
Status          : ${getDocStatusLabel(doc)}
Contract Start  : ${doc.contractStart ? new Date(doc.contractStart).toLocaleDateString('en-GB') : 'N/A'}
Contract End    : ${doc.contractEnd ? new Date(doc.contractEnd).toLocaleDateString('en-GB') : 'N/A'}
${doc.decision ? `Decision        : ${doc.decision.type.toUpperCase()} (${doc.decision.justification})` : ''}

Generated automatically from RISE Local MongoDB Platform.`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.docNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle Edit Save
  const handleEditSave = async () => {
    if (!editModalDoc) return
    const ok = await updateDocument(editModalDoc._id, {
      name: editName,
      pic: editPic,
    })
    if (ok) {
      toast.success(`Dokumen ${editModalDoc.docNumber} berhasil diperbarui di MongoDB!`)
    } else {
      toast.error('Gagal memperbarui dokumen.')
    }
    setEditModalDoc(null)
  }

  // Handle Delete
  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permanen dokumen ${doc.docNumber} (${doc.name}) dari MongoDB?`)) {
      return
    }
    const ok = await deleteDocument(doc._id)
    if (ok) {
      toast.success(`Dokumen ${doc.docNumber} berhasil dihapus dari database.`)
    } else {
      toast.error('Gagal menghapus dokumen.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">My Documents</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Daftar seluruh berkas perizinan dan kontrak yang Anda kelola di lingkungan grup MIND ID.
        </p>
      </div>

      {/* Mini Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#163A70]">
            <Inbox className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Total Arsip</span>
            <div className="text-lg font-extrabold text-[#0B2147]">{documents.length}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Dalam Proses</span>
            <div className="text-lg font-extrabold text-[#0B2147]">{inProgressCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFFBEB] text-[#D97706]">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Perlu Perhatian</span>
            <div className="text-lg font-extrabold text-[#0B2147]">{attentionCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669]">
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Tereksekusi</span>
            <div className="text-lg font-extrabold text-[#0B2147]">{archivedCount}</div>
          </div>
        </div>
      </div>

      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input
                type="text"
                placeholder="Cari nomor dokumen, kontrak, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A]"
              >
                <option value="">Semua Status</option>
                <option>Review</option>
                <option>Legal Drafting</option>
                <option>Waiting Approval</option>
                <option>Revision Needed</option>
                <option>Rejected</option>
                <option>Completed</option>
                <option>Archived</option>
              </select>

              <Button
                onClick={() => setCurrentView('tracking', 'new')}
                className="h-11 text-xs font-bold bg-[#163A70] hover:bg-[#0B2147] rounded-xl px-4"
              >
                <Plus className="h-4 w-4 mr-1" /> Pengajuan Baru
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-display">No. Dokumen</th>
                  <th className="py-3.5 px-4 font-display">Nama Dokumen / Perjanjian</th>
                  <th className="py-3.5 px-4 font-display">Kategori</th>
                  <th className="py-3.5 px-4 font-display">Status Approval</th>
                  <th className="py-3.5 px-4 font-display">PIC Legal</th>
                  <th className="py-3.5 px-4 font-display">Terakhir Diperbarui</th>
                  <th className="py-3.5 px-4 font-display text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#64748B]">
                      Tidak ada dokumen yang cocok dengan filter atau kata kunci Anda.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const statusText = getDocStatusLabel(doc)
                    const badgeVariant = getDocBadgeVariant(doc)

                    return (
                      <tr
                        key={doc._id}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-[#163A70] whitespace-nowrap">
                          {doc.docNumber}
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#0F172A] max-w-xs truncate">
                          {doc.name}
                        </td>
                        <td className="py-4 px-4 text-[#64748B] whitespace-nowrap">
                          {doc.category}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <Badge variant={badgeVariant} className="text-[11px] font-bold px-2.5 py-0.5">
                            {statusText}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-[#0F172A] font-medium whitespace-nowrap">
                          {doc.pic}
                        </td>
                        <td className="py-4 px-4 text-[#64748B] whitespace-nowrap">
                          {new Date(doc.updatedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewModalDoc(doc)}
                              title="Lihat Rincian Dokumen"
                              className="rounded-lg p-2 text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditModalDoc(doc)
                                setEditName(doc.name)
                                setEditPic(doc.pic)
                              }}
                              title="Ubah Metadata"
                              className="rounded-lg p-2 text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              title="Download Ringkasan (.txt)"
                              className="rounded-lg p-2 text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocNumber(doc.docNumber)
                                setCurrentView('tracking', 'progress')
                              }}
                              title="Buka di Alur Tracking"
                              className="rounded-lg p-2 text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
                            >
                              <GitPullRequestDraft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc)}
                              title="Hapus Dokumen"
                              className="rounded-lg p-2 text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
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

      {/* View Details Modal */}
      <Dialog open={!!viewModalDoc} onOpenChange={(open) => !open && setViewModalDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">{viewModalDoc?.docNumber}</DialogTitle>
            <DialogDescription>{viewModalDoc?.name}</DialogDescription>
          </DialogHeader>

          {viewModalDoc && (
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Kategori</span>
                <span className="font-bold text-[#0F172A]">{viewModalDoc.category}</span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Divisi Pemohon</span>
                <span className="font-bold text-[#0F172A]">{viewModalDoc.division}</span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">PIC Penanggung Jawab</span>
                <span className="font-bold text-[#0F172A]">{viewModalDoc.pic}</span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Tahapan Saat Ini</span>
                <span className="font-bold text-[#163A70]">
                  {STAGE_LABELS[viewModalDoc.stage]}
                </span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Prioritas / Akses</span>
                <span className="font-bold text-[#0F172A]">
                  {viewModalDoc.priority} · {viewModalDoc.confidentiality}
                </span>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] p-2.5 border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[11px]">Status</span>
                <Badge variant={getDocBadgeVariant(viewModalDoc)} className="mt-0.5">
                  {getDocStatusLabel(viewModalDoc)}
                </Badge>
              </div>
              {viewModalDoc.notes && (
                <div className="col-span-2 rounded-lg bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Catatan / Informasi Pendukung</span>
                  <p className="text-[#0F172A] mt-1">{viewModalDoc.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setViewModalDoc(null)}>
              Tutup
            </Button>
            <Button
              className="bg-[#163A70] font-bold"
              onClick={() => {
                if (viewModalDoc) {
                  setSelectedDocNumber(viewModalDoc.docNumber)
                  setViewModalDoc(null)
                  setCurrentView('tracking', 'progress')
                }
              }}
            >
              Buka di Tracking Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModalDoc} onOpenChange={(open) => !open && setEditModalDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">Ubah Data — {editModalDoc?.docNumber}</DialogTitle>
            <DialogDescription>Perbarui nama dokumen dan penanggung jawab legal langsung di database MongoDB.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label>Nama Dokumen / Kontrak</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-11 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>PIC (Person in Charge)</Label>
              <Input
                value={editPic}
                onChange={(e) => setEditPic(e.target.value)}
                required
                className="h-11 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditModalDoc(null)}>
              Batal
            </Button>
            <Button onClick={handleEditSave} className="bg-[#163A70] font-bold">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
