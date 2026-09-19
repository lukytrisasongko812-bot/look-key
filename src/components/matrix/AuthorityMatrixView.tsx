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
      title: 'Business Initiator',
      shortTitle: 'Requester',
      subtitle: 'Inisiator Dokumen',
      level: 'Tingkat 1 • Pemohon',
      badgeColor: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
      desc: 'Unit kerja atau inisiator bisnis operasional yang mengajukan draf permohonan dokumen dan kontrak kerja.',
      bullets: [
        'Membuat registrasi tiket dan unggah draf pengajuan awal (V0)',
        'Melihat & mengunduh seluruh berkas versi aktif dan lampiran',
        'Mengunggah draf penyesuaian jika menerima permohonan revisi',
      ],
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
      title: 'Legal & Compliance Reviewer',
      shortTitle: 'Reviewer',
      subtitle: 'Legal & Kepatuhan',
      level: 'Tingkat 2 • Penelaah',
      badgeColor: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      desc: 'Tim penelaah hukum dan kepatuhan yang menguji klausul, kesesuaian regulasi, serta memitigasi risiko hukum.',
      bullets: [
        'Uji kelayakan hukum & analisa kepatuhan klausul kontrak',
        'Memberikan catatan penelaahan pasal & permohonan revisi',
        'Mengesahkan tahapan review legal untuk diteruskan ke direksi',
      ],
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
      title: 'Executive Approver',
      shortTitle: 'Approver',
      subtitle: 'Direksi / Otorisator',
      level: 'Tingkat 3 • Otorisasi',
      badgeColor: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
      desc: 'Pimpinan manajemen dan direksi yang memegang wewenang otorisasi puncak dan eksekusi resmi perjanjian.',
      bullets: [
        'Otorisasi persetujuan eksekutif puncak (Approval Direksi)',
        'Penandatanganan resmi dokumen perjanjian dan kerja sama',
        'Otorisasi perpanjangan, adendum, atau terminasi jatuh tempo',
      ],
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
      title: 'Document Controller',
      shortTitle: 'Controller',
      subtitle: 'Tata Kelola Arsip',
      level: 'Tingkat 4 • Kustodian',
      badgeColor: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
      desc: 'Kustodian tata kelola arsip korporat, verifikator keabsahan tanda tangan, dan penguncian berkas final.',
      bullets: [
        'Verifikasi keabsahan tanda tangan sah seluruh pihak terkait',
        'Menerbitkan & mengunci Dokumen Final resmi (Status: FINAL)',
        'Tata kelola repositori cloud Google Drive & pantauan masa berlaku',
      ],
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
      title: 'System Administrator',
      shortTitle: 'Admin',
      subtitle: 'Sistem & Keamanan',
      level: 'Tingkat 5 • Superuser',
      badgeColor: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      desc: 'Penanggung jawab tata kelola sistem, manajemen hak akses pengguna, keamanan data, dan audit kepatuhan platform.',
      bullets: [
        'Manajemen pengguna, penetapan peran matriks, & audit trail',
        'Penerbitan link undangan resmi & pencabutan keanggotaan',
        'Tata kelola infrastruktur basis data & keamanan cloud platform',
      ],
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
    { key: 'createDoc', label: 'Ajukan Dokumen Baru (V0)', desc: 'Registrasi tiket dan unggah draf pengajuan awal', category: 'Fase 1: Inisiasi & Akses Berkas' },
    { key: 'viewDocs', label: 'Akses & Unduh Berkas', desc: 'Membaca dan mengunduh draf aktif serta seluruh lampiran pendukung', category: 'Fase 1: Inisiasi & Akses Berkas' },
    { key: 'addReviewNotes', label: 'Catatan & Telaah Klausul', desc: 'Memberikan feedback klausul hukum dan mitigasi risiko', category: 'Fase 2: Telaah Hukum & Kepatuhan' },
    { key: 'requestRevision', label: 'Permintaan Revisi Dokumen', desc: 'Mengembalikan draf ke inisiator untuk diperbaiki', category: 'Fase 2: Telaah Hukum & Kepatuhan' },
    { key: 'uploadRevision', label: 'Unggah Draf Revisi (Rev.01+)', desc: 'Mengunggah draf perbaikan versi penyesuaian', category: 'Fase 2: Telaah Hukum & Kepatuhan' },
    { key: 'approveStage', label: 'Persetujuan Tahapan (Approval)', desc: 'Otorisasi persetujuan telaah legal atau persetujuan direksi', category: 'Fase 3: Otorisasi & Keputusan' },
    { key: 'rejectDoc', label: 'Penolakan Pengajuan Dokumen', desc: 'Membatalkan pengajuan yang tidak memenuhi kriteria hukum/operasional', category: 'Fase 3: Otorisasi & Keputusan' },
    { key: 'manageExpiry', label: 'Keputusan Jatuh Tempo Kontrak', desc: 'Menetapkan perpanjangan (renewal), adendum, atau terminasi', category: 'Fase 3: Otorisasi & Keputusan' },
    { key: 'uploadFinal', label: 'Rilis Dokumen Final Sah (FINAL)', desc: 'Verifikasi tanda tangan lengkap dan mengunci arsip digital resmi', category: 'Fase 4: Tata Kelola & Sistem' },
    { key: 'manageUsers', label: 'Kelola Pengguna & Hak Akses', desc: 'Undang akun pengguna baru dan penetapan peran matriks', category: 'Fase 4: Tata Kelola & Sistem' },
    { key: 'deleteMembership', label: 'Hapus Keanggotaan Matriks', desc: 'Mencabut hak akses keanggotaan pengguna dari sistem', category: 'Fase 4: Tata Kelola & Sistem' },
    { key: 'manageDatabase', label: 'Manajemen Basis Data (Database)', desc: 'Pengelolaan penyimpanan cloud, pencadangan data, dan skema (Eksklusif Admin)', category: 'Fase 4: Tata Kelola & Sistem' },
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
            Struktur tata kelola wewenang standar korporat modern: pembagian tanggung jawab kerja dan hak akses operasional.
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
          <span className="font-bold">Ketentuan Matriks Kewenangan:</span> Seluruh dokumen dan berkas pengajuan dapat diakses, dilihat, dan diunduh oleh <b>Requester (Inisiator)</b> serta peran peninjau terkait. Akses langsung terhadap pengelolaan <b>Basis Data (Database)</b> dan konfigurasi master data sistem <b>dibatasi ketat hanya untuk Administrator</b>.
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
                    <th key={r.id} className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${r.badgeColor}`}>
                          {r.shortTitle}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-medium tracking-tight whitespace-nowrap">
                          {r.subtitle}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {operationalActions.map((act, index) => {
                  const isNewCategory = index === 0 || operationalActions[index - 1].category !== act.category
                  return (
                    <React.Fragment key={act.key}>
                      {isNewCategory && (
                        <tr className="bg-[#F8FAFC]/90 border-t border-b border-[#E2E8F0]">
                          <td colSpan={roles.length + 1} className="py-2 px-5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#163A70]">
                            {act.category}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-[#F8FAFC]/70 transition-colors">
                        <td className="py-3 px-5">
                          <div className="font-bold text-[#0F172A]">{act.label}</div>
                          <div className="text-[11px] text-[#64748B]">{act.desc}</div>
                        </td>
                        {roles.map((r) => {
                          const hasPerm = r.permissions[act.key as keyof typeof r.permissions]
                          return (
                            <td key={r.id} className="py-3 px-3 text-center">
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
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Cards Breakdown */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-bold font-display text-[#0B2147] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#163A70]" />
            Struktur Peran &amp; Tanggung Jawab Standar Korporat
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Pembagian tanggung jawab spesifik pada setiap tahapan tata kelola dokumen korporat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Card key={r.id} className="border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${r.badgeColor}`}>
                    {r.shortTitle}
                  </span>
                  <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                    {r.level}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0B2147]">
                    {r.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-[#1D4ED8] mt-0.5">
                    {r.subtitle}
                  </div>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs space-y-2">
                  <span className="font-bold text-[#0B2147] block text-[10.5px] uppercase tracking-wider text-[#163A70]">
                    Kewenangan &amp; Tanggung Jawab:
                  </span>
                  <ul className="space-y-1.5 text-[11.5px] text-[#475569]">
                    {r.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-snug">
                        <Check className="h-3.5 w-3.5 text-[#059669] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
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
                  {r.shortTitle} ({allUsers.filter((u) => u.role === r.id).length})
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
                                <option value="Requester">Requester — Inisiator Dokumen</option>
                                <option value="Reviewer">Reviewer — Legal &amp; Compliance</option>
                                <option value="Approver">Approver — Direksi &amp; Otorisasi</option>
                                <option value="Document Controller">Document Controller — Tata Kelola Arsip</option>
                                <option value="Administrator">Administrator — Sistem &amp; Keamanan</option>
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
