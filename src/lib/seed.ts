import bcrypt from 'bcryptjs'
import { connectToDatabase } from './db'
import { User } from '@/models/User'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'

export async function seedDatabase(force = false) {
  await connectToDatabase()

  const userCount = await User.countDocuments()
  if (userCount > 0 && !force) {
    return { message: 'Database already initialized.' }
  }

  if (force) {
    await Promise.all([
      User.deleteMany({}),
      DocumentModel.deleteMany({}),
      NotificationModel.deleteMany({}),
    ])
  }

  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  // 1. Create Corporate Users with 5 Enterprise Roles
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10)

  const users = await User.insertMany([
    {
      employeeName: 'Toto Rubianto',
      email: 'toto.rubianto.17@gmail.com',
      passwordHash: defaultPasswordHash,
      position: 'Head of System & Digital Architecture',
      division: 'Corporate Technology & Governance',
      role: 'Administrator',
      phone: '+62 811-0000-1111',
      twoFactorEnabled: true,
    },
    {
      employeeName: 'Luky Tri Sasongko',
      email: 'lukytrisasongko812@gmail.com',
      passwordHash: defaultPasswordHash,
      position: 'Senior Reviewer & Legal Counsel',
      division: 'Direktorat Legal & Compliance',
      role: 'Reviewer',
      phone: '+62 812-9876-5432',
      twoFactorEnabled: true,
    },
    {
      employeeName: 'Budi Santoso, S.H., M.Kn.',
      email: 'budi.santoso@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'Direktur Operasi & Approver',
      division: 'Direksi / Management',
      role: 'Approver',
      phone: '+62 811-9988-7766',
      twoFactorEnabled: true,
    },
    {
      employeeName: 'Sinta Wahyuni',
      email: 'sinta.wahyuni@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'Document Controller & Compliance Officer',
      division: 'Document Management Unit',
      role: 'Document Controller',
      phone: '+62 813-1122-3344',
      twoFactorEnabled: true,
    },
    {
      employeeName: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@resourcesid.co.id',
      passwordHash: defaultPasswordHash,
      position: 'Project Requester / Procurement',
      division: 'Direktorat Operasi',
      role: 'Requester',
      phone: '+62 812-3344-5566',
      twoFactorEnabled: true,
    },
  ])

  const toto = users[0]
  const luky = users[1]

  // 2. Sample Documents with Version Tracking (V0, Rev.01, FINAL) & Package Structure
  const sampleDocs = [
    {
      docNumber: 'RIDE-2026-0142',
      name: 'Perjanjian Sewa Alat Berat - PT Bara Kencana',
      category: 'Perjanjian',
      division: 'Direktorat Operasi',
      priority: 'Normal',
      confidentiality: 'Internal',
      contractStart: new Date(now.getTime() - 40 * oneDay),
      contractEnd: new Date(now.getTime() + 14 * oneDay), // H-14 Expiry
      noDuration: false,
      notes: 'Sewa dump truck dan excavator untuk site operasional Kalimantan Timur.',
      stage: 2, // Legal Drafting
      stageStatus: 'active',
      statusLabel: 'Sedang Diproses',
      pic: 'Luky Tri Sasongko',
      picEmail: 'lukytrisasongko812@gmail.com',
      revisionRequested: false,
      rejected: false,
      createdBy: luky._id,
      files: [
        {
          originalName: 'Draft_Perjanjian_Sewa_Alat_Berat_v0.pdf',
          filename: 'draft_sewa_v0.pdf',
          size: 1420000,
          mimeType: 'application/pdf',
          url: '/files/draft_sewa_v0.pdf',
          uploadedAt: new Date(now.getTime() - 10 * oneDay),
        },
        {
          originalName: 'Revisi_Pasal_Kompensasi_Rev01.pdf',
          filename: 'revisi_pasal_rev01.pdf',
          size: 1560000,
          mimeType: 'application/pdf',
          url: '/files/revisi_pasal_rev01.pdf',
          uploadedAt: new Date(now.getTime() - 3 * oneDay),
        },
      ],
      initialDocument: {
        originalName: 'Draft_Perjanjian_Sewa_Alat_Berat_v0.pdf',
        filename: 'draft_sewa_v0.pdf',
        size: 1420000,
        mimeType: 'application/pdf',
        url: '/files/draft_sewa_v0.pdf',
        uploadedAt: new Date(now.getTime() - 10 * oneDay),
      },
      revisionDocuments: [
        {
          version: 'Rev.01',
          file: {
            originalName: 'Revisi_Pasal_Kompensasi_Rev01.pdf',
            filename: 'revisi_pasal_rev01.pdf',
            size: 1560000,
            mimeType: 'application/pdf',
            url: '/files/revisi_pasal_rev01.pdf',
            uploadedAt: new Date(now.getTime() - 3 * oneDay),
          },
          notes: 'Penyesuaian klausul denda keterlambatan dan standar K3 site operasional.',
          uploadedBy: 'Luky Tri Sasongko',
          uploadedAt: new Date(now.getTime() - 3 * oneDay),
          isFinal: false,
          fileType: 'revision',
        },
      ],
      supportingDocuments: [
        {
          originalName: 'Spesifikasi_Teknis_Excavator.pdf',
          filename: 'spek_teknis.pdf',
          size: 890000,
          mimeType: 'application/pdf',
          url: '/files/spek_teknis.pdf',
          uploadedAt: new Date(now.getTime() - 10 * oneDay),
        },
      ],
      finalDocument: null,
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Draft_Perjanjian_Sewa_Alat_Berat_v0.pdf',
            filename: 'draft_sewa_v0.pdf',
            size: 1420000,
            mimeType: 'application/pdf',
            url: '/files/draft_sewa_v0.pdf',
            uploadedAt: new Date(now.getTime() - 10 * oneDay),
          },
          notes: 'Pengajuan awal dokumen kontrak sewa alat berat.',
          uploadedBy: 'Ahmad Fauzi',
          uploadedAt: new Date(now.getTime() - 10 * oneDay),
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'Rev.01',
          file: {
            originalName: 'Revisi_Pasal_Kompensasi_Rev01.pdf',
            filename: 'revisi_pasal_rev01.pdf',
            size: 1560000,
            mimeType: 'application/pdf',
            url: '/files/revisi_pasal_rev01.pdf',
            uploadedAt: new Date(now.getTime() - 3 * oneDay),
          },
          notes: 'Penyesuaian klausul denda keterlambatan dan standar K3 site operasional.',
          uploadedBy: 'Luky Tri Sasongko',
          uploadedAt: new Date(now.getTime() - 3 * oneDay),
          isFinal: false,
          fileType: 'revision',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Ahmad Fauzi (Requester)',
          notes: 'Pengajuan draft awal dokumen kontrak.',
          versionTag: 'V0',
          timestamp: new Date(now.getTime() - 10 * oneDay),
        },
        {
          stage: 1,
          action: 'Pemeriksaan Awal & Catatan Revisi',
          actor: 'Luky Tri Sasongko (Reviewer)',
          notes: 'Perlu penyesuaian klausul denda keterlambatan dan jaminan perawatan alat.',
          versionTag: 'V0',
          timestamp: new Date(now.getTime() - 5 * oneDay),
        },
        {
          stage: 2,
          action: 'Unggah Revisi Dokumen (Rev.01)',
          actor: 'Luky Tri Sasongko (Reviewer)',
          notes: 'Klausul kompensasi dan K3 telah disesuaikan.',
          versionTag: 'Rev.01',
          timestamp: new Date(now.getTime() - 3 * oneDay),
        },
      ],
    },
    {
      docNumber: 'RIDE-2026-0143',
      name: 'Adendum Kontrak Pengangkutan Logistik Nikel - PT Samudera Maju',
      category: 'Adendum',
      division: 'Direktorat Logistik & Supply Chain',
      priority: 'Urgent',
      confidentiality: 'Confidential',
      contractStart: new Date(now.getTime() - 90 * oneDay),
      contractEnd: new Date(now.getTime() + 4 * oneDay), // H-4 Critical
      noDuration: false,
      notes: 'Penyesuaian kuota tonase pengapalan nikel kuartal I 2026.',
      stage: 4, // BOD Approval / Signed
      stageStatus: 'active',
      statusLabel: 'Menunggu Persetujuan Direksi',
      pic: 'Luky Tri Sasongko',
      picEmail: 'lukytrisasongko812@gmail.com',
      revisionRequested: false,
      rejected: false,
      createdBy: luky._id,
      files: [
        {
          originalName: 'Adendum_Logistik_Nikel_Rev02_FinalDraft.pdf',
          filename: 'adendum_nikel_rev02.pdf',
          size: 2100000,
          mimeType: 'application/pdf',
          url: '/files/adendum_nikel_rev02.pdf',
          uploadedAt: new Date(now.getTime() - 1 * oneDay),
        },
      ],
      initialDocument: {
        originalName: 'Adendum_Logistik_Nikel_v0.pdf',
        filename: 'adendum_nikel_v0.pdf',
        size: 1980000,
        mimeType: 'application/pdf',
        url: '/files/adendum_nikel_v0.pdf',
        uploadedAt: new Date(now.getTime() - 14 * oneDay),
      },
      revisionDocuments: [
        {
          version: 'Rev.01',
          file: {
            originalName: 'Adendum_Logistik_Nikel_Rev01.pdf',
            filename: 'adendum_nikel_rev01.pdf',
            size: 2050000,
            mimeType: 'application/pdf',
            url: '/files/adendum_nikel_rev01.pdf',
            uploadedAt: new Date(now.getTime() - 7 * oneDay),
          },
          notes: 'Penyesuaian tarif freight charter dan terms demurrage.',
          uploadedBy: 'Luky Tri Sasongko',
          uploadedAt: new Date(now.getTime() - 7 * oneDay),
          isFinal: false,
          fileType: 'revision',
        },
        {
          version: 'Rev.02',
          file: {
            originalName: 'Adendum_Logistik_Nikel_Rev02_FinalDraft.pdf',
            filename: 'adendum_nikel_rev02.pdf',
            size: 2100000,
            mimeType: 'application/pdf',
            url: '/files/adendum_nikel_rev02.pdf',
            uploadedAt: new Date(now.getTime() - 1 * oneDay),
          },
          notes: 'Finalisasi klausul volume pengangkutan dan tanda tangan legal head.',
          uploadedBy: 'Luky Tri Sasongko',
          uploadedAt: new Date(now.getTime() - 1 * oneDay),
          isFinal: false,
          fileType: 'revision',
        },
      ],
      supportingDocuments: [],
      finalDocument: null,
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Adendum_Logistik_Nikel_v0.pdf',
            filename: 'adendum_nikel_v0.pdf',
            size: 1980000,
            mimeType: 'application/pdf',
            url: '/files/adendum_nikel_v0.pdf',
            uploadedAt: new Date(now.getTime() - 14 * oneDay),
          },
          notes: 'Draft pengajuan awal adendum.',
          uploadedBy: 'Ahmad Fauzi',
          uploadedAt: new Date(now.getTime() - 14 * oneDay),
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'Rev.01',
          file: {
            originalName: 'Adendum_Logistik_Nikel_Rev01.pdf',
            filename: 'adendum_nikel_rev01.pdf',
            size: 2050000,
            mimeType: 'application/pdf',
            url: '/files/adendum_nikel_rev01.pdf',
            uploadedAt: new Date(now.getTime() - 7 * oneDay),
          },
          notes: 'Penyesuaian tarif freight charter.',
          uploadedBy: 'Luky Tri Sasongko',
          uploadedAt: new Date(now.getTime() - 7 * oneDay),
          isFinal: false,
          fileType: 'revision',
        },
        {
          version: 'Rev.02',
          file: {
            originalName: 'Adendum_Logistik_Nikel_Rev02_FinalDraft.pdf',
            filename: 'adendum_nikel_rev02.pdf',
            size: 2100000,
            mimeType: 'application/pdf',
            url: '/files/adendum_nikel_rev02.pdf',
            uploadedAt: new Date(now.getTime() - 1 * oneDay),
          },
          notes: 'Finalisasi klausul volume pengangkutan.',
          uploadedBy: 'Luky Tri Sasongko',
          uploadedAt: new Date(now.getTime() - 1 * oneDay),
          isFinal: false,
          fileType: 'revision',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Ahmad Fauzi (Requester)',
          notes: 'Permohonan adendum penambahan kuota tonase.',
          versionTag: 'V0',
          timestamp: new Date(now.getTime() - 14 * oneDay),
        },
        {
          stage: 1,
          action: 'Review Legal Manager',
          actor: 'Sinta Wahyuni (Reviewer)',
          notes: 'Disetujui untuk drafting adendum resmi.',
          versionTag: 'V0',
          timestamp: new Date(now.getTime() - 10 * oneDay),
        },
        {
          stage: 3,
          action: 'Approval Legal Manager Disetujui (Rev.02)',
          actor: 'Sinta Wahyuni (Reviewer)',
          notes: 'Semua klausul sah dan siap diajukan ke Direksi.',
          versionTag: 'Rev.02',
          timestamp: new Date(now.getTime() - 1 * oneDay),
        },
      ],
    },
    {
      docNumber: 'RIDE-2026-0144',
      name: 'Izin Pinjam Pakai Kawasan Hutan (IPPKH) Koridor Smelter',
      category: 'Perizinan',
      division: 'Direktorat Eksplorasi & Lingkungan',
      priority: 'Critical',
      confidentiality: 'Restricted',
      contractStart: new Date(now.getTime() - 365 * oneDay),
      contractEnd: new Date(now.getTime() + 180 * oneDay),
      noDuration: false,
      notes: 'Persetujuan pelepasan kawasan hutan untuk jalur transmisi energi smelter.',
      stage: 5, // Archived / Final
      stageStatus: 'completed',
      statusLabel: 'Selesai / Dokumen Final',
      pic: 'Sinta Wahyuni',
      picEmail: 'sinta.wahyuni@resourcesid.co.id',
      revisionRequested: false,
      rejected: false,
      createdBy: toto._id,
      files: [
        {
          originalName: 'SK_Menteri_LHK_IPPKH_Final_Sah.pdf',
          filename: 'sk_menlhk_ippkh_final.pdf',
          size: 4500000,
          mimeType: 'application/pdf',
          url: '/files/sk_menlhk_ippkh_final.pdf',
          uploadedAt: new Date(now.getTime() - 30 * oneDay),
        },
      ],
      initialDocument: {
        originalName: 'Draft_Permohonan_IPPKH_v0.pdf',
        filename: 'draft_ippkh_v0.pdf',
        size: 3200000,
        mimeType: 'application/pdf',
        url: '/files/draft_ippkh_v0.pdf',
        uploadedAt: new Date(now.getTime() - 60 * oneDay),
      },
      revisionDocuments: [],
      supportingDocuments: [
        {
          originalName: 'Peta_Tutupan_Lahan_GIS.pdf',
          filename: 'peta_gis.pdf',
          size: 6100000,
          mimeType: 'application/pdf',
          url: '/files/peta_gis.pdf',
          uploadedAt: new Date(now.getTime() - 60 * oneDay),
        },
      ],
      finalDocument: {
        originalName: 'SK_Menteri_LHK_IPPKH_Final_Sah.pdf',
        filename: 'sk_menlhk_ippkh_final.pdf',
        size: 4500000,
        mimeType: 'application/pdf',
        url: '/files/sk_menlhk_ippkh_final.pdf',
        uploadedAt: new Date(now.getTime() - 30 * oneDay),
      },
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Draft_Permohonan_IPPKH_v0.pdf',
            filename: 'draft_ippkh_v0.pdf',
            size: 3200000,
            mimeType: 'application/pdf',
            url: '/files/draft_ippkh_v0.pdf',
            uploadedAt: new Date(now.getTime() - 60 * oneDay),
          },
          notes: 'Pengajuan berkas perizinan IPPKH ke kementerian.',
          uploadedBy: 'Sinta Wahyuni',
          uploadedAt: new Date(now.getTime() - 60 * oneDay),
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'FINAL',
          file: {
            originalName: 'SK_Menteri_LHK_IPPKH_Final_Sah.pdf',
            filename: 'sk_menlhk_ippkh_final.pdf',
            size: 4500000,
            mimeType: 'application/pdf',
            url: '/files/sk_menlhk_ippkh_final.pdf',
            uploadedAt: new Date(now.getTime() - 30 * oneDay),
          },
          notes: 'SK Menteri LHK resmi terbit dan telah diverifikasi Document Controller.',
          uploadedBy: 'Sinta Wahyuni',
          uploadedAt: new Date(now.getTime() - 30 * oneDay),
          isFinal: true,
          fileType: 'final',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Sinta Wahyuni',
          notes: 'Permohonan verifikasi kelengkapan berkas IPPKH.',
          versionTag: 'V0',
          timestamp: new Date(now.getTime() - 60 * oneDay),
        },
        {
          stage: 4,
          action: 'Persetujuan & Tanda Tangan Direksi',
          actor: 'Budi Santoso (Approver)',
          notes: 'Dokumen disetujui dan ditandatangani.',
          versionTag: 'V0',
          timestamp: new Date(now.getTime() - 35 * oneDay),
        },
        {
          stage: 5,
          action: 'Unggah Dokumen Final (FINAL) & Pengarsipan',
          actor: 'Sinta Wahyuni (Document Controller)',
          notes: 'Dokumen final diunggah ke arsip resmi RIDE.',
          versionTag: 'FINAL',
          timestamp: new Date(now.getTime() - 30 * oneDay),
        },
      ],
    },
  ]

  await DocumentModel.insertMany(sampleDocs)

  // 3. Initial Corporate System Notifications
  await NotificationModel.insertMany([
    {
      userId: toto._id,
      type: 'approved',
      title: 'Persetujuan Dokumen Final Selesai',
      description: 'Dokumen RIDE-2026-0144 (IPPKH Koridor Smelter) telah sah dan siap diunduh.',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      userId: luky._id,
      type: 'revision',
      title: 'Catatan Revisi Ditambahkan',
      description: 'Reviewer menambahkan catatan revisi pada dokumen RIDE-2026-0142.',
      isRead: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      userId: luky._id,
      type: 'reminder',
      title: 'Pengingat Jatuh Tempo (H-4)',
      description: 'Dokumen RIDE-2026-0143 akan berakhir dalam 4 hari.',
      isRead: false,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  ])

  return { message: 'Database RIDE berhasil diisi dengan data real!' }
}
