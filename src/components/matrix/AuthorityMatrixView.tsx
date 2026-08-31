"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Check,
  Minus,
  FileCheck2,
  FileSignature,
  FileText,
  Users,
  Settings,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'

export function AuthorityMatrixView() {
  const { user, setCurrentView } = useApp()

  const roles = [
    {
      id: 'Requester',
      title: 'Requester',
      badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
      desc: 'Pengaju pengajuan dokumen dari unit kerja / divisi pemohon.',
      jobdesk: 'Membuat draf pengajuan awal (V0), melampirkan berkas pendukung, dan mengunggah perbaikan jika diminta revisi.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: false,
        requestRevision: false,
        uploadRevision: true,
        approveStage: false,
        uploadFinal: false,
        manageExpiry: false,
        manageUsers: false,
      },
    },
    {
      id: 'Reviewer',
      title: 'Reviewer (Legal / Compliance)',
      badgeColor: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      desc: 'Pemeriksa substansi hukum, kepatuhan klausul, dan kelayakan dokumen.',
      jobdesk: 'Memeriksa draf kontrak/perizinan, memberikan catatan revisi terperinci, mengunggah draf perbaikan (Rev.01, Rev.02), dan menyetujui tahapan review.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: true,
        approveStage: true,
        uploadFinal: false,
        manageExpiry: true,
        manageUsers: false,
      },
    },
    {
      id: 'Approver',
      title: 'Approver (Direksi / Dept Head)',
      badgeColor: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
      desc: 'Pemberi otorisasi puncak, persetujuan direksi, dan penandatanganan resmi.',
      jobdesk: 'Memberikan persetujuan akhir (BOD Approval), mengotorisasi perpanjangan atau terminasi kontrak jatuh tempo, dan tanda tangan digital/fisik.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: false,
        approveStage: true,
        uploadFinal: false,
        manageExpiry: true,
        manageUsers: false,
      },
    },
    {
      id: 'Document Controller',
      title: 'Document Controller',
      badgeColor: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
      desc: 'Pengendali tata kelola dokumen, verifikator berkas final, dan pengarsipan.',
      jobdesk: 'Memverifikasi keabsahan dokumen bertandatangan lengkap, mengunggah Dokumen Final (FINAL), mengunci versi arsip sah, dan memantau masa berlaku.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: false,
        uploadRevision: true,
        approveStage: true,
        uploadFinal: true,
        manageExpiry: true,
        manageUsers: false,
      },
    },
    {
      id: 'Administrator',
      title: 'Administrator',
      badgeColor: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
      desc: 'Pengelola sistem, arsitektur data, keamanan akses, dan manajemen pengguna.',
      jobdesk: 'Mengelola hak akses RBAC, menerbitkan link undangan pengguna ke Gmail, mengontrol master data sistem, dan mengawasi seluruh operasional.',
      permissions: {
        createDoc: true,
        viewDocs: true,
        addReviewNotes: true,
        requestRevision: true,
        uploadRevision: true,
        approveStage: true,
        uploadFinal: true,
        manageExpiry: true,
        manageUsers: true,
      },
    },
  ]

  const operationalActions = [
    { key: 'createDoc', label: 'Ajukan Dokumen Baru (V0)', desc: 'Membuat nomor tiket dan upload draf awal' },
    { key: 'viewDocs', label: 'Lihat & Unduh Dokumen', desc: 'Membaca dan mengunduh berkas versi aktif' },
    { key: 'addReviewNotes', label: 'Beri Catatan Revisi', desc: 'Menambahkan poin feedback per pasal/klausul' },
    { key: 'requestRevision', label: 'Minta Revisi Dokumen', desc: 'Mengembalikan status pengajuan untuk diperbaiki' },
    { key: 'uploadRevision', label: 'Unggah Revisi (Rev.01+)', desc: 'Mengunggah draf perbaikan versi baru' },
    { key: 'approveStage', label: 'Approval / Persetujuan', desc: 'Menyetujui tahapan legal review atau BOD approval' },
    { key: 'uploadFinal', label: 'Unggah Dokumen Final (FINAL)', desc: 'Menerbitkan dan mengunci berkas final bertanda tangan' },
    { key: 'manageExpiry', label: 'Keputusan Jatuh Tempo', desc: 'Menetapkan perpanjangan atau terminasi kontrak' },
    { key: 'manageUsers', label: 'Kelola Pengguna & Hak Akses', desc: 'Undang akun, ubah role, dan konfigurasi sistem' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0B2147]">
            Matriks Kewenangan &amp; Otoritas (RBAC Matrix)
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Pemetaan hak akses operasional dan pembagian tanggung jawab kerja (jobdesk) untuk 5 tingkatan peran di sistem RIDE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-[#163A70] text-white py-1 px-3 text-xs">
            Peran Anda: {user?.role || 'Reviewer'}
          </Badge>
          {(user?.role === 'Administrator' || user?.role === 'Director / BOD') && (
            <button
              onClick={() => setCurrentView('users')}
              className="text-xs font-bold text-[#163A70] hover:underline flex items-center gap-1 cursor-pointer bg-[#EBF2FF] px-3 py-1.5 rounded-xl"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Kelola Akun &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Matrix Table Card */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-4 px-5 font-bold text-[#0B2147] text-xs w-1/3">
                    Aktivitas &amp; Hak Operasional
                  </th>
                  {roles.map((r) => (
                    <th key={r.id} className="py-4 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${r.badgeColor}`}>
                        {r.title.split(' ')[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {operationalActions.map((act) => (
                  <tr key={act.key} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#0F172A]">{act.label}</div>
                      <div className="text-[11px] text-[#64748B]">{act.desc}</div>
                    </td>
                    {roles.map((r) => {
                      const hasPerm = r.permissions[act.key as keyof typeof r.permissions]
                      return (
                        <td key={r.id} className="py-3.5 px-3 text-center">
                          {hasPerm ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                              <Minus className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Cards Breakdown */}
      <div>
        <h2 className="text-base font-bold font-display text-[#0B2147] mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#163A70]" />
          Deskripsi Tanggung Jawab &amp; Jobdesk Peran
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Card key={r.id} className="border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${r.badgeColor}`}>
                    {r.title}
                  </span>
                </div>

                <p className="text-xs text-[#0F172A] font-semibold">
                  {r.desc}
                </p>

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[11.5px] text-[#475569] space-y-1">
                  <span className="font-bold text-[#0B2147] block text-[11px] uppercase tracking-wider">
                    Tanggung Jawab Utama:
                  </span>
                  <div>{r.jobdesk}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
