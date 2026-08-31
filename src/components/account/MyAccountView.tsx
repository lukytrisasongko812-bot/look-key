"use client"

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Camera,
  Check,
  User,
  Shield,
  Smartphone,
  Building,
  Key,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function MyAccountView() {
  const { user, updateProfile, changePassword, setCurrentView } = useApp()

  const [name, setName] = useState(user?.employeeName || 'Pengguna')
  const [department, setDepartment] = useState(user?.division || 'Direktorat Umum')
  const [position, setPosition] = useState(user?.position || 'Reviewer')
  const [email] = useState(user?.email || 'user@resourcesid.co.id')
  const [phone, setPhone] = useState(user?.phone || '+62 812-9876-5432')

  // Security Toggles
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled ?? true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  // Password Change Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await updateProfile({
      employeeName: name,
      division: department,
      position,
      phone,
      twoFactorEnabled: twoFactor,
    })
    if (ok) {
      setIsSaved(true)
      toast.success('Profil berhasil diperbarui!')
      setTimeout(() => setIsSaved(false), 2500)
    } else {
      toast.error('Gagal menyimpan profil.')
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      await updateProfile({ avatarUrl: dataUrl })
      toast.success('Foto profil berhasil diperbarui!')
    }
    reader.readAsDataURL(file)
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPw || !newPw) {
      toast.error('Mohon isi semua kolom kata sandi.')
      return
    }

    if (newPw.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.')
      return
    }

    if (newPw !== confirmPw) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    setPwLoading(true)
    const res = await changePassword(currentPw, newPw)
    setPwLoading(false)

    if (res.success) {
      toast.success('Kata sandi berhasil diubah!')
      setIsPasswordModalOpen(false)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } else {
      toast.error(res.error || 'Kata sandi lama tidak sesuai.')
    }
  }

  const initials = user?.employeeName
    ? user.employeeName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'RD'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">
          Profil &amp; Keamanan Akun
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Pengaturan identitas karyawan, otentikasi dua langkah (2FA), dan wewenang operasional Anda di RIDE.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] relative" />

        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative group">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.employeeName}
                    className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-[#0B2147] to-[#163A70] text-2xl font-extrabold text-white flex items-center justify-center border-4 border-white shadow-md">
                    {initials}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <Camera className="h-6 w-6" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display text-[#0B2147]">
                    {user?.employeeName || 'Pengguna'}
                  </h2>
                  <Badge className="bg-[#163A70] text-white text-[10px] py-0.5">
                    {user?.role || 'Reviewer'}
                  </Badge>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {user?.position} • {user?.division}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsPasswordModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs h-9 font-semibold text-[#163A70] rounded-xl cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Ubah Kata Sandi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-[#F1F5F9] p-1 rounded-xl">
          <TabsTrigger value="profile" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#163A70]">
            <User className="h-3.5 w-3.5 mr-1.5" /> Informasi Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#163A70]">
            <Shield className="h-3.5 w-3.5 mr-1.5" /> Keamanan &amp; 2FA
          </TabsTrigger>
          <TabsTrigger value="authority" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#163A70]">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Peran &amp; Matriks Kewenangan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile">
          <Card className="border-[#E2E8F0] shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nama Lengkap</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email Akun (Login)</Label>
                    <Input
                      value={email}
                      disabled
                      className="h-10 text-xs rounded-xl bg-[#F8FAFC] text-[#64748B]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Divisi / Unit Kerja</Label>
                    <Input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Jabatan Resmi</Label>
                    <Input
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nomor WhatsApp / Kontak</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    className="h-10 px-6 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {isSaved ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" /> Tersimpan!
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security */}
        <TabsContent value="security">
          <Card className="border-[#E2E8F0] shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#163A70]" />
                    Otentikasi Dua Langkah (2FA OTP)
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Mengirim kode OTP 6-digit ke email setiap kali melakukan proses masuk ke sistem.
                  </div>
                </div>
                <Switch
                  checked={twoFactor}
                  onCheckedChange={(val) => {
                    setTwoFactor(val)
                    updateProfile({ twoFactorEnabled: val })
                    toast.success(`2FA ${val ? 'Diaktifkan' : 'Dinonaktifkan'}`)
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#163A70]" />
                    Pemberitahuan Aktivitas &amp; Dokumen
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Menerima notifikasi email saat ada pengajuan baru, permintaan revisi, atau dokumen final selesai.
                  </div>
                </div>
                <Switch
                  checked={loginAlerts}
                  onCheckedChange={setLoginAlerts}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Authority & Roles */}
        <TabsContent value="authority">
          <Card className="border-[#E2E8F0] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-bold text-[#0B2147]">Peran Pengguna Anda: {user?.role}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Tingkat kewenangan menentukan tindakan operasional yang dapat Anda lakukan pada tiket pengajuan dokumen.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCurrentView('matrix')}
                  className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Lihat Matriks Kewenangan Lengkap
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#475569]">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#0B2147] block">Hak Buat Dokumen:</span>
                  <span>Diizinkan membuat draf pengajuan baru (V0).</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#0B2147] block">Hak Review &amp; Revisi:</span>
                  <span>
                    {user?.role === 'Requester'
                      ? 'Dapat mengunggah draf perbaikan dokumen.'
                      : 'Dapat memeriksa, memberi catatan revisi, dan menyetujui tahapan.'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147]">Ubah Kata Sandi Akun</DialogTitle>
            <DialogDescription>
              Masukkan kata sandi lama Anda untuk memverifikasi penggantian kata sandi baru.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kata Sandi Saat Ini</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kata Sandi Baru (min. 6 karakter)</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={6}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Konfirmasi Kata Sandi Baru</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                minLength={6}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pwLoading} className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold">
                {pwLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
