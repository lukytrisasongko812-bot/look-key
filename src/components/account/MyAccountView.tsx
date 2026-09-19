"use client"

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { normalizeRole, canAccessAuthorityMatrix } from '@/lib/roles'
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
  ShieldCheck,
  FolderOpen,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  Lock,
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

function compressImage(file: File, maxWidth: number, maxHeight: number, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = () => resolve(e.target?.result as string)
    }
    reader.onerror = () => resolve('')
  })
}

export function MyAccountView() {
  const { user, updateProfile, changePassword, setCurrentView } = useApp()

  const [name, setName] = useState(user?.employeeName || 'Pengguna')
  const [department, setDepartment] = useState(user?.division || 'Direktorat Umum')
  const [position, setPosition] = useState(user?.position || 'Reviewer')
  const [email] = useState(user?.email || 'user@resourcesid.co.id')
  const [phone, setPhone] = useState(user?.phone || '+62 812-9876-5432')

  // Optimistic Image Previews (Instantly loaded from dedicated localStorage cache)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const email = user?.email?.toLowerCase() || ''
      if (email) {
        const cached = localStorage.getItem(`ride_avatar_${email}`)
        if (cached) return cached
      }
      try {
        const saved = localStorage.getItem('ride_user')
        const parsed = saved ? JSON.parse(saved) : null
        return parsed?.avatarUrl || null
      } catch {}
    }
    return user?.avatarUrl || null
  })

  const [previewCover, setPreviewCover] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const email = user?.email?.toLowerCase() || ''
      if (email) {
        const cached = localStorage.getItem(`ride_cover_${email}`)
        if (cached) return cached
      }
      try {
        const saved = localStorage.getItem('ride_user')
        const parsed = saved ? JSON.parse(saved) : null
        return parsed?.coverUrl || null
      } catch {}
    }
    return user?.coverUrl || null
  })

  // Security Toggles
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled ?? true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password Change Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  // Synchronize form inputs whenever user context updates
  React.useEffect(() => {
    if (user) {
      if (user.employeeName) setName(user.employeeName)
      if (user.division) setDepartment(user.division)
      if (user.position) setPosition(user.position)
      if (user.phone) setPhone(user.phone)
      if (user.twoFactorEnabled !== undefined) setTwoFactor(user.twoFactorEnabled)

      const email = user.email?.toLowerCase() || ''
      const storedAvatar = user.avatarUrl || (email ? localStorage.getItem(`ride_avatar_${email}`) : null)
      const storedCover = user.coverUrl || (email ? localStorage.getItem(`ride_cover_${email}`) : null)

      if (storedAvatar) setPreviewAvatar(storedAvatar)
      if (storedCover) setPreviewCover(storedCover)
    }
  }, [user])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama lengkap tidak boleh kosong.')
      return
    }

    setSavingProfile(true)
    const email = user?.email?.toLowerCase() || ''
    const currentAvatar = previewAvatar || (email ? localStorage.getItem(`ride_avatar_${email}`) : null) || user?.avatarUrl
    const currentCover = previewCover || (email ? localStorage.getItem(`ride_cover_${email}`) : null) || user?.coverUrl

    const ok = await updateProfile({
      employeeName: name.trim(),
      division: department.trim(),
      position: position.trim(),
      phone: phone.trim(),
      twoFactorEnabled: twoFactor,
      avatarUrl: currentAvatar || undefined,
      coverUrl: currentCover || undefined,
    })
    setSavingProfile(false)

    if (ok) {
      setIsSaved(true)
      toast.success('Profil & nama berhasil diperbarui!')
      setTimeout(() => setIsSaved(false), 2500)
    } else {
      toast.error('Gagal menyimpan profil.')
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Fast client-side resize to 512x512
    const compressedDataUrl = await compressImage(file, 512, 512, 0.85)
    if (!compressedDataUrl) return

    setPreviewAvatar(compressedDataUrl) // Instant smooth local preview
    const ok = await updateProfile({ avatarUrl: compressedDataUrl })
    if (ok) {
      toast.success('Foto profil berhasil diperbarui & disinkronkan ke Google Drive!')
    } else {
      toast.error('Gagal memperbarui foto profil.')
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Fast client-side resize to 1200x400
    const compressedDataUrl = await compressImage(file, 1200, 400, 0.85)
    if (!compressedDataUrl) return

    setPreviewCover(compressedDataUrl) // Instant smooth local preview
    const ok = await updateProfile({ coverUrl: compressedDataUrl })
    if (ok) {
      toast.success('Foto sampul profil berhasil diperbarui & disinkronkan ke Google Drive!')
    } else {
      toast.error('Gagal memperbarui foto sampul.')
    }
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

  const initials = (name || user?.employeeName)
    ? (name || user?.employeeName || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'RD'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147] tracking-tight">
          Profil Akun
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Informasi identitas, keamanan 2FA, dan peran pengguna.
        </p>
      </div>

      {/* Hero Profile & Cover Card */}
      <Card className="border-[#E2E8F0] shadow-sm rounded-3xl overflow-hidden bg-white">
        {/* Cover Photo Banner */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#1E4D94] relative overflow-hidden group">
          {(previewCover || user?.coverUrl) && (
            <img
              src={previewCover || user?.coverUrl}
              alt="Sampul Profil"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Change Cover Button */}
          <label className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-[11px] font-bold cursor-pointer transition-all shadow-sm border border-white/25">
            <Camera className="h-3.5 w-3.5" />
            <span>Ganti Sampul</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Identity Details Body */}
        <div className="px-5 sm:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar overlapping bottom border of cover */}
            <div className="flex items-end gap-4 -mt-12 sm:-mt-14">
              <div className="relative group shrink-0">
                {(previewAvatar || user?.avatarUrl) ? (
                  <img
                    src={previewAvatar || user?.avatarUrl}
                    alt={name || user?.employeeName}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl sm:rounded-3xl object-cover border-4 border-white shadow-lg bg-white transition-opacity duration-300 ring-1 ring-black/5"
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-[#0B2147] to-[#163A70] text-3xl font-black text-white flex items-center justify-center border-4 border-white shadow-lg ring-1 ring-black/5">
                    {initials}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <Camera className="h-6 w-6" />
                  <span className="text-[10px] font-bold mt-1">Ubah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <Button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs h-9 font-bold text-[#163A70] bg-[#F8FAFC] hover:bg-[#EBF2FF] border-[#CBD5E1] rounded-xl cursor-pointer gap-1.5 flex-1 sm:flex-initial"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Ubah Sandi</span>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open('https://drive.google.com/drive/folders/1JRjTJOGlGs0S0iE1HYIBaI0nIcqDXugf', '_blank')
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs h-9 font-bold text-[#0F172A] bg-[#F8FAFC] hover:bg-[#EBF2FF] border-[#CBD5E1] rounded-xl cursor-pointer gap-1.5 flex-1 sm:flex-initial"
              >
                <FolderOpen className="h-3.5 w-3.5 text-[#163A70]" />
                <span>Folder Drive</span>
              </Button>
            </div>
          </div>

          {/* User Name & Metadata */}
          <div className="mt-4 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#0B2147] tracking-tight">
                {name || user?.employeeName || 'Pengguna'}
              </h2>
              <Badge className="bg-[#163A70] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {normalizeRole(user?.role)}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Akun Aktif
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
              <span className="font-bold text-[#0F172A]">{position || user?.position}</span>
              <span className="mx-1.5 text-[#CBD5E1]">•</span>
              <span>{department || user?.division}</span>
              <span className="mx-1.5 text-[#CBD5E1]">•</span>
              <span className="text-[#64748B]">{email}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="profile" className="space-y-4">
        <div className="overflow-x-auto no-scrollbar pb-1">
          <TabsList className="w-full sm:w-auto flex justify-start bg-[#EBF2FF]/70 p-1.5 rounded-2xl border border-[#BFDBFE]/50 gap-1 min-w-max">
            <TabsTrigger
              value="profile"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#163A70] data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profil</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#163A70] data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Keamanan &amp; 2FA</span>
            </TabsTrigger>
            <TabsTrigger
              value="authority"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] data-[state=active]:bg-white data-[state=active]:text-[#163A70] data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Peran &amp; Wewenang</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Profile Information */}
        <TabsContent value="profile" className="focus-visible:outline-none">
          <Card className="border-[#E2E8F0] shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-6">
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#163A70]" />
                      <span>Nama Lengkap</span>
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Nama lengkap karyawan"
                      className="h-11 text-xs rounded-xl border-[#CBD5E1] focus:border-[#163A70] bg-[#F8FAFC]/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-[#163A70]" />
                      <span>Email (Login)</span>
                    </Label>
                    <Input
                      value={email}
                      disabled
                      className="h-11 text-xs rounded-xl bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0] cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-[#163A70]" />
                      <span>Divisi</span>
                    </Label>
                    <Input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      placeholder="Direktorat Legal & Governance"
                      className="h-11 text-xs rounded-xl border-[#CBD5E1] focus:border-[#163A70] bg-[#F8FAFC]/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-[#163A70]" />
                      <span>Jabatan</span>
                    </Label>
                    <Input
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                      placeholder="Head of Legal"
                      className="h-11 text-xs rounded-xl border-[#CBD5E1] focus:border-[#163A70] bg-[#F8FAFC]/50 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-[#0B2147] flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#163A70]" />
                      <span>Nomor WhatsApp</span>
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812-xxxx-xxxx"
                      className="h-11 text-xs rounded-xl border-[#CBD5E1] focus:border-[#163A70] bg-[#F8FAFC]/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="h-11 px-7 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    {savingProfile ? (
                      'Menyimpan...'
                    ) : isSaved ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" /> Tersimpan!
                      </>
                    ) : (
                      'Simpan Profil'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & 2FA */}
        <TabsContent value="security" className="focus-visible:outline-none">
          <Card className="border-[#E2E8F0] shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="space-y-1 pr-4">
                  <div className="text-xs sm:text-sm font-bold text-[#0B2147] flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#163A70]" />
                    <span>Otentikasi Dua Langkah (2FA OTP)</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed">
                    Kirim kode OTP 6 digit ke email Anda setiap kali masuk portal.
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

              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="space-y-1 pr-4">
                  <div className="text-xs sm:text-sm font-bold text-[#0B2147] flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#163A70]" />
                    <span>Notifikasi Email</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed">
                    Terima email saat ada pengajuan, permohonan revisi, atau dokumen final selesai.
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
        <TabsContent value="authority" className="focus-visible:outline-none">
          <Card className="border-[#E2E8F0] shadow-sm rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-bold text-[#0B2147]">
                    Peran Pengguna: <span className="text-[#163A70] font-black">{normalizeRole(user?.role)}</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Wewenang operasional dalam alur dokumen.
                  </p>
                </div>
                {canAccessAuthorityMatrix(user?.role) && (
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => setCurrentView('matrix')}
                    className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl gap-1.5 shrink-0"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Matriks Lengkap</span>
                  </Button>
                )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#475569]">
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="font-bold text-[#0B2147] block">Pembuatan Dokumen:</span>
                    <span>Dapat mengajukan berkas draf awal (V0).</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="font-bold text-[#0B2147] block">Telaah &amp; Revisi:</span>
                    <span>
                      Dapat menelaah, memberi catatan revisi, dan menyetujui tahapan.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#0B2147] font-bold text-base">Ubah Kata Sandi</DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Masukkan kata sandi lama dan baru Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0B2147]">Kata Sandi Lama</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0B2147]">Kata Sandi Baru (min. 6 karakter)</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={6}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#0B2147]">Konfirmasi Kata Sandi</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                minLength={6}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="rounded-xl text-xs font-bold">
                Batal
              </Button>
              <Button type="submit" disabled={pwLoading} className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-xl text-xs">
                {pwLoading ? 'Menyimpan...' : 'Simpan Sandi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
