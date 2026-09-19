"use client"

import React, { useState, useEffect } from 'react'
import { useApp, UserRole } from '@/context/AppContext'
import { isSystemAdmin, isBoardOfDirectors } from '@/lib/roles'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Bell,
  Users,
  Check,
  Minus,
  Settings,
  Mail,
  Smartphone,
  Layers,
  Database,
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsView() {
  const {
    user,
    allUsers,
    setCurrentView,
  } = useApp()

  const [emailNotif, setEmailNotif] = useState(true)
  const [waNotif, setWaNotif] = useState(true)
  const [reminderNotif, setReminderNotif] = useState(true)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0B2147]">
          Pengaturan Sistem
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Konfigurasi notifikasi, integrasi Drive, dan basis data.
        </p>
      </div>

      {/* 1. Notification Preferences */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
            <Bell className="h-5 w-5 text-[#163A70]" />
            <div>
              <h2 className="text-sm font-bold text-[#0B2147]">Notifikasi</h2>
              <p className="text-[11px] text-[#64748B]">
                Pemberitahuan otomatis ke email pengguna.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#163A70]" />
                  Pengajuan &amp; Permintaan Revisi
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Kirim email saat ada berkas baru atau permintaan revisi.
                </div>
              </div>
              <Switch
                checked={emailNotif}
                onCheckedChange={(val) => {
                  setEmailNotif(val)
                  toast.success(`Notifikasi email ${val ? 'diaktifkan' : 'dinonaktifkan'}`)
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#059669]" />
                  Persetujuan &amp; Dokumen Final
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Kirim email saat dokumen disetujui atau diterbitkan berkas final.
                </div>
              </div>
              <Switch
                checked={reminderNotif}
                onCheckedChange={(val) => {
                  setReminderNotif(val)
                  toast.success(`Notifikasi pengesahan ${val ? 'diaktifkan' : 'dinonaktifkan'}`)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Google Drive Cloud Storage & File Archive */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F4EA] text-[#0F9D58]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0B2147]">
                  Integrasi Google Drive
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Penyimpanan berkas dan riwayat dokumen otomatis.
                </p>
              </div>
            </div>

            <Badge variant="outline" className="bg-[#E6F4EA] text-[#0F9D58] border-[#A7F3D0] text-xs font-bold px-2.5 py-1">
              ✓ Aktif
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0F9D58]" />
                Mekanisme Penyimpanan Otomatis:
              </div>
              <ul className="text-xs text-[#475569] space-y-1.5 list-disc pl-5">
                <li>
                  <b>Folder Per Tiket</b>: Direktori otomatis per pengajuan (<code className="bg-white px-1.5 py-0.5 rounded border text-[#163A70]">[RIDE-2026-XXXX] Nama</code>).
                </li>
                <li>
                  <b>Log Riwayat (.txt)</b>: File riwayat diperbarui otomatis di dalam folder.
                </li>
                <li>
                  <b>Arsip Lengkap</b>: Draf awal (V0), revisi (Rev.01+), lampiran, dan berkas final tersimpan aman.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#64748B]">
                Folder ID: <span className="font-mono text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded">RIDE_ENTERPRISE_ARCHIVE</span>
              </div>

              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0F9D58] hover:bg-[#0B8043] text-white shadow-xs transition-colors"
              >
                <span>Buka Google Drive ↗</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. RBAC & Authority Matrix Quick Access */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#163A70]" />
              <div>
                <h2 className="text-sm font-bold text-[#0B2147]">Matriks Kewenangan</h2>
                <p className="text-[11px] text-[#64748B]">
                  Hak akses 6 peran: Guest, User, Legal Officer, Legal Management, BOD, SysAdmin.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setCurrentView('matrix')}
              className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl"
            >
              Buka Matriks &rarr;
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#475569]">
              Kelola peran dan wewenang pengguna sistem sesuai kebijakan perusahaan.
            </div>

            {(isSystemAdmin(user?.role) || isBoardOfDirectors(user?.role)) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentView('users')}
                className="text-xs font-bold text-[#163A70] rounded-xl"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Kelola Pengguna
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Basis Data (Database) Engine — Khusus Administrator */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F9FF] text-[#0284C7]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0B2147]">
                  Manajemen Basis Data
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Penyimpanan data dan sinkronisasi berkas.
                </p>
              </div>
            </div>

            <Badge variant="outline" className="bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] text-xs font-bold px-2.5 py-1">
              Khusus Administrator
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="text-xs text-[#334155] leading-relaxed">
              <span className="font-bold">Ketentuan Akses:</span> Akses langsung basis data dan konfigurasi sistem dibatasi khusus untuk <b>Administrator</b>. Pemohon dan peninjau mengakses berkas melalui antarmuka portal RIDE.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] space-y-1">
                <div className="text-[11px] text-[#64748B] font-medium">Database Engine</div>
                <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  MongoDB Atlas + Google Drive
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] space-y-1">
                <div className="text-[11px] text-[#64748B] font-medium">Keamanan Akses</div>
                <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#163A70]" />
                  Terkunci Sesuai Matriks
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
