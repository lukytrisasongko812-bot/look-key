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
  History,
  Monitor,
  Building,
  Key,
  CheckCircle2,
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
import { RISE_LOGO_BASE64 } from '@/lib/assets'

export function MyAccountView() {
  const { user, updateProfile, loginHistory, changePassword } = useApp()

  const [name, setName] = useState(user?.employeeName || 'Luky Pratama')
  const [department, setDepartment] = useState(user?.division || 'Direktorat Umum')
  const [position, setPosition] = useState(user?.position || 'Legal Officer')
  const [email] = useState(user?.email || 'luky.pratama@resourcesid.co.id')
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

    if (newPw.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.')
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
      toast.success('Kata sandi berhasil diperbarui!')
      setIsPasswordModalOpen(false)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } else {
      toast.error(res.error || 'Gagal mengubah kata sandi.')
    }
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">My Account</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Kelola profil karyawan, pengaturan keamanan dua faktor (2FA), serta pantau sesi login perangkat aktif.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile Hero Card */}
        <Card className="text-center h-fit border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-[#0B2147] via-[#163A70] to-[#254F8E]" />
          <CardContent className="p-6 pt-0 -mt-10 flex flex-col items-center">
            <div className="relative mb-3">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#0B2147] to-[#163A70] text-2xl font-extrabold text-white shadow-md border-4 border-white">
                  {initials}
                </div>
              )}
              <label
                htmlFor="avatarInput"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#CBD5E1] shadow-xs text-[#163A70] hover:bg-[#EBF2FF] transition-colors cursor-pointer"
                title="Ganti Foto Profil"
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h3 className="font-bold font-display text-base text-[#0F172A]">{name}</h3>
            <p className="text-xs text-[#64748B] mt-0.5">{position}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#EBF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#163A70]">
              <Building className="h-3 w-3" />
              <span>{department}</span>
            </div>

            <div className="w-full mt-4 pt-4 border-t border-[#F1F5F9] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Peran Akses</span>
                <span className="font-bold text-[#163A70]">{user?.role || 'Legal Officer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Status Akun</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#10B981]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
                </span>
              </div>
            </div>

            <div className="w-full mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-center gap-1.5 opacity-80">
              <span className="text-[10px] text-[#94A3B8]">Holding Company:</span>
              <img src={RISE_LOGO_BASE64} alt="MIND ID" className="h-3.5 w-auto object-contain" />
            </div>
          </CardContent>
        </Card>

        {/* Right: Modern Tabs */}
        <Card className="md:col-span-2 border-[#E2E8F0] shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="profile">
              <TabsList className="gap-2">
                <TabsTrigger value="profile" className="gap-1.5">
                  <User className="h-3.5 w-3.5" /> Profil
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Keamanan &amp; 2FA
                </TabsTrigger>
                <TabsTrigger value="devices" className="gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> Perangkat
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5">
                  <History className="h-3.5 w-3.5" /> Log Sesi ({loginHistory.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Profile */}
              <TabsContent value="profile" className="space-y-4 pt-3">
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nama Lengkap</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Divisi / Departemen</Label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Jabatan / Posisi</Label>
                      <Input
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email Korporat</Label>
                      <Input value={email} disabled className="bg-[#F8FAFC] opacity-75 h-11 rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Nomor Telepon</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl text-xs" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                    {isSaved ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
                        <Check className="h-4 w-4 stroke-[2.5]" /> Perubahan profil berhasil disimpan!
                      </span>
                    ) : <span />}
                    <Button type="submit" className="h-11 px-6 bg-[#163A70] hover:bg-[#0B2147] font-bold rounded-xl shadow-md">
                      Simpan Profil
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* TAB 2: Security */}
              <TabsContent value="security" className="space-y-4 pt-3">
                <div className="divide-y divide-[#E2E8F0]">
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <span className="text-xs font-bold text-[#0F172A] block">
                        Ubah Kata Sandi
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Perbarui kata sandi dengan proteksi keamanan terenkripsi
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="rounded-xl font-bold"
                    >
                      <Key className="h-3.5 w-3.5 mr-1" /> Perbarui
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <span className="text-xs font-bold text-[#0F172A] block">
                        Two-Factor Authentication (OTP 2FA)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Wajibkan verifikasi kode 6-digit saat masuk ke akun
                      </span>
                    </div>
                    <Switch
                      checked={twoFactor}
                      onCheckedChange={(val) => {
                        setTwoFactor(val)
                        updateProfile({ twoFactorEnabled: val })
                        toast.success(`2FA ${val ? 'diaktifkan' : 'dinonaktifkan'}.`)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <span className="text-xs font-bold text-[#0F172A] block">
                        Notifikasi Login Perangkat Baru
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Kirim notifikasi email otomatis jika ada sesi dari IP tidak dikenal
                      </span>
                    </div>
                    <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Devices */}
              <TabsContent value="devices" className="space-y-3 pt-3">
                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4 bg-[#F8FAFC]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2FF] text-[#163A70]">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F172A] block">
                        Sesi Browser Aktif <b>(Perangkat ini)</b>
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Sesi terotentikasi aktif · 2FA Terverifikasi
                      </span>
                    </div>
                  </div>
                  <Badge variant="success">Sedang Aktif</Badge>
                </div>
              </TabsContent>

              {/* TAB 4: History (Real from MongoDB) */}
              <TabsContent value="history" className="pt-3">
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B]">
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Perangkat &amp; Browser</th>
                        <th className="py-3 px-4">Alamat IP</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {loginHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-[#64748B]">
                            Belum ada riwayat sesi login tercatat.
                          </td>
                        </tr>
                      ) : (
                        loginHistory.map((item) => (
                          <tr key={item._id}>
                            <td className="py-3 px-4 text-[#64748B]">
                              {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 font-medium text-[#0F172A]">
                              {item.device}
                            </td>
                            <td className="py-3 px-4 text-[#64748B] font-mono">
                              {item.ip}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={item.status === 'Success' ? 'success' : 'destructive'}
                              >
                                {item.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah Kata Sandi</DialogTitle>
            <DialogDescription>
              Masukkan kata sandi saat ini dan kata sandi baru untuk akun Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Kata Sandi Saat Ini</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Kata Sandi Baru</Label>
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Ulangi Kata Sandi Baru</Label>
              <Input
                type="password"
                placeholder="Ulangi kata sandi baru"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={pwLoading} className="bg-[#163A70] font-bold">
                {pwLoading ? 'Memperbarui...' : 'Simpan Kata Sandi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
