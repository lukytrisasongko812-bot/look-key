"use client"

import React, { useState, useEffect } from 'react'
import { useApp, UserRole } from '@/context/AppContext'
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
          Pengaturan &amp; Tata Kelola Sistem RIDE
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Kelola preferensi notifikasi real-time, integrasi pengiriman email, serta wewenang operasional sistem.
        </p>
      </div>

      {/* 1. Notification Preferences */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
            <Bell className="h-5 w-5 text-[#163A70]" />
            <div>
              <h2 className="text-sm font-bold text-[#0B2147]">Preferensi Notifikasi Alur Kerja</h2>
              <p className="text-[11px] text-[#64748B]">
                Pemberitahuan otomatis ke email pengguna saat ada perubahan status berkas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#163A70]" />
                  Notifikasi Pengajuan &amp; Permintaan Revisi
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Kirim email otomatis saat ada draf baru (V0) atau catatan revisi dari reviewer.
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
                  Notifikasi Approval &amp; Dokumen Final Selesai
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Pemberitahuan instan saat dokumen telah disetujui Direksi atau diterbitkan berkas FINAL sah.
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

      {/* 2. RBAC & Authority Matrix Quick Access */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#163A70]" />
              <div>
                <h2 className="text-sm font-bold text-[#0B2147]">Matriks Kewenangan &amp; Akses Pengguna</h2>
                <p className="text-[11px] text-[#64748B]">
                  Struktur 5 peran: Requester, Reviewer, Approver, Document Controller, dan Administrator.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setCurrentView('matrix')}
              className="bg-[#163A70] hover:bg-[#0B2147] text-white font-bold text-xs rounded-xl"
            >
              Buka Matriks Lengkap &rarr;
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#475569]">
              Saat ini terdapat <b>{allUsers.length} pengguna resmi</b> yang terdaftar pada sistem RIDE.
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentView('users')}
              className="text-xs font-bold text-[#163A70] rounded-xl"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Kelola Pengguna &amp; Undangan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
