"use client"

import React, { useState, useEffect } from 'react'
import { useApp, UserRole } from '@/context/AppContext'
import { normalizeRole, isSystemAdmin, isBoardOfDirectors } from '@/lib/roles'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Mail,
  Briefcase,
  RefreshCw,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

export function UsersView() {
  const {
    user,
    token,
    allUsers,
    updateUserRole,
    deleteUser,
    fetchAllUsers,
    setCurrentView,
  } = useApp()

  const isAdmin = isSystemAdmin(user?.role) || isBoardOfDirectors(user?.role)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Delete User Confirmation Modal State
  const [deleteTargetUser, setDeleteTargetUser] = useState<typeof allUsers[0] | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePosition, setInvitePosition] = useState('Legal Officer')
  const [inviteDivision, setInviteDivision] = useState('Direktorat Legal & Compliance')
  const [inviteRole, setInviteRole] = useState<UserRole>('Legal Officer')
  const [invitePassword, setInvitePassword] = useState('Password123!')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Success Link Dialog
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
    }
  }, [fetchAllUsers, isAdmin])

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm text-center space-y-4 animate-in fade-in duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-display text-[#0B2147]">
            Akses Ditolak (403 Unauthorized)
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-sm mx-auto">
            Halaman Manajemen Pengguna dan Penetapan Hak Akses (RBAC) hanya dapat diakses oleh akun dengan peran <b>Administrator</b>.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => setCurrentView('dashboard')}
            className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const ok = await updateUserRole(userId, newRole)
    if (ok) {
      toast.success(`Hak akses pengguna berhasil diperbarui menjadi ${newRole}!`)
    } else {
      toast.error('Gagal mengubah hak akses peran.')
    }
  }

  const copyInvitationLink = (targetEmail: string) => {
    const link = `https://risetrack.id/?email=${encodeURIComponent(targetEmail)}&invited=true`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link)
      toast.success(`Link undangan untuk ${targetEmail} berhasil disalin!`)
    } else {
      toast.info(`Link: ${link}`)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return
    setDeleteLoading(true)
    const res = await deleteUser(deleteTargetUser.id)
    setDeleteLoading(false)

    if (res.success) {
      toast.success(`Keanggotaan ${deleteTargetUser.employeeName} (${deleteTargetUser.email}) berhasil dihapus!`)
      setDeleteTargetUser(null)
    } else {
      toast.error(res.error || 'Gagal menghapus pengguna.')
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Nama dan email wajib diisi.')
      return
    }

    setInviteLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeName: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          position: invitePosition.trim(),
          division: inviteDivision.trim(),
          role: inviteRole,
          password: invitePassword,
        }),
      })

      const data = await res.json()
      setInviteLoading(false)

      if (res.ok) {
        toast.success(`Undangan berhasil diterbitkan! Email notifikasi dan link aktivasi telah dikirim ke ${inviteEmail}.`)
        setIsInviteOpen(false)
        const link = `https://risetrack.id/?email=${encodeURIComponent(inviteEmail.trim().toLowerCase())}&invited=true`
        setCreatedInviteUrl(link)
        fetchAllUsers()

        // Reset form
        setInviteName('')
        setInviteEmail('')
        setInvitePassword('Password123!')
      } else {
        toast.error(data.error || 'Gagal menerbitkan undangan pengguna.')
      }
    } catch {
      setInviteLoading(false)
      toast.error('Terjadi kesalahan saat memproses undangan.')
    }
  }

  const rolesList: { id: UserRole; title: string; color: string }[] = [
    { id: 'Guest', title: 'Guest', color: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]' },
    { id: 'User', title: 'User', color: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' },
    { id: 'Legal Officer', title: 'Legal Officer', color: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' },
    { id: 'Legal Management', title: 'Legal Management', color: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]' },
    { id: 'Board of Directors', title: 'Board of Directors', color: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]' },
    { id: 'System Administrator', title: 'System Administrator', color: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' },
  ]

  const filteredUsers = allUsers.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      u.employeeName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.position.toLowerCase().includes(q) ||
      u.division.toLowerCase().includes(q)

    const matchesRole = roleFilter === 'ALL' || normalizeRole(u.role) === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0B2147]">
            Manajemen Pengguna &amp; Undangan Akun Resmi
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Pendaftaran pengguna sistem RIDE dilakukan secara privat melalui link undangan resmi ke Gmail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setCurrentView('matrix')}
            className="h-11 text-xs font-bold text-[#163A70] rounded-xl gap-2 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Matriks Kewenangan (RBAC)</span>
          </Button>

          <Button
            onClick={() => setIsInviteOpen(true)}
            className="h-11 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl shadow-md gap-2 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Undang Pengguna Baru</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {rolesList.map((r) => {
          const count = allUsers.filter((u) => normalizeRole(u.role) === r.id).length
          return (
            <Card key={r.id} className="border-[#E2E8F0] shadow-2xs">
              <CardContent className="p-3.5 flex flex-col justify-between">
                <span className={`self-start px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${r.color}`}>
                  {r.title}
                </span>
                <div className="text-2xl font-extrabold text-[#0B2147] mt-2">
                  {count} <span className="text-xs font-normal text-[#64748B]">Akun</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Cari nama, email, jabatan, atau divisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === 'ALL'
                  ? 'bg-[#163A70] text-white shadow-2xs'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              Semua Peran ({allUsers.length})
            </button>
            {rolesList.map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  roleFilter === r.id
                    ? 'bg-[#163A70] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {r.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Karyawan</th>
                  <th className="py-3.5 px-4">Email Terdaftar</th>
                  <th className="py-3.5 px-4">Divisi &amp; Jabatan</th>
                  <th className="py-3.5 px-4">Peran (Role RBAC)</th>
                  <th className="py-3.5 px-4 text-right">Link Undangan &amp; Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                      Tidak ada pengguna yang sesuai dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleInfo = rolesList.find((r) => r.id === normalizeRole(u.role)) || {
                      id: u.role,
                      title: u.role,
                      color: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
                    }

                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A]">{u.employeeName}</div>
                          <div className="text-[10px] text-[#059669] font-semibold flex items-center gap-1 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                            2FA Aktif
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#475569]">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0F172A]">{u.division}</div>
                          <div className="text-[11px] text-[#64748B]">{u.position}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={normalizeRole(u.role)}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="h-8 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2 text-xs font-bold text-[#0B2147] focus:border-[#163A70] focus:outline-none cursor-pointer"
                          >
                            <option value="Guest">Guest — Peninjau Tamu</option>
                            <option value="User">User — Unit Kerja Pemohon</option>
                            <option value="Legal Officer">Legal Officer — Staf Hukum &amp; Penelaah</option>
                            <option value="Legal Management">Legal Management — Tata Kelola &amp; Kustodian</option>
                            <option value="Board of Directors">Board of Directors — Dewan Direksi</option>
                            <option value="System Administrator">System Administrator — Kontrol Penuh Sistem</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationLink(u.email)}
                              className="h-8 text-xs font-bold text-[#163A70] border-[#BFDBFE] hover:bg-[#EBF2FF] rounded-lg gap-1.5 cursor-pointer"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Salin Link</span>
                            </Button>

                            {u.email.toLowerCase() !== user?.email?.toLowerCase() && u.id !== user?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteTargetUser(u)}
                                className="h-8 text-xs font-bold text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#B91C1C] rounded-lg px-2.5 cursor-pointer shadow-2xs"
                                title="Hapus Keanggotaan Pengguna"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
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
        </CardContent>
      </Card>

      {/* Invite User Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#163A70]" />
              Undang Pengguna Baru ke RIDE
            </DialogTitle>
            <DialogDescription>
              Akun baru akan dibuat dan tautan aktivasi langsung dikirimkan ke alamat email tujuan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama Lengkap Karyawan</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="misal: Hendra Wijaya"
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Gmail / Korporat</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nama@gmail.com atau nama@resourcesid.co.id"
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Divisi / Unit</Label>
                <Input
                  value={inviteDivision}
                  onChange={(e) => setInviteDivision(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Jabatan Resmi</Label>
                <Input
                  value={invitePosition}
                  onChange={(e) => setInvitePosition(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Peran (Role RBAC)</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full h-10 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-bold text-[#0B2147] focus:border-[#163A70] focus:outline-none"
              >
                <option value="Guest">Guest — Peninjau Tamu</option>
                <option value="User">User — Unit Kerja Pemohon</option>
                <option value="Legal Officer">Legal Officer — Staf Hukum &amp; Penelaah</option>
                <option value="Legal Management">Legal Management — Tata Kelola &amp; Kustodian</option>
                <option value="Board of Directors">Board of Directors — Dewan Direksi</option>
                <option value="System Administrator">System Administrator — Kontrol Penuh Sistem</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kata Sandi Awal Sementara</Label>
              <Input
                type="text"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                required
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={inviteLoading}
                className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold"
              >
                {inviteLoading ? 'Mengirim Undangan...' : 'Kirim Undangan Resmi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Link Modal */}
      <Dialog open={!!createdInviteUrl} onOpenChange={(open) => !open && setCreatedInviteUrl(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669] mb-2">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-[#0B2147]">
              Undangan Resmi Berhasil Dibuat!
            </DialogTitle>
            <DialogDescription className="text-center">
              Email telah dikirim melalui Resend. Anda juga dapat menyalin tautan undangan aktivasi berikut secara langsung:
            </DialogDescription>
          </DialogHeader>

          {createdInviteUrl && (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#0F172A] break-all select-all">
                {createdInviteUrl}
              </div>

              <Button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(createdInviteUrl)
                    toast.success('Link undangan aktivasi berhasil disalin!')
                  }
                  setCreatedInviteUrl(null)
                }}
                className="w-full bg-[#163A70] hover:bg-[#0B2147] text-white font-bold h-10 rounded-xl"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Salin Tautan Aktivasi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={!!deleteTargetUser} onOpenChange={(open) => !open && setDeleteTargetUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#DC2626] mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-[#0B2147]">
              Konfirmasi Hapus Keanggotaan Pengguna
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#64748B]">
              Tindakan ini akan menghapus akun dan seluruh hak akses keanggotaan pengguna dari sistem RIDE secara permanen.
            </DialogDescription>
          </DialogHeader>

          {deleteTargetUser && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Nama Lengkap:</span>
                <span className="font-bold text-[#0F172A]">{deleteTargetUser.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Email:</span>
                <span className="font-mono text-[#0F172A]">{deleteTargetUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Peran (Role):</span>
                <span className="font-bold text-[#DC2626]">{deleteTargetUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Divisi &amp; Jabatan:</span>
                <span className="text-[#0F172A]">{deleteTargetUser.division} · {deleteTargetUser.position}</span>
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
