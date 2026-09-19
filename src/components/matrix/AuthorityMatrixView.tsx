"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ShieldCheck,
  Check,
  Minus,
  Users,
  ShieldAlert,
  Trash2,
  UserX,
  UserPlus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { useApp, UserRole, UserProfile } from '@/context/AppContext'
import { toast } from 'sonner'

export function AuthorityMatrixView() {
  const {
    user,
    allUsers,
    fetchAllUsers,
    updateUserRole,
    deleteUser,
    setCurrentView,
  } = useApp()

  const isRequester = user?.role === 'Requester' || user?.role === 'User'
  const isAdmin = user?.role === 'Administrator' || user?.role === 'Director / BOD'

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL')
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
    }
  }, [fetchAllUsers, isAdmin])

  const roles = [
    {
      id: 'Requester',
      title: 'Pemohon',
      badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
      desc: 'Pengaju pengajuan dokumen dari unit kerja / divisi pemohon.',
      jobdesk: 'Membuat draf pengajuan awal (V0), melampirkan berkas pendukung, melihat & mengunduh seluruh dokumen, dan mengunggah perbaikan jika diminta revisi.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: false,
        requestRevision: false,
        uploadRevision: true,
        approveStage: false,
        rejectDoc: false,
        uploadFinal: false,
        manageExpiry: false,
        manageUsers: false,
        deleteMembership: false,
        manageDatabase: false,
      },
    },
    {
      id: 'Reviewer',
      title: 'Peninjau (Legal & Kepatuhan)',
      badgeColor: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      desc: 'Pemeriksa substansi hukum, kepatuhan klausul, dan kelayakan dokumen.',
      jobdesk: 'Memeriksa draf kontrak/perizinan, memberikan catatan revisi terperinci, mengunggah draf perbaikan (Rev.01, Rev.02), dan menyetujui tahapan peninjauan.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: true,
        approveStage: true,
        rejectDoc: true,
        uploadFinal: false,
        manageExpiry: true,
        manageUsers: false,
        deleteMembership: false,
        manageDatabase: false,
      },
    },
    {
      id: 'Approver',
      title: 'Penyetuju (Direksi / Kepala Unit)',
      badgeColor: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
      desc: 'Pemberi otorisasi puncak, persetujuan direksi, dan penandatanganan resmi.',
      jobdesk: 'Memberikan persetujuan akhir (Persetujuan Direksi), mengotorisasi perpanjangan atau terminasi kontrak jatuh tempo, dan tanda tangan resmi.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: false,
        approveStage: true,
        rejectDoc: true,
        uploadFinal: false,
        manageExpiry: true,
        manageUsers: false,
        deleteMembership: false,
        manageDatabase: false,
      },
    },
    {
      id: 'Document Controller',
      title: 'Pengendali Dokumen',
      badgeColor: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
      desc: 'Pengendali tata kelola dokumen, verifikator berkas final, dan pengarsipan.',
      jobdesk: 'Memverifikasi keabsahan dokumen bertandatangan lengkap, mengunggah Dokumen Final (FINAL), mengunci versi arsip sah, dan memantau masa berlaku.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: false,
        uploadRevision: true,
        approveStage: true,
        rejectDoc: true,
        uploadFinal: true,
        manageExpiry: true,
        manageUsers: false,
        deleteMembership: false,
        manageDatabase: false,
      },
    },
    {
      id: 'Administrator',
      title: 'Administrator Sistem',
      badgeColor: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
      desc: 'Pengelola sistem, arsitektur data, keamanan akses, dan manajemen pengguna.',
      jobdesk: 'Mengelola hak akses peran, menerbitkan link undangan pengguna ke Gmail, menghapus keanggotaan pengguna, mengontrol master data sistem, pemeliharaan basis data, dan mengawasi operasional.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: true,
        approveStage: true,
        rejectDoc: true,
        uploadFinal: true,
        manageExpiry: true,
        manageUsers: true,
        deleteMembership: true,
        manageDatabase: true,
      },
    },
  ]

  const operationalActions = [
    { key: 'createDoc', label: 'Ajukan Dokumen Baru (V0)', desc: 'Membuat nomor tiket dan unggah draf awal' },
    { key: 'viewDocs', label: 'Lihat & Unduh Dokumen', desc: 'Membaca dan mengunduh berkas versi aktif dan lampiran pendukung' },
    { key: 'addReviewNotes', label: 'Beri Catatan Revisi', desc: 'Menambahkan poin feedback per pasal/klausul' },
    { key: 'requestRevision', label: 'Minta Revisi Dokumen', desc: 'Mengembalikan status pengajuan untuk diperbaiki' },
    { key: 'uploadRevision', label: 'Unggah Revisi (Rev.01+)', desc: 'Mengunggah draf perbaikan versi baru' },
    { key: 'approveStage', label: 'Persetujuan / Pengesahan', desc: 'Menyetujui tahapan peninjauan legal atau persetujuan direksi' },
    { key: 'rejectDoc', label: 'Tolak Pengajuan Dokumen', desc: 'Membatalkan pengajuan yang tidak memenuhi syarat hukum/kualifikasi' },
    { key: 'uploadFinal', label: 'Unggah Dokumen Final (FINAL)', desc: 'Menerbitkan dan mengunci berkas final bertanda tangan' },
    { key: 'manageExpiry', label: 'Keputusan Jatuh Tempo', desc: 'Menetapkan perpanjangan atau terminasi kontrak' },
    { key: 'manageUsers', label: 'Kelola Pengguna & Hak Akses', desc: 'Undang akun, ubah peran, dan konfigurasi master sistem' },
    { key: 'deleteMembership', label: 'Hapus Keanggotaan Matriks', desc: 'Mencabut dan menghapus hak akses keanggotaan pengguna dari sistem' },
    { key: 'manageDatabase', label: 'Akses & Manajemen Basis Data (Database)', desc: 'Pengelolaan MongoDB, Google Drive store, pencadangan data, reset, dan skema (Hanya Administrator)' },
  ]

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const ok = await updateUserRole(userId, newRole)
    if (ok) {
      toast.success(`Hak akses matriks berhasil diperbarui menjadi ${newRole}!`)
    } else {
      toast.error('Gagal memperbarui peran matriks.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return
    setDeleteLoading(true)
    const res = await deleteUser(deleteTargetUser.id)
    setDeleteLoading(false)

    if (res.success) {
      toast.success(`Keanggotaan ${deleteTargetUser.employeeName} (${deleteTargetUser.email}) berhasil dihapus dari matriks!`)
      setDeleteTargetUser(null)
    } else {
      toast.error(res.error || 'Gagal menghapus keanggotaan pengguna.')
    }
  }

  const filteredMembers = allUsers.filter((u) => {
    if (selectedRoleFilter === 'ALL') return true
    return u.role === selectedRoleFilter
  })

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0B2147]">
            Matriks Kewenangan &amp; Otoritas (RBAC Matrix)
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Pemetaan hak akses operasional, pembagian tanggung jawab kerja (jobdesk), dan pengelolaan keanggotaan di sistem RIDE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#163A70] text-white py-1 px-3 text-xs">
            Peran Anda: {user?.role || 'Reviewer'}
          </Badge>
          {isAdmin && (
            <Button
              onClick={() => setCurrentView('users')}
              className="h-9 bg-[#EBF2FF] hover:bg-[#DBEAFE] text-[#163A70] text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Undang Anggota Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Authority Matrix Clarification Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start sm:items-center gap-3 ${
        isRequester
          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
      }`}>
        <ShieldCheck className={`h-5 w-5 shrink-0 mt-0.5 sm:mt-0 ${isRequester ? 'text-[#2563EB]' : 'text-[#163A70]'}`} />
        <div className="leading-relaxed">
          <span className="font-bold">Ketentuan Matriks Kewenangan:</span> Seluruh dokumen dan berkas pengajuan dapat diakses, dilihat, dan diunduh oleh <b>Pemohon (Requester)</b> serta peran peninjau terkait. Akses langsung terhadap pengelolaan <b>Basis Data (Database)</b> dan konfigurasi master data sistem <b>dibatasi ketat hanya untuk Administrator</b>.
        </div>
      </div>

      {/* Main Interactive Matrix Table Card */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-4 px-5 font-bold text-[#0B2147] text-xs w-1/3">
                    Aktivitas &amp; Hak Operasional
                  </th>
                  {roles.map((r) => (
                    <th key={r.id} className="py-4 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${r.badgeColor}`}>
                        {r.title.split(' ')[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {operationalActions.map((act) => (
                  <tr key={act.key} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#0F172A]">{act.label}</div>
                      <div className="text-[11px] text-[#64748B]">{act.desc}</div>
                    </td>
                    {roles.map((r) => {
                      const hasPerm = r.permissions[act.key as keyof typeof r.permissions]
                      return (
                        <td key={r.id} className="py-3.5 px-3 text-center">
                          {hasPerm ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                              <Minus className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Cards Breakdown */}
      <div>
        <h2 className="text-base font-bold font-display text-[#0B2147] mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#163A70]" />
          Deskripsi Tanggung Jawab &amp; Jobdesk Peran
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Card key={r.id} className="border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${r.badgeColor}`}>
                    {r.title}
                  </span>
                </div>

                <p className="text-xs text-[#0F172A] font-semibold">
                  {r.desc}
                </p>

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[11.5px] text-[#475569] space-y-1">
                  <span className="font-bold text-[#0B2147] block text-[11px] uppercase tracking-wider">
                    Tanggung Jawab Utama:
                  </span>
                  <div>{r.jobdesk}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Members Management in Authority Matrix (For Administrator / Superadmin) */}
      {isAdmin && (
        <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-display text-[#0B2147] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#163A70]" />
                Keanggotaan Pengguna dalam Matriks Kewenangan
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Administrator dapat mengatur peran atau menghapus keanggotaan pengguna dari sistem.
              </p>
            </div>

            {/* Filter by Role */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedRoleFilter === 'ALL'
                    ? 'bg-[#163A70] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                Semua Anggota ({allUsers.length})
              </button>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedRoleFilter === r.id
                      ? 'bg-[#163A70] text-white shadow-2xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {r.title.split(' ')[0]} ({allUsers.filter((u) => u.role === r.id).length})
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Anggota</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Divisi &amp; Jabatan</th>
                      <th className="py-3.5 px-4">Penetapan Matriks Peran</th>
                      <th className="py-3.5 px-4 text-right">Tindakan Otoritas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                          Tidak ada anggota terdaftar untuk kategori peran ini.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m) => {
                        const isSelf = m.email.toLowerCase() === user?.email?.toLowerCase() || m.id === user?.id

                        return (
                          <tr key={m.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                                <span>{m.employeeName}</span>
                                {isSelf && (
                                  <span className="rounded-md bg-[#EFF6FF] text-[#2563EB] text-[10px] font-extrabold px-1.5 py-0.2 border border-[#BFDBFE]">
                                    Akun Anda
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[#475569]">
                              {m.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#0F172A]">{m.division}</div>
                              <div className="text-[11px] text-[#64748B]">{m.position}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={m.role}
                                onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                                className="h-8 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2 text-xs font-bold text-[#0B2147] focus:border-[#163A70] focus:outline-none cursor-pointer"
                              >
                                <option value="Requester">Pemohon (Requester)</option>
                                <option value="Reviewer">Peninjau (Reviewer)</option>
                                <option value="Approver">Penyetuju (Approver)</option>
                                <option value="Document Controller">Pengendali Dokumen</option>
                                <option value="Administrator">Administrator Sistem</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <span className="text-[11px] text-[#94A3B8] italic font-medium">
                                  Akun Aktif Sesi
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeleteTargetUser(m)}
                                  className="h-8 text-xs font-bold text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#B91C1C] rounded-lg gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus Keanggotaan</span>
                                </Button>
                              )}
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
        </div>
      )}

      {/* Delete Membership Confirmation Modal */}
      <Dialog open={!!deleteTargetUser} onOpenChange={(open) => !open && setDeleteTargetUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626] mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-[#0B2147]">
              Konfirmasi Hapus Keanggotaan Matriks
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#64748B]">
              Tindakan ini akan menghapus akun dan seluruh hak akses keanggotaan pengguna dari sistem RIDE secara permanen.
            </DialogDescription>
          </DialogHeader>

          {deleteTargetUser && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Nama Anggota:</span>
                <span className="font-bold text-[#0F172A]">{deleteTargetUser.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Email:</span>
                <span className="font-mono text-[#0F172A]">{deleteTargetUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Peran Matriks:</span>
                <span className="font-bold text-[#DC2626]">{deleteTargetUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Divisi:</span>
                <span className="text-[#0F172A]">{deleteTargetUser.division}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTargetUser(null)}
              className="h-10 text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
              className="h-10 text-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Keanggotaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
