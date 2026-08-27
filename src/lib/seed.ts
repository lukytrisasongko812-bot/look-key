import bcrypt from 'bcryptjs'
import { connectToDatabase } from './db'
import { User } from '@/models/User'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { LoginHistoryModel } from '@/models/LoginHistory'

export async function seedDatabase(force = false) {
  await connectToDatabase()

  const userCount = await User.countDocuments()
  if (userCount > 0 && !force) {
    return { message: 'Database already contains data.' }
  }

  if (force) {
    await Promise.all([
      User.deleteMany({}),
      DocumentModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      LoginHistoryModel.deleteMany({}),
    ])
  }

  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  // 1. Create Real Corporate Users
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10)

  const users = await User.insertMany([
    {
      employeeName: 'Luky Pratama',
      email: 'luky.pratama@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'Senior Legal Officer',
      division: 'Direktorat Umum',
      role: 'Legal Officer',
      phone: '+62 812-9876-5432',
      twoFactorEnabled: true,
    },
    {
      employeeName: 'Sinta Wahyuni',
      email: 'sinta.wahyuni@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'Legal Manager',
      division: 'Direktorat Umum',
      role: 'Legal Manager',
      phone: '+62 813-1122-3344',
      twoFactorEnabled: false,
    },
    {
      employeeName: 'Budi Santoso',
      email: 'budi.santoso@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'Direktur Operasi & Portofolio',
      division: 'Direksi / BOD',
      role: 'Director / BOD',
      phone: '+62 811-9988-7766',
      twoFactorEnabled: true,
    },
    {
      employeeName: 'Administrator Sistem',
      email: 'admin@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'System Administrator',
      division: 'Teknologi Informasi & Shared Service',
      role: 'Administrator',
      phone: '+62 812-0000-9999',
      twoFactorEnabled: false,
    },
  ])

  const luky = users[0]

  // 2. Create Realistic Documents with Dynamic Real Dates
  const sampleDocs = [
    {
      docNumber: 'RISE-2026-0142',
      name: 'Perjanjian Sewa Alat Berat - PT Bara Kencana',
      category: 'Perjanjian',
      division: 'Direktorat Operasi',
      priority: 'Normal',
      confidentiality: 'Internal',
      contractStart: new Date(now.getTime() - 40 * oneDay),
      contractEnd: new Date(now.getTime() + 14 * oneDay), // 14 days left (H-14)
      noDuration: false,
      notes: 'Sewa dump truck dan excavator untuk site operasional.',
      stage: 2, // Legal Drafting
      stageStatus: 'active',
      pic: 'Sinta W.',
      revisionRequested: false,
      rejected: false,
      history: [
        { stage: 0, action: 'Pengajuan dibuat oleh pemohon', actor: 'Luky Pratama', timestamp: new Date(now.getTime() - 10 * oneDay) },
        { stage: 1, action: 'Verifikasi kelengkapan dokumen review', actor: 'Sinta Wahyuni', timestamp: new Date(now.getTime() - 5 * oneDay) },
        { stage: 2, action: 'Penyusunan draft perjanjian hukum', actor: 'Sinta Wahyuni', timestamp: new Date(now.getTime() - 2 * oneDay) },
      ],
      createdBy: luky._id,
    },
    {
      docNumber: 'RISE-2026-0141',
      name: 'NDA - PT Sumber Mineral',
      category: 'NDA',
      division: 'Direktorat Umum',
      priority: 'Normal',
      confidentiality: 'Confidential',
      contractStart: new Date(now.getTime() - 60 * oneDay),
      contractEnd: new Date(now.getTime() + 45 * oneDay), // 45 days left (H-45)
      noDuration: false,
      notes: 'Non-disclosure agreement eksplorasi nikel tahap 2.',
      stage: 3, // Legal Approval
      stageStatus: 'active',
      pic: 'Rendra A.',
      revisionRequested: false,
      rejected: false,
      history: [
        { stage: 0, action: 'Pengajuan NDA diajukan', actor: 'Luky Pratama', timestamp: new Date(now.getTime() - 8 * oneDay) },
        { stage: 1, action: 'Review klausul kerahasiaan', actor: 'Rendra A.', timestamp: new Date(now.getTime() - 4 * oneDay) },
        { stage: 2, action: 'Drafting klausul arbitrase', actor: 'Rendra A.', timestamp: new Date(now.getTime() - 2 * oneDay) },
        { stage: 3, action: 'Menunggu tanda tangan persetujuan Legal Manager', actor: 'Rendra A.', timestamp: new Date(now.getTime() - 1 * oneDay) },
      ],
      createdBy: luky._id,
    },
    {
      docNumber: 'RISE-2026-0139',
      name: 'MoU Kerja Sama Riset Tambang',
      category: 'MoU',
      division: 'Direktorat Operasi',
      priority: 'Urgent',
      confidentiality: 'Internal',
      contractStart: new Date(now.getTime() - 20 * oneDay),
      contractEnd: new Date(now.getTime() + 85 * oneDay),
      noDuration: false,
      notes: 'Klausul royalti dan HAKI memerlukan revisi dari pemohon.',
      stage: 1, // Review
      stageStatus: 'revision',
      pic: 'Luky P.',
      revisionRequested: true,
      rejected: false,
      history: [
        { stage: 0, action: 'Pengajuan diajukan', actor: 'Luky Pratama', timestamp: new Date(now.getTime() - 5 * oneDay) },
        { stage: 1, action: 'Catatan revisi: lengkapi lampiran HAKI universitas mitra', actor: 'Sinta Wahyuni', timestamp: new Date(now.getTime() - 1 * oneDay) },
      ],
      createdBy: luky._id,
    },
    {
      docNumber: 'RISE-2026-0135',
      name: 'Izin Usaha Jasa Pertambangan - Sub Bidang IUJP',
      category: 'Kontrak Lainnya',
      division: 'Direktorat Umum',
      priority: 'Critical',
      confidentiality: 'Restricted',
      contractStart: new Date(now.getTime() - 355 * oneDay),
      contractEnd: new Date(now.getTime() + 5 * oneDay), // 5 days left (H-5) urgent!
      noDuration: false,
      notes: 'Perpanjangan izin tahunan operasional.',
      stage: 4, // BOD Approval / Signed
      stageStatus: 'active',
      pic: 'Dewi K.',
      revisionRequested: false,
      rejected: false,
      history: [
        { stage: 0, action: 'Pengajuan perpanjangan izin', actor: 'Dewi K.', timestamp: new Date(now.getTime() - 14 * oneDay) },
        { stage: 3, action: 'Persetujuan Legal Manager disahkan', actor: 'Sinta Wahyuni', timestamp: new Date(now.getTime() - 2 * oneDay) },
        { stage: 4, action: 'Menunggu tandatangan Direktur Operasi', actor: 'Budi Santoso', timestamp: new Date(now.getTime() - 1 * oneDay) },
      ],
      createdBy: luky._id,
    },
    {
      docNumber: 'RISE-2026-0128',
      name: 'Surat Kuasa Khusus - Litigasi Kontrak Vendor',
      category: 'Surat Kuasa Khusus',
      division: 'Direktorat Keuangan',
      priority: 'Normal',
      confidentiality: 'Confidential',
      contractStart: new Date(now.getTime() - 180 * oneDay),
      contractEnd: new Date(now.getTime() + 180 * oneDay),
      noDuration: false,
      notes: 'Penunjukan kuasa hukum pendampingan arbitrase.',
      stage: 5, // Archived
      stageStatus: 'completed',
      pic: 'Bimo S.',
      revisionRequested: false,
      rejected: false,
      history: [
        { stage: 0, action: 'Pengajuan dibuat', actor: 'Bimo S.', timestamp: new Date(now.getTime() - 30 * oneDay) },
        { stage: 4, action: 'Ditandatangani oleh Direksi', actor: 'Budi Santoso', timestamp: new Date(now.getTime() - 15 * oneDay) },
        { stage: 5, action: 'Dokumen diarsipkan ke repositori legal', actor: 'Bimo S.', timestamp: new Date(now.getTime() - 10 * oneDay) },
      ],
      createdBy: luky._id,
    },
    {
      docNumber: 'RISE-2026-0117',
      name: 'Legal Opinion - Restrukturisasi Anak Usaha',
      category: 'Legal Opinion',
      division: 'Direktorat Keuangan',
      priority: 'Normal',
      confidentiality: 'Restricted',
      contractStart: new Date(now.getTime() - 190 * oneDay),
      contractEnd: new Date(now.getTime() - 6 * oneDay), // Expired 6 days ago!
      noDuration: false,
      notes: 'Opini hukum merger entitas anak perusahaan MIND ID.',
      stage: 6, // Expired / Renewal
      stageStatus: 'completed',
      pic: 'Luky P.',
      revisionRequested: false,
      rejected: false,
      decision: {
        type: 'renew',
        justification: 'Kebutuhan pendampingan hukum lanjutan tahun berjalan.',
        considerations: ['Good vendor performance', 'Business need continues'],
        decidedAt: new Date(now.getTime() - 4 * oneDay),
        decidedBy: 'Luky Pratama',
      },
      history: [
        { stage: 5, action: 'Tereksekusi penuh', actor: 'Luky Pratama', timestamp: new Date(now.getTime() - 100 * oneDay) },
        { stage: 6, action: 'Masa berlaku berakhir. Keputusan perpanjangan diajukan.', actor: 'Luky Pratama', timestamp: new Date(now.getTime() - 4 * oneDay) },
      ],
      createdBy: luky._id,
    },
    {
      docNumber: 'RISE-2026-0111',
      name: 'Kontrak Pengadaan Jasa Katering - PT Boga Nusantara',
      category: 'Kontrak Pengadaan Jasa',
      division: 'Human Capital',
      priority: 'Normal',
      confidentiality: 'Internal',
      contractStart: null,
      contractEnd: null,
      noDuration: true,
      notes: 'Dokumen kelayakan hygiene sanitasi tidak memenuhi standar HSE.',
      stage: 3,
      stageStatus: 'rejected',
      pic: 'Sinta W.',
      revisionRequested: false,
      rejected: true,
      history: [
        { stage: 0, action: 'Pengajuan dibuat', actor: 'Luky Pratama', timestamp: new Date(now.getTime() - 12 * oneDay) },
        { stage: 3, action: 'Ditolak: Audit HSE vendor tidak memenuhi batas kelayakan minimal.', actor: 'Sinta Wahyuni', timestamp: new Date(now.getTime() - 6 * oneDay) },
      ],
      createdBy: luky._id,
    },
  ]

  await DocumentModel.insertMany(sampleDocs)

  // 3. Create Real Initial Notifications
  const sampleNotifs = [
    {
      userId: luky._id,
      type: 'approved',
      title: 'Dokumen Disetujui',
      description: 'RISE-2026-0128 telah disetujui dan disahkan oleh Direksi.',
      isRead: false,
    },
    {
      userId: luky._id,
      type: 'revision',
      title: 'Permintaan Revisi',
      description: 'RISE-2026-0139 memerlukan revisi lampiran HAKI dari pemohon.',
      isRead: false,
    },
    {
      userId: luky._id,
      type: 'reminder',
      title: 'Pengingat Jatuh Tempo (H-5)',
      description: 'RISE-2026-0135 jatuh tempo dalam 5 hari ke depan.',
      isRead: false,
    },
    {
      userId: luky._id,
      type: 'signed',
      title: 'Kontrak Tereksekusi',
      description: 'RISE-2026-0117 telah selesai dan diarsipkan.',
      isRead: true,
    },
  ]

  await NotificationModel.insertMany(sampleNotifs)

  // 4. Create Initial Login History
  const sampleLogins = [
    {
      userId: luky._id,
      email: luky.email,
      device: 'Chrome / macOS (Sesi Aktif)',
      ip: '127.0.0.1',
      status: 'Success',
    },
    {
      userId: luky._id,
      email: luky.email,
      device: 'Safari / iPhone 15',
      ip: '10.20.9.44',
      status: 'Success',
    },
  ]

  await LoginHistoryModel.insertMany(sampleLogins)

  return { message: 'Database MongoDB lokal berhasil diisi dengan data real!' }
}
