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
import { normalizeRole, canAccessAuthorityMatrix } from '@/lib/roles'
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

  const currentRole = normalizeRole(user?.role)
  const isRequester = currentRole === 'User' || currentRole === 'Guest'
  const isAdmin = currentRole === 'System Administrator' || currentRole === 'Board of Directors'
  const hasAccess = canAccessAuthorityMatrix(user?.role)

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL')
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (isAdmin && hasAccess) {
      fetchAllUsers()
    }
  }, [fetchAllUsers, isAdmin, hasAccess])

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm text-center space-y-4 animate-in fade-in duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-display text-[#0B2147]">
            Akses Terbatas
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto">
            Matriks Kewenangan hanya dapat diakses oleh peran <b>Legal Management</b> ke atas.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => setCurrentView('dashboard')}
            className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    )
  }

  const roles = [
    {
      id: 'Guest',
      title: 'Guest',
      shortTitle: 'Guest',
      subtitle: 'Peninjau Tamu',
      level: 'Tingkat 0 • Tamu',
      badgeColor: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
      desc: 'Peninjau tamu dengan hak penelusuran status berkas tanpa hak modifikasi.',
      bullets: [
        'Melihat status berkas publik',
        'Pratinjau berkas terbatas',
        'Tanpa wewenang telaah atau persetujuan',
      ],
      permissions: {
        createDoc: false,
        viewDocs: true,
        addReviewNotes: false,
        requestRevision: false,
        uploadRevision: false,
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
      id: 'User',
      title: 'User',
      shortTitle: 'User',
      subtitle: 'Unit Kerja Pemohon',
      level: 'Tingkat 1 • Pemohon',
      badgeColor: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
      desc: 'Unit kerja pemohon yang mengajukan draf dokumen, kontrak, dan pengadaan.',
      bullets: [
        'Mengajukan draf awal (V0)',
        'Melihat & mengunduh berkas aktif',
        'Mengunggah draf perbaikan/revisi',
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
      id: 'Legal Officer',
      title: 'Legal Officer',
      shortTitle: 'Legal Officer',
      subtitle: 'Staf Hukum & Penelaah',
      level: 'Tingkat 2 • Staf Legal',
      badgeColor: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      desc: 'Staf hukum yang menelaah klausul, kepatuhan regulasi, dan mitigasi risiko.',
      bullets: [
        'Telaah klausul & regulasi',
        'Memberikan catatan telaah resmi',
        'Meminta revisi kepada pemohon',
      ],
      permissions: {
        createDoc: false,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: false,
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
      id: 'Legal Management',
      title: 'Legal Management',
      shortTitle: 'Legal Mgmt',
      subtitle: 'Tata Kelola & Kustodian',
      level: 'Tingkat 3 • Manajemen Legal',
      badgeColor: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
      desc: 'Pimpinan unit legal yang memverifikasi naskah final dan mengelola masa berlaku.',
      bullets: [
        'Verifikasi telaah sebelum ke Direksi',
        'Kustodian naskah final resmi',
        'Pengendalian jatuh tempo kontrak',
      ],
      permissions: {
        createDoc: false,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: false,
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
      id: 'Board of Directors',
      title: 'Board of Directors',
      shortTitle: 'BOD / Direksi',
      subtitle: 'Dewan Direksi & Otorisasi',
      level: 'Tingkat 4 • Otorisator',
      badgeColor: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
      desc: 'Dewan Direksi dengan kewenangan otorisasi eksekutif dan persetujuan akhir.',
      bullets: [
        'Otorisasi persetujuan akhir',
        'Penolakan dokumen dengan justifikasi',
        'Akses seluruh arsip & riwayat',
      ],
      permissions: {
        createDoc: false,
        viewDocs: true,
        addReviewNotes: false,
        requestRevision: true,
        uploadRevision: false,
        approveStage: true,
        rejectDoc: true,
        uploadFinal: false,
        manageExpiry: false,
        manageUsers: false,
        deleteMembership: false,
        manageDatabase: false,
      },
    },
    {
      id: 'System Administrator',
      title: 'System Administrator',
      shortTitle: 'SysAdmin',
      subtitle: 'Sistem, Keamanan & Akses',
      level: 'Tingkat 5 • Superuser',
      badgeColor: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      desc: 'Pengelola sistem, keamanan akun, peran pengguna, dan basis data.',
      bullets: [
        'Kontrol penuh peran & akses',
        'Kelola akun & undangan resmi',
        'Pemeliharaan data & integrasi Drive',
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
    { key: 'createDoc', label: 'Ajukan Dokumen (V0)', desc: 'Pendaftaran berkas draf awal', category: '1. Inisiasi & Akses' },
    { key: 'viewDocs', label: 'Akses & Unduh Berkas', desc: 'Melihat dan mengunduh berkas aktif & lampiran', category: '1. Inisiasi & Akses' },
    { key: 'addReviewNotes', label: 'Catatan Telaah', desc: 'Memberikan catatan telaah hukum', category: '2. Telaah Hukum' },
    { key: 'requestRevision', label: 'Permintaan Revisi', desc: 'Mengembalikan berkas untuk perbaikan', category: '2. Telaah Hukum' },
    { key: 'uploadRevision', label: 'Unggah Revisi (Rev.01+)', desc: 'Mengunggah berkas perbaikan', category: '2. Telaah Hukum' },
    { key: 'approveStage', label: 'Persetujuan Tahapan', desc: 'Otorisasi persetujuan telaah atau direksi', category: '3. Otorisasi & Keputusan' },
    { key: 'rejectDoc', label: 'Penolakan Dokumen', desc: 'Menolak pengajuan yang tidak sesuai', category: '3. Otorisasi & Keputusan' },
    { key: 'manageExpiry', label: 'Keputusan Jatuh Tempo', desc: 'Perpanjangan, adendum, atau terminasi kontrak', category: '3. Otorisasi & Keputusan' },
    { key: 'uploadFinal', label: 'Rilis Dokumen Final', desc: 'Mengunggah berkas final bertanda tangan', category: '4. Tata Kelola & Sistem' },
    { key: 'manageUsers', label: 'Kelola Pengguna', desc: 'Undang pengguna dan atur peran', category: '4. Tata Kelola & Sistem' },
    { key: 'deleteMembership', label: 'Hapus Keanggotaan', desc: 'Mencabut akses akun dari sistem', category: '4. Tata Kelola & Sistem' },
    { key: 'manageDatabase', label: 'Manajemen Basis Data', desc: 'Kelola data & penyimpanan cloud (Eksklusif Admin)', category: '4. Tata Kelola & Sistem' },
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
    return normalizeRole(u.role) === selectedRoleFilter
  })

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0B2147]">
            Matriks Kewenangan
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Hak akses dan wewenang operasional 6 peran resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#163A70] text-white py-1 px-3 text-xs">
            Peran Anda: {normalizeRole(user?.role)}
          </Badge>
          {isAdmin && (
            <Button
              onClick={() => setCurrentView('users')}
              className="h-9 bg-[#EBF2FF] hover:bg-[#DBEAFE] text-[#163A70] text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Undang Pengguna</span>
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
          <span className="font-bold">Ketentuan Matriks:</span> Seluruh berkas dapat diakses dan diunduh oleh <b>User</b> dan verifikator. Tamu (<b>Guest</b>) hanya pratinjau baca. Pengelolaan sistem eksklusif untuk <b>System Administrator</b>.
        </div>
      </div>

      {/* Main Interactive Matrix Table Card */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-4 px-5 font-bold text-[#0B2147] text-xs w-1/3">
                    Aktivitas &amp; Wewenang
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
            Daftar Peran &amp; Tanggung Jawab
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Rincian wewenang setiap peran di sistem RIDE.
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
                    Kewenangan:
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
                Daftar Anggota Matriks
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Atur peran atau hapus keanggotaan pengguna.
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
                Semua ({allUsers.length})
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
                  {r.shortTitle} ({allUsers.filter((u) => normalizeRole(u.role) === r.id).length})
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
                      <th className="py-3.5 px-4">Nama</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Divisi &amp; Jabatan</th>
                      <th className="py-3.5 px-4">Peran Matriks</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                          Tidak ada pengguna di kategori ini.
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
                                value={normalizeRole(m.role)}
                                onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                                className="h-8 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2 text-xs font-bold text-[#0B2147] focus:border-[#163A70] focus:outline-none cursor-pointer"
                              >
                                <option value="Guest">Guest</option>
                                <option value="User">User</option>
                                <option value="Legal Officer">Legal Officer</option>
                                <option value="Legal Management">Legal Management</option>
                                <option value="Board of Directors">Board of Directors</option>
                                <option value="System Administrator">System Administrator</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <span className="text-[11px] text-[#94A3B8] italic font-medium">
                                  Akun Anda
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeleteTargetUser(m)}
                                  className="h-8 text-xs font-bold text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#B91C1C] rounded-lg gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus</span>
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
              Konfirmasi Hapus Pengguna
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#64748B]">
              Akun dan hak akses pengguna ini akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>

          {deleteTargetUser && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Nama:</span>
                <span className="font-bold text-[#0F172A]">{deleteTargetUser.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Email:</span>
                <span className="font-mono text-[#0F172A]">{deleteTargetUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Peran:</span>
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
              {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
