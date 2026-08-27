"use client"

import React, { useState, useEffect } from 'react'
import { useApp, UserRole } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Database,
  ShieldCheck,
  Bell,
  RotateCcw,
  Users,
  UserPlus,
  Sparkles,
  Check,
  Minus,
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsView() {
  const {
    user,
    token,
    allUsers,
    updateUserRole,
    fetchDocuments,
    fetchAllUsers,
  } = useApp()

  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [dbHost, setDbHost] = useState('mongodb://127.0.0.1:27017/rise_db')
  const [emailNotif, setEmailNotif] = useState(true)
  const [waNotif, setWaNotif] = useState(true)
  const [reminderNotif, setReminderNotif] = useState(true)
  const [reseedLoading, setReseedLoading] = useState(false)

  // Invite User Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePosition, setInvitePosition] = useState('Legal Officer')
  const [inviteDivision, setInviteDivision] = useState('Direktorat Umum')
  const [inviteRole, setInviteRole] = useState<UserRole>('Legal Officer')
  const [invitePassword, setInvitePassword] = useState('Password123!')
  const [inviteLoading, setInviteLoading] = useState(false)

  const checkDb = async () => {
    setDbStatus('checking')
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      if (res.ok && data.database === 'connected') {
        setDbStatus('connected')
        toast.success('Koneksi MongoDB lokal aktif!')
      } else {
        setDbStatus('error')
        toast.error('Gagal terhubung ke MongoDB lokal.')
      }
    } catch {
      setDbStatus('error')
      toast.error('Gagal terhubung ke endpoint health.')
    }
  }

  useEffect(() => {
    checkDb()
    fetchAllUsers()
  }, [fetchAllUsers])

  const handleReseed = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset seluruh data dokumen dan akun ke kondisi default?')) return
    setReseedLoading(true)
    try {
      const res = await fetch('/api/seed?force=true')
      if (res.ok) {
        await fetchDocuments()
        await fetchAllUsers()
        toast.success('Database MongoDB lokal berhasil di-reseed!')
      } else {
        toast.error('Gagal mereset database.')
      }
    } catch {
      toast.error('Reseed error.')
    } finally {
      setReseedLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const ok = await updateUserRole(userId, newRole)
    if (ok) {
      toast.success(`Hak akses pengguna berhasil diperbarui menjadi ${newRole} di MongoDB!`)
    } else {
      toast.error('Gagal mengubah hak akses peran.')
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
          email: inviteEmail.trim(),
          position: invitePosition.trim() || 'Legal Officer',
          division: inviteDivision,
          role: inviteRole,
          password: invitePassword || 'Password123!',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Undangan berhasil dikirimkan ke ${inviteEmail}!`)
        setIsInviteOpen(false)
        setInviteName('')
        setInviteEmail('')
        setInvitePosition('Legal Officer')
        await fetchAllUsers()
      } else {
        toast.error(data.error || 'Gagal mengundang pengguna baru.')
      }
    } catch {
      toast.error('Gagal terhubung ke server untuk mengirim undangan.')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">Settings &amp; Manajemen Pengguna</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Konfigurasi konektivitas MongoDB lokal, manajemen hak akses peran pengguna real-time, serta preferensi notifikasi korporat.
        </p>
      </div>

      {/* Database Connection Card */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2FF] text-[#163A70]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-[#0B2147]">
                  Koneksi MongoDB Lokal
                </h2>
                <p className="text-xs text-[#64748B]">
                  Layanan database MongoDB yang terhubung pada sistem backend RISE.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
              </span>
              <span className="text-xs font-bold text-[#10B981]">Active &amp; Persistent</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label>MongoDB Connection URI</Label>
            <Input value={dbHost} onChange={(e) => setDbHost(e.target.value)} disabled className="bg-[#F8FAFC] h-11 text-xs font-mono" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={checkDb} className="text-xs h-9 rounded-xl">
                Tes Koneksi
              </Button>
              <Badge
                variant={
                  dbStatus === 'connected'
                    ? 'success'
                    : dbStatus === 'checking'
                    ? 'secondary'
                    : 'destructive'
                }
                className="text-xs font-bold py-1 px-2.5"
              >
                {dbStatus === 'connected'
                  ? 'Connected · 127.0.0.1:27017'
                  : dbStatus === 'checking'
                  ? 'Memeriksa status...'
                  : 'Gagal terhubung'}
              </Badge>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReseed}
              disabled={reseedLoading}
              className="text-xs text-[#D97706] border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] h-9 rounded-xl font-semibold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {reseedLoading ? 'Mereset database...' : 'Reseed Data Awal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real User & Role Management Table in MongoDB */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-[#0B2147]">
                  Manajemen Pengguna &amp; Peran (Real Database RBAC)
                </h2>
                <p className="text-xs text-[#64748B]">
                  Kelola hak akses pengguna resmi yang terdaftar langsung di koleksi MongoDB `users`.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-[#163A70]">
                Akun Anda: {user?.role || 'Legal Officer'}
              </Badge>
              {(user?.role === 'Administrator' || user?.role === 'Director / BOD') && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteOpen(true)}
                  className="bg-[#059669] hover:bg-[#047857] text-white font-bold h-8 text-xs gap-1.5 rounded-lg cursor-pointer shadow-2xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Undang Pengguna
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Karyawan</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Divisi / Posisi</th>
                  <th className="py-3 px-4">Peran (Role RBAC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[#64748B]">
                      Memuat data pengguna dari MongoDB...
                    </td>
                  </tr>
                ) : (
                  allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-bold text-[#0F172A]">
                        {u.employeeName}
                        {u.email === user?.email && (
                          <span className="ml-1.5 text-[10px] text-[#10B981] font-semibold">(Anda)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#64748B] font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {u.division} · {u.position}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="h-8 rounded-lg border border-[#CBD5E1] bg-white px-2 text-[11px] font-semibold text-[#163A70] focus:border-[#163A70]"
                        >
                          <option>User</option>
                          <option>Legal Officer</option>
                          <option>Legal Manager</option>
                          <option>Department Manager</option>
                          <option>Director / BOD</option>
                          <option>Administrator</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-[#0B2147]">
                Preferensi Notifikasi
              </h2>
              <p className="text-xs text-[#64748B]">
                Pengaturan notifikasi pengingat jatuh tempo kontrak dan persetujuan legal.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#E2E8F0] text-xs pt-1">
            <div className="flex items-center justify-between py-3.5">
              <div>
                <span className="font-bold text-[#0F172A] block">Notifikasi Email Otomatis</span>
                <span className="text-[11px] text-[#64748B]">Kirim salinan digital approval ke email korporat</span>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between py-3.5">
              <div>
                <span className="font-bold text-[#0F172A] block">Notifikasi WhatsApp Gateway</span>
                <span className="text-[11px] text-[#64748B]">Pemberitahuan instan via bot WhatsApp corporate</span>
              </div>
              <Switch checked={waNotif} onCheckedChange={setWaNotif} />
            </div>
            <div className="flex items-center justify-between py-3.5">
              <div>
                <span className="font-bold text-[#0F172A] block">
                  Pengingat Jatuh Tempo (H-60, 45, 30, 15, 7, 0)
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Pemberitahuan berkala kepada divisi pemohon &amp; tim legal
                </span>
              </div>
              <Switch checked={reminderNotif} onCheckedChange={setReminderNotif} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administrator Permission Matrix */}
      <Card className="border-[#163A70]/30 shadow-md animate-in fade-in">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#163A70]" />
            <h2 className="text-base font-bold font-display text-[#0B2147]">
              Matriks Kewenangan Hak Akses (RBAC Governance)
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4 font-display">Peran Pengguna</th>
                  <th className="py-3 px-4 font-display">Submit Form</th>
                  <th className="py-3 px-4 font-display">Review &amp; Drafting</th>
                  <th className="py-3 px-4 font-display">Approve / BOD</th>
                  <th className="py-3 px-4 font-display">Arsip &amp; Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">User</td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">Legal Officer</td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">Legal Manager</td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">Director / BOD</td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                  <td className="py-3.5 px-4"><Check className="h-4 w-4 text-[#10B981]" /></td>
                  <td className="py-3.5 px-4"><Minus className="h-4 w-4 text-[#CBD5E1]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Undang Pengguna Baru (Enterprise RBAC Invite) */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]">
                <UserPlus className="h-5 w-5" />
              </div>
              <DialogTitle className="text-[#0B2147]">Undang Pengguna Baru</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#64748B]">
              Kirimkan undangan resmi ke email korporat. Akun akan dibuat otomatis di database dengan proteksi otentikasi 2FA.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#0F172A]">Nama Lengkap Karyawan</Label>
              <Input
                placeholder="e.g. Raden Arya Wirawan"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="h-10 text-xs rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#0F172A]">Email Korporat</Label>
              <Input
                type="email"
                placeholder="nama@resourcesid.co.id"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#0F172A]">Divisi</Label>
                <select
                  value={inviteDivision}
                  onChange={(e) => setInviteDivision(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A]"
                >
                  <option>Direktorat Umum</option>
                  <option>Legal &amp; Compliance</option>
                  <option>Direktorat Keuangan</option>
                  <option>Direktorat Operasi</option>
                  <option>Human Capital</option>
                  <option>IT &amp; Corporate Governance</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#0F172A]">Jabatan / Posisi</Label>
                <Input
                  placeholder="e.g. Legal Officer"
                  value={invitePosition}
                  onChange={(e) => setInvitePosition(e.target.value)}
                  className="h-10 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#0F172A]">Peran Akses (Role)</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="flex h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] font-semibold"
                >
                  <option>User</option>
                  <option>Legal Officer</option>
                  <option>Legal Manager</option>
                  <option>Department Manager</option>
                  <option>Director / BOD</option>
                  <option>Administrator</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#0F172A]">Kata Sandi Awal</Label>
                <Input
                  type="text"
                  placeholder="Default: Password123!"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="h-10 text-xs rounded-lg font-mono"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={inviteLoading}
                className="bg-[#059669] hover:bg-[#047857] text-white font-bold"
              >
                {inviteLoading ? 'Mengirimkan...' : 'Kirim Undangan & Terbitkan Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
