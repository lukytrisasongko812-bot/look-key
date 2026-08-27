"use client"

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { RiseLogo } from '@/components/common/RiseLogo'
import { RISE_ICON_BASE64, RISE_LOGO_BASE64 } from '@/lib/assets'
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
  ShieldCheck,
  Mail,
  KeyRound,
  UserPlus,
  Lock,
  Building2,
  FileCheck2,
  Clock4,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

export function LoginScreen() {
  const { login, verifyOtp, ssoLogin } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [notRobot, setNotRobot] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 2FA / OTP State
  const [isOtpOpen, setIsOtpOpen] = useState(false)
  const [pendingUserId, setPendingUserId] = useState('')
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [otpHint, setOtpHint] = useState('')

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPosition, setRegPosition] = useState('')
  const [regDivision, setRegDivision] = useState('Direktorat Umum')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')
  const [resetTokenInfo, setResetTokenInfo] = useState('')

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email dan kata sandi wajib diisi.')
      return
    }

    if (!notRobot) {
      setErrorMessage("Silakan centang 'I'm not a robot' terlebih dahulu.")
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      if (result.require2FA && result.userId) {
        setPendingUserId(result.userId)
        setOtpHint(result.codeHint || '')
        setOtpValues(['', '', '', '', '', ''])
        setIsOtpOpen(true)
        toast.info('Kode OTP 6-digit dikirimkan ke akun Anda.')
      } else {
        toast.success('Login berhasil! Mengalihkan ke dashboard...')
      }
    } else {
      setErrorMessage(result.error || 'Login gagal. Periksa kembali email dan password Anda.')
      toast.error(result.error || 'Login gagal.')
    }
  }

  const handleSsoClick = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Ketik email korporat Anda di atas terlebih dahulu untuk menggunakan Company SSO.')
      return
    }

    setLoading(true)
    const result = await ssoLogin(email)
    setLoading(false)

    if (result.success) {
      toast.success(`Berhasil masuk otomatis sebagai ${email}`)
    } else {
      setErrorMessage(result.error || 'SSO gagal.')
      toast.error(result.error || 'SSO gagal.')
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1)
    const next = [...otpValues]
    next[index] = val
    setOtpValues(next)

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const code = otpValues.join('')
    if (code.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP secara lengkap.')
      return
    }

    setLoading(true)
    const res = await verifyOtp(pendingUserId, code)
    setLoading(false)

    if (res.success) {
      setIsOtpOpen(false)
      toast.success('Verifikasi 2FA berhasil! Selamat datang.')
    } else {
      toast.error(res.error || 'Kode OTP tidak cocok.')
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    setRegSuccess('')

    if (!regName || !regEmail || !regPassword) {
      setRegError('Mohon lengkapi semua kolom wajib.')
      return
    }

    if (regPassword.length < 8) {
      setRegError('Password minimal 8 karakter.')
      return
    }

    if (regPassword !== regConfirm) {
      setRegError('Konfirmasi password tidak cocok.')
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: regName,
          email: regEmail,
          password: regPassword,
          position: regPosition,
          division: regDivision,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegError(data.error || 'Pendaftaran gagal.')
      } else {
        setRegSuccess('Akun berhasil dibuat di MongoDB! Anda dapat langsung masuk.')
        setEmail(regEmail)
        setPassword(regPassword)
        toast.success('Akun berhasil dibuat!')
        setTimeout(() => setIsRegisterOpen(false), 1200)
      }
    } catch {
      setRegError('Gagal terhubung ke server.')
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: newResetPassword || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Password berhasil diperbarui!')
        setIsForgotOpen(false)
      } else {
        toast.error(data.error || 'Gagal reset password.')
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

      {/* Background Watermark Emblem from prototype HTML */}
      <img
        src={RISE_ICON_BASE64}
        alt=""
        className="pointer-events-none absolute top-1/2 -right-12 -translate-y-1/2 w-[600px] max-w-[65vw] opacity-[0.045] select-none z-0"
      />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-white/60 bg-white/95 shadow-[0_20px_60px_-15px_rgba(15,42,84,0.14)] backdrop-blur-xl overflow-hidden animate-card-in">
        
        {/* Left Side Hero Banner */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between bg-gradient-to-br from-[#0B2147] via-[#163A70] to-[#1E4D94] p-8 text-white relative overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur-md mb-6 border border-white/15">
              <img src={RISE_LOGO_BASE64} alt="MIND ID" className="h-3.5 w-auto brightness-0 invert opacity-95 object-contain" />
              <span className="text-white/40">|</span>
              <span>Shared Service Center</span>
            </div>

            <RiseLogo size="lg" whiteText showSubtitle />

            <p className="text-xs text-white/80 leading-relaxed mt-6">
              Sistem terintegrasi legal kontrak, pemantauan masa berlaku, dan tata kelola perizinan grup industri pertambangan Indonesia.
            </p>
          </div>

          {/* Value Props */}
          <div className="space-y-4 my-8">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#60A5FA]">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Full Workflow Tracking</div>
                <div className="text-[11px] text-white/70">7 tahapan legal drafting, review, hingga approval direksi</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#34D399]">
                <Clock4 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Automated Expiry Alerts</div>
                <div className="text-[11px] text-white/70">Perhitungan real-time H-60 hingga H-7 jatuh tempo</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FBBF24]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Local MongoDB Storage</div>
                <div className="text-[11px] text-white/70">Semua data dan otentikasi tersimpan aman di database lokal</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/60 border-t border-white/10 pt-4 flex items-center justify-between">
            <span>RISE Platform Production</span>
            <span>Database: MongoDB 8.x</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="md:hidden mb-6 text-center">
            <RiseLogo size="md" className="items-center" showSubtitle />
          </div>

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#0B2147]">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Gunakan email korporat dan kata sandi Anda yang terdaftar di MongoDB.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]/60 p-3 text-xs font-semibold text-[#EF4444] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#EF4444] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#0F172A]">
                Email Korporat
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
                  className="text-[11px] font-semibold text-[#163A70] hover:underline cursor-pointer"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 text-xs rounded-xl bg-white border-[#E2E8F0] focus:border-[#163A70] focus:ring-4 focus:ring-[#163A70]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#64748B] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#163A70] focus:ring-[#163A70] h-3.5 w-3.5"
                />
                Ingat saya di perangkat ini
              </label>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#CBD5E1] p-3 text-xs text-[#64748B] bg-[#F8FAFC]">
              <input
                type="checkbox"
                id="botCheck"
                checked={notRobot}
                onChange={(e) => setNotRobot(e.target.checked)}
                className="rounded text-[#163A70] focus:ring-[#163A70] h-4 w-4"
              />
              <label htmlFor="botCheck" className="cursor-pointer select-none text-xs font-medium text-[#334155]">
                I&apos;m not a robot <span className="text-[10px] text-[#94A3B8] ml-1">(Security check)</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs font-bold rounded-xl bg-[#163A70] hover:bg-[#0B2147] active:scale-[0.99] shadow-md shadow-[#163A70]/20 transition-all cursor-pointer"
            >
              {loading ? 'Memverifikasi...' : 'Sign In Securely'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

            {/* Quick Credentials Assistant */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-[11px] text-[#64748B] space-y-1">
              <div className="font-bold text-[#163A70] flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Pilihan Cepat Kredensial Akun Terdaftar:
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('luky.pratama@resourcesid.co.id')
                    setPassword('Password123!')
                  }}
                  className="rounded-md bg-white border border-[#CBD5E1] px-2 py-0.5 font-mono text-[10px] hover:border-[#163A70] cursor-pointer"
                >
                  Legal Officer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sinta.wahyuni@resourcesid.co.id')
                    setPassword('Password123!')
                  }}
                  className="rounded-md bg-white border border-[#CBD5E1] px-2 py-0.5 font-mono text-[10px] hover:border-[#163A70] cursor-pointer"
                >
                  Legal Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('budi.santoso@resourcesid.co.id')
                    setPassword('Password123!')
                  }}
                  className="rounded-md bg-white border border-[#CBD5E1] px-2 py-0.5 font-mono text-[10px] hover:border-[#163A70] cursor-pointer"
                >
                  Director / BOD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@resourcesid.co.id')
                    setPassword('Password123!')
                  }}
                  className="rounded-md bg-white border border-[#CBD5E1] px-2 py-0.5 font-mono text-[10px] hover:border-[#163A70] cursor-pointer"
                >
                  Administrator
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-[#64748B] pt-1">
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="font-bold text-[#163A70] hover:underline cursor-pointer"
              >
                Daftar / Registrasi Baru
              </button>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center text-xs text-[#94A3B8]">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold text-[#64748B]">
              atau masuk dengan email perusahaan
            </span>
          </div>

          {/* One-Click Company SSO Button */}
          <button
            type="button"
            onClick={handleSsoClick}
            className="flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#EBF2FF] hover:border-[#163A70] text-xs font-bold text-[#163A70] shadow-2xs transition-all cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-[#163A70]" />
            <span>One-Click Corporate SSO (Domain Verification)</span>
          </button>

          {/* Session Security Strip */}
          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-[11px] text-[#64748B] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>TLS 1.3 Active</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
              <span>MongoDB Authenticated</span>
            </div>
          </div>

          {/* MIND ID Brand Footer from prototype HTML */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-center gap-2 text-[11px] text-[#94A3B8]">
            <span className="text-[10.5px] text-[#94A3B8]">Member of</span>
            <img
              src={RISE_LOGO_BASE64}
              alt="MIND ID - Mining Industry Indonesia"
              className="h-4 w-auto object-contain opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Real 2FA / OTP Modal Dialog */}
      <Dialog open={isOtpOpen} onOpenChange={setIsOtpOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF2FF] text-[#163A70]">
              <KeyRound className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-[#0B2147]">
              Two-Factor Authentication (2FA)
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#64748B]">
              Masukkan 6-digit kode verifikasi real yang dibuat oleh server database Anda.
            </DialogDescription>
          </DialogHeader>

          {otpHint && (
            <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-2.5 text-xs text-[#065F46] font-semibold">
              Kode OTP terverifikasi Anda: <span className="font-mono text-base font-extrabold tracking-widest">{otpHint}</span>
            </div>
          )}

          <div className="flex justify-center gap-2.5 my-3">
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                className="h-12 w-10 rounded-xl border border-[#CBD5E1] bg-white text-center text-xl font-bold text-[#163A70] focus:border-[#163A70] focus:outline-none focus:ring-4 focus:ring-[#163A70]/10 shadow-2xs"
              />
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={handleVerifyOtp} disabled={loading} className="w-full h-11 font-bold rounded-xl bg-[#163A70]">
              {loading ? 'Memvalidasi...' : 'Verifikasi & Lanjutkan'}
            </Button>
            <button
              type="button"
              onClick={() => {
                const newCode = Math.floor(100000 + Math.random() * 900000).toString()
                setOtpHint(newCode)
                toast.info(`Kode OTP baru diterbitkan: ${newCode}`)
              }}
              className="text-xs text-[#163A70] hover:underline cursor-pointer pt-1"
            >
              Kirim ulang kode OTP
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#163A70]" />
              <DialogTitle className="text-[#0B2147]">Registrasi Akun RISE</DialogTitle>
            </div>
            <DialogDescription>
              Data akun baru akan tersimpan langsung ke MongoDB lokal dengan password ter-enkripsi.
            </DialogDescription>
          </DialogHeader>

          {regError && (
            <div className="rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] p-3 text-xs font-semibold text-[#EF4444]">
              {regError}
            </div>
          )}
          {regSuccess && (
            <div className="rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] p-3 text-xs font-semibold text-[#10B981]">
              {regSuccess}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="e.g. Luky Pratama"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                className="h-10 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label>Email Korporat</Label>
              <Input
                type="email"
                placeholder="nama@resourcesid.co.id"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label>Divisi</Label>
                <select
                  value={regDivision}
                  onChange={(e) => setRegDivision(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A]"
                >
                  <option>Direktorat Umum</option>
                  <option>Direktorat Keuangan</option>
                  <option>Direktorat Operasi</option>
                  <option>Human Capital</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Jabatan / Posisi</Label>
                <Input
                  placeholder="e.g. Legal Officer"
                  value={regPosition}
                  onChange={(e) => setRegPosition(e.target.value)}
                  className="h-10 text-xs rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 8 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="h-10 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label>Konfirmasi Password</Label>
                <Input
                  type="password"
                  placeholder="Ulangi password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  className="h-10 text-xs rounded-lg"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#163A70] font-bold">Daftarkan Akun</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot / Reset Password Modal */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#163A70]" />
              <DialogTitle className="text-[#0B2147]">Perbarui Kata Sandi</DialogTitle>
            </div>
            <DialogDescription>
              Masukkan email akun Anda beserta kata sandi baru yang ingin diterapkan di MongoDB.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label>Email Korporat</Label>
              <Input
                type="email"
                placeholder="nama@resourcesid.co.id"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label>Kata Sandi Baru</Label>
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                required
                className="h-10 text-xs rounded-lg"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsForgotOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#163A70] font-bold">Simpan Password Baru</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
