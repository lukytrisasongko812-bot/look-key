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
    const cleanDigits = val.replace(/\D/g, '')
    if (cleanDigits.length > 1) {
      // Full OTP pasted or mobile keyboard autofilled
      const newOtp = ['', '', '', '', '', '']
      for (let i = 0; i < Math.min(cleanDigits.length, 6); i++) {
        newOtp[i] = cleanDigits[i]
      }
      setOtpValues(newOtp)
      const nextIndex = Math.min(cleanDigits.length, 5)
      const targetInput = document.getElementById(`otp-input-${nextIndex}`)
      targetInput?.focus()
      return
    }

    const cleanVal = cleanDigits.slice(-1)
    const newOtp = [...otpValues]
    newOtp[index] = cleanVal
    setOtpValues(newOtp)

    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    if (!digits) return

    const newOtp = ['', '', '', '', '', '']
    for (let i = 0; i < digits.length; i++) {
      newOtp[i] = digits[i]
    }
    setOtpValues(newOtp)

    const nextIndex = Math.min(digits.length, 5)
    const targetInput = document.getElementById(`otp-input-${nextIndex}`)
    targetInput?.focus()
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
    <div className="relative min-h-screen flex items-center justify-center bg-[#071326] px-4 py-8 overflow-hidden">
      {/* Background Mining Site Image - Vivid and Clear */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: "url('/mining-bg.jpg')" }}
      />
      {/* Soft translucent gradient overlay for comfortable contrast without over-dimming */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Compact Login Container */}
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/50 bg-white/95 p-6 sm:p-7 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-card-in">
        
        {/* Dual Brand Logos Header: RIDE & RESOURCES ID */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[#F1F5F9]">
          <RideLogo size="sm" showSubtitle={false} />
          <div className="h-7 w-[1px] bg-[#E2E8F0]" />
          <img
            src="/resources-id-logo.png"
            alt="RESOURCES ID - Shared Service Center of MIND ID"
            className="h-8 w-auto max-w-[160px] object-contain shrink-0"
          />
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-bold tracking-wide text-[#163A70] uppercase mb-0.5">
            Request Integrated Document Ecosystem
          </div>
          <h2 className="text-lg font-bold font-display text-[#0B2147]">
            Masuk ke Akun
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Gunakan email korporat dan kata sandi terdaftar Anda.
          </p>
        </div>

        {isInvitedUser && (
          <div className="mb-4 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#059669] text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-[11.5px] text-[#065F46]">
              <div className="font-bold">Aktivasi Akun Undangan Resmi</div>
              <div>Akun telah terdaftar. Masukkan kata sandi untuk masuk.</div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]/60 p-2.5 text-xs font-semibold text-[#EF4444] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#EF4444] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-semibold text-[#0F172A]">
              Email Korporat / Gmail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input
                id="email"
                type="email"
                placeholder="nama@resourcesid.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-10 text-xs rounded-xl bg-white border-[#CBD5E1] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
              />
            </div>
          </div>

          <div className="space-y-1">
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
                className="pl-10 pr-10 h-10 text-xs rounded-xl bg-white border-[#CBD5E1] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
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

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#163A70] focus:ring-[#163A70]"
              />
              <span className="text-xs text-[#475569]">Ingat sesi masuk</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs shadow-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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

        <div className="mt-5 border-t border-[#F1F5F9] pt-3 text-center">
          <p className="text-[11px] text-[#64748B]">
            Akses internal &amp; privat · <span className="font-semibold text-[#163A70]">risetrack.id</span>
          </p>
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
              Verifikasi Otentikasi Dua Langkah (2FA)
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
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
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
