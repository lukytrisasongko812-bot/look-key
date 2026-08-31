"use client"

import React, { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { RideLogo } from '@/components/common/RideLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  Lock,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export function LoginScreen() {
  const { login, verifyOtp } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 2FA / OTP State
  const [isOtpOpen, setIsOtpOpen] = useState(false)
  const [pendingUserId, setPendingUserId] = useState('')
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [resendingOtp, setResendingOtp] = useState(false)

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')

  // Invitation link query param detection (?email=...&invited=true)
  const [isInvitedUser, setIsInvitedUser] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get('email')
      const invitedParam = params.get('invited')
      if (emailParam) {
        setEmail(emailParam)
        if (invitedParam === 'true') {
          setIsInvitedUser(true)
          toast.success(`Selamat datang! Anda diundang ke portal RIDE sebagai ${emailParam}. Silakan masukkan kata sandi Anda.`)
        }
      }
    }
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email dan kata sandi wajib diisi.')
      return
    }

    setLoading(true)
    const res = await login(email.trim(), password)
    setLoading(false)

    if (!res.success) {
      setErrorMessage(res.error || 'Autentikasi gagal. Periksa kembali email dan kata sandi Anda.')
      return
    }

    if (res.requires2FA && res.userId) {
      setPendingUserId(res.userId)
      setIsOtpOpen(true)
      setOtpValues(['', '', '', '', '', ''])
      toast.info('Kode verifikasi 2FA telah dikirim ke email Anda.')
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.slice(-1).replace(/\D/g, '')
    const newOtp = [...otpValues]
    newOtp[index] = cleanVal
    setOtpValues(newOtp)

    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpValues.join('')
    if (code.length < 6) {
      toast.error('Masukkan 6 digit kode OTP.')
      return
    }

    setLoading(true)
    const res = await verifyOtp(pendingUserId, email, code)
    setLoading(false)

    if (res.success) {
      toast.success('Verifikasi 2FA berhasil! Selamat datang di RIDE.')
      setIsOtpOpen(false)
    } else {
      toast.error(res.error || 'Kode OTP tidak valid atau telah kadaluarsa.')
    }
  }

  const handleResendOtp = async () => {
    setResendingOtp(true)
    const res = await login(email.trim(), password)
    setResendingOtp(false)
    if (res.success && res.requires2FA) {
      toast.success('Kode OTP baru berhasil dikirimkan ke email Anda.')
    } else {
      toast.error('Gagal mengirim ulang OTP.')
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim() || !newResetPassword.trim()) {
      toast.error('Email dan kata sandi baru wajib diisi.')
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: newResetPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Kata sandi berhasil diperbarui! Silakan masuk.')
        setIsForgotOpen(false)
        setPassword(newResetPassword)
        setEmail(forgotEmail)
      } else {
        toast.error(data.error || 'Gagal mereset kata sandi.')
      }
    } catch {
      toast.error('Gagal memproses reset password.')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F6F8FB] px-4 py-8 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#163A70]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-white/60 bg-white/95 shadow-[0_20px_60px_-15px_rgba(15,42,84,0.14)] backdrop-blur-xl overflow-hidden animate-card-in">
        
        {/* Left Side Hero Banner */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between bg-gradient-to-br from-[#0B2147] via-[#163A70] to-[#1E4D94] p-8 text-white relative overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur-md mb-6 border border-white/15">
              <ShieldCheck className="h-3.5 w-3.5 text-[#60A5FA]" />
              <span>Enterprise Document Portal</span>
            </div>

            <RideLogo size="lg" whiteText showSubtitle />

            <div className="mt-8 space-y-3 text-xs text-white/75 leading-relaxed">
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                <span>Pemesanan &amp; Pengajuan Dokumen Terstruktur</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                <span>Pelacakan Versi (V0, Rev.01, Rev.02, FINAL)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                <span>Matriks Kewenangan &amp; Otentikasi 2FA Enkripsi</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/60 border-t border-white/10 pt-4 flex items-center justify-between relative z-10">
            <span>RIDE Platform Enterprise</span>
            <span>risetrack.id</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="md:hidden mb-6 text-center">
            <RideLogo size="md" className="items-center" showSubtitle />
          </div>

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#0B2147]">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Gunakan email korporat dan kata sandi terdaftar Anda.
            </p>
          </div>

          {isInvitedUser && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#059669] text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="text-xs text-[#065F46]">
                <div className="font-bold">Aktivasi Akun Undangan Resmi</div>
                <div>Akun Anda telah didaftarkan. Silakan masukkan kata sandi Anda untuk mengaktifkan sesi.</div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]/60 p-3 text-xs font-semibold text-[#EF4444] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#0F172A]">
                Email Korporat / Gmail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@gmail.com atau nama@resourcesid.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 text-xs rounded-xl bg-white border-[#E2E8F0] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#0F172A]">
                  Kata Sandi
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setIsForgotOpen(true)
                  }}
                  className="text-xs font-semibold text-[#163A70] hover:underline cursor-pointer"
                >
                  Lupa Sandi?
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 text-xs rounded-xl bg-white border-[#E2E8F0] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#163A70] focus:ring-[#163A70]"
                />
                <span className="text-xs text-[#475569]">Ingat sesi masuk</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs shadow-md rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Memproses Otentikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Portal RIDE</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-[#F1F5F9] pt-4 text-center">
            <p className="text-[11px] text-[#64748B]">
              Akses sistem internal &amp; privat. Registrasi akun baru hanya melalui undangan resmi Administrator.
            </p>
          </div>
        </div>
      </div>

      {/* 2FA OTP Modal */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF2FF] text-[#163A70] mb-2">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-[#0B2147]">
              Verifikasi Two-Factor Authentication (2FA)
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#64748B]">
              Masukkan 6 digit kode OTP yang telah dikirimkan ke email <span className="font-bold text-[#0F172A]">{email}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
            <div className="flex justify-center gap-2">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="h-12 w-11 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-center text-lg font-extrabold text-[#0B2147] shadow-2xs focus:border-[#163A70] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#163A70]/15"
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || otpValues.join('').length < 6}
              className="w-full h-11 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi & Lanjutkan Masuk'}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendingOtp}
                className="text-xs text-[#163A70] font-semibold hover:underline cursor-pointer disabled:opacity-50"
              >
                {resendingOtp ? 'Mengirim ulang...' : 'Belum menerima kode? Kirim ulang kode OTP'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#163A70]" />
              <DialogTitle className="text-[#0B2147]">Perbarui Kata Sandi</DialogTitle>
            </div>
            <DialogDescription>
              Masukkan email akun Anda beserta kata sandi baru yang ingin diterapkan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Akun Terdaftar</Label>
              <Input
                type="email"
                placeholder="nama@resourcesid.co.id"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kata Sandi Baru</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsForgotOpen(false)}
                className="h-10 text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-10 text-xs bg-[#163A70] hover:bg-[#0B2147] text-white font-bold rounded-xl"
              >
                Simpan Kata Sandi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
