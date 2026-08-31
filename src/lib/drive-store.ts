import bcrypt from 'bcryptjs'
import { generateDocumentTxtLog, syncDocumentToGoogleDrive } from './gdrive'
import { UserRole } from '@/context/AppContext'

export interface StoredFile {
  originalName: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

export interface StoredVersion {
  version: string
  file: StoredFile
  notes?: string
  uploadedBy: string
  uploadedAt: string
  isFinal: boolean
  fileType: 'initial' | 'revision' | 'supporting' | 'final'
}

export interface StoredHistory {
  stage: number
  action: string
  actor: string
  notes?: string
  versionTag?: string
  timestamp: string
}

export interface StoredDecision {
  type: 'renew' | 'terminate'
  justification: string
  considerations: string[]
  decidedAt: string
  decidedBy?: string
}

export interface StoredDocument {
  _id: string
  docNumber: string
  name: string
  category: string
  division: string
  priority: 'Normal' | 'Urgent' | 'Critical'
  confidentiality: 'Internal' | 'Confidential' | 'Restricted'
  contractStart?: string | null
  contractEnd?: string | null
  noDuration: boolean
  notes?: string
  stage: number
  stageStatus: 'waiting' | 'active' | 'completed' | 'revision' | 'rejected'
  statusLabel?: string
  pic: string
  picEmail?: string
  revisionRequested: boolean
  rejected: boolean
  files: StoredFile[]
  initialDocument?: StoredFile | null
  revisionDocuments: StoredVersion[]
  supportingDocuments: StoredFile[]
  finalDocument?: StoredFile | null
  versions: StoredVersion[]
  decision?: StoredDecision | null
  history: StoredHistory[]
  driveFolderId?: string
  driveFolderUrl?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface StoredUser {
  _id: string
  id: string
  employeeName: string
  email: string
  passwordHash: string
  position: string
  division: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  twoFactorExpires?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StoredNotification {
  _id: string
  userId?: string | null
  type: 'approved' | 'revision' | 'signed' | 'reminder' | 'email_sent' | 'whatsapp_sent' | 'decision'
  title: string
  description: string
  isRead: boolean
  createdAt: string
}

interface GlobalDriveStore {
  documents: StoredDocument[]
  users: StoredUser[]
  notifications: StoredNotification[]
  isInitialized: boolean
}

declare global {
  var __rideDriveStore: GlobalDriveStore | undefined
}

function getStore(): GlobalDriveStore {
  if (!globalThis.__rideDriveStore) {
    globalThis.__rideDriveStore = {
      documents: [],
      users: [],
      notifications: [],
      isInitialized: false,
    }
  }
  return globalThis.__rideDriveStore
}

export async function initAndSeedDriveStore() {
  const store = getStore()
  if (store.isInitialized && store.users.length > 0) {
    return
  }

  const defaultPasswordHash = await bcrypt.hash('Admin@2026', 10)
  const now = new Date().toISOString()

  // 1. Clean official users - only Administrator Toto Rubianto
  store.users = [
    {
      _id: 'usr_toto_admin_01',
      id: 'usr_toto_admin_01',
      employeeName: 'Toto Rubianto',
      email: 'toto.rubianto.17@gmail.com',
      passwordHash: defaultPasswordHash,
      position: 'Head of Enterprise Legal & Governance',
      division: 'Direktorat Legal & Governance',
      role: 'Administrator',
      phone: '+62 812-3456-7890',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // 2. Seed Official RIDE Documents formatted as Google Drive Folders & Text Logs
  store.documents = [
    {
      _id: 'doc_ride_2026_0142',
      docNumber: 'RIDE-2026-0142',
      name: 'Perjanjian Sewa Alat Berat Pertambangan - Site Pomalaa',
      category: 'Perjanjian',
      division: 'Direktorat Operasi',
      priority: 'Urgent',
      confidentiality: 'Internal',
      contractStart: '2026-07-20T00:00:00.000Z',
      contractEnd: '2026-09-14T00:00:00.000Z',
      noDuration: false,
      notes: 'Penyewaan dump truck & excavator 30 ton untuk operasional penambangan bijih nikel.',
      stage: 3,
      stageStatus: 'active',
      statusLabel: 'Persetujuan Legal (Approval)',
      pic: 'Toto Rubianto',
      picEmail: 'toto.rubianto.17@gmail.com',
      revisionRequested: false,
      rejected: false,
      files: [
        {
          originalName: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
          filename: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
          size: 2450000,
          mimeType: 'application/pdf',
          url: '/files/Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
          uploadedAt: '2026-08-20T10:00:00.000Z',
        },
      ],
      initialDocument: {
        originalName: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
        filename: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
        size: 2450000,
        mimeType: 'application/pdf',
        url: '/files/Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
        uploadedAt: '2026-08-20T10:00:00.000Z',
      },
      revisionDocuments: [
        {
          version: 'Rev.01',
          file: {
            originalName: 'Revisi_Pasal_Denda_K3_Rev01.pdf',
            filename: 'Revisi_Pasal_Denda_K3_Rev01.pdf',
            size: 2600000,
            mimeType: 'application/pdf',
            url: '/files/Revisi_Pasal_Denda_K3_Rev01.pdf',
            uploadedAt: '2026-08-24T14:30:00.000Z',
          },
          notes: 'Penyesuaian klausul denda keterlambatan unit dan standar K3 lingkungan pertambangan.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-24T14:30:00.000Z',
          isFinal: false,
          fileType: 'revision',
        },
      ],
      supportingDocuments: [
        {
          originalName: 'Spesifikasi_Teknis_Excavator_30Ton.pdf',
          filename: 'Spesifikasi_Teknis_Excavator_30Ton.pdf',
          size: 1200000,
          mimeType: 'application/pdf',
          url: '/files/Spesifikasi_Teknis_Excavator_30Ton.pdf',
          uploadedAt: '2026-08-20T10:05:00.000Z',
        },
      ],
      finalDocument: null,
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
            filename: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
            size: 2450000,
            mimeType: 'application/pdf',
            url: '/files/Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf',
            uploadedAt: '2026-08-20T10:00:00.000Z',
          },
          notes: 'Draf pengajuan awal pemesanan sewa unit.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-20T10:00:00.000Z',
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'Rev.01',
          file: {
            originalName: 'Revisi_Pasal_Denda_K3_Rev01.pdf',
            filename: 'Revisi_Pasal_Denda_K3_Rev01.pdf',
            size: 2600000,
            mimeType: 'application/pdf',
            url: '/files/Revisi_Pasal_Denda_K3_Rev01.pdf',
            uploadedAt: '2026-08-24T14:30:00.000Z',
          },
          notes: 'Penyesuaian klausul denda keterlambatan unit dan standar K3 lingkungan pertambangan.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-24T14:30:00.000Z',
          isFinal: false,
          fileType: 'revision',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Toto Rubianto',
          notes: 'Pengajuan draf sewa alat berat site Pomalaa.',
          versionTag: 'V0',
          timestamp: '2026-08-20T10:00:00.000Z',
        },
        {
          stage: 1,
          action: 'Review Kelayakan Dokumen',
          actor: 'Toto Rubianto',
          notes: 'Kelayakan teknis dan anggaran telah diverifikasi.',
          versionTag: 'V0',
          timestamp: '2026-08-22T11:20:00.000Z',
        },
        {
          stage: 2,
          action: 'Unggah Revisi Dokumen (Rev.01)',
          actor: 'Toto Rubianto',
          notes: 'Penyempurnaan pasal ganti rugi dan denda kelaikan alat.',
          versionTag: 'Rev.01',
          timestamp: '2026-08-24T14:30:00.000Z',
        },
      ],
      driveFolderId: 'gdrive-ride-2026-0142',
      driveFolderUrl: 'https://drive.google.com/drive/search?q=RIDE-2026-0142',
      createdBy: 'usr_toto_admin_01',
      createdAt: '2026-08-20T10:00:00.000Z',
      updatedAt: '2026-08-24T14:30:00.000Z',
    },
    {
      _id: 'doc_ride_2026_0143',
      docNumber: 'RIDE-2026-0143',
      name: 'Izin Usaha Pertambangan Khusus (IUPK) Pengolahan & Pemurnian',
      category: 'Perizinan',
      division: 'Direktorat Pengembangan Usaha',
      priority: 'Critical',
      confidentiality: 'Restricted',
      contractStart: '2026-06-01T00:00:00.000Z',
      contractEnd: '2026-09-08T00:00:00.000Z',
      noDuration: false,
      notes: 'Perpanjangan dokumen izin pemurnian mineral tembaga dan emas smelter.',
      stage: 5,
      stageStatus: 'completed',
      statusLabel: 'Dokumen Final Sah',
      pic: 'Toto Rubianto',
      picEmail: 'toto.rubianto.17@gmail.com',
      revisionRequested: false,
      rejected: false,
      files: [
        {
          originalName: 'IUPK_Pemurnian_Final_Sah.pdf',
          filename: 'IUPK_Pemurnian_Final_Sah.pdf',
          size: 4200000,
          mimeType: 'application/pdf',
          url: '/files/IUPK_Pemurnian_Final_Sah.pdf',
          uploadedAt: '2026-08-25T16:00:00.000Z',
        },
      ],
      initialDocument: {
        originalName: 'Draf_Pengajuan_IUPK_V0.pdf',
        filename: 'Draf_Pengajuan_IUPK_V0.pdf',
        size: 3800000,
        mimeType: 'application/pdf',
        url: '/files/Draf_Pengajuan_IUPK_V0.pdf',
        uploadedAt: '2026-08-01T09:00:00.000Z',
      },
      revisionDocuments: [],
      supportingDocuments: [],
      finalDocument: {
        originalName: 'IUPK_Pemurnian_Final_Sah.pdf',
        filename: 'IUPK_Pemurnian_Final_Sah.pdf',
        size: 4200000,
        mimeType: 'application/pdf',
        url: '/files/IUPK_Pemurnian_Final_Sah.pdf',
        uploadedAt: '2026-08-25T16:00:00.000Z',
      },
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Draf_Pengajuan_IUPK_V0.pdf',
            filename: 'Draf_Pengajuan_IUPK_V0.pdf',
            size: 3800000,
            mimeType: 'application/pdf',
            url: '/files/Draf_Pengajuan_IUPK_V0.pdf',
            uploadedAt: '2026-08-01T09:00:00.000Z',
          },
          notes: 'Pengajuan draf awal berkas perizinan IUPK.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-01T09:00:00.000Z',
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'FINAL',
          file: {
            originalName: 'IUPK_Pemurnian_Final_Sah.pdf',
            filename: 'IUPK_Pemurnian_Final_Sah.pdf',
            size: 4200000,
            mimeType: 'application/pdf',
            url: '/files/IUPK_Pemurnian_Final_Sah.pdf',
            uploadedAt: '2026-08-25T16:00:00.000Z',
          },
          notes: 'Dokumen final telah ditandatangani dan diverifikasi oleh Kementerian ESDM & Direksi.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-25T16:00:00.000Z',
          isFinal: true,
          fileType: 'final',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Toto Rubianto',
          notes: 'Draf IUPK diajukan.',
          versionTag: 'V0',
          timestamp: '2026-08-01T09:00:00.000Z',
        },
        {
          stage: 4,
          action: 'Persetujuan Direksi (BOD Signed)',
          actor: 'Toto Rubianto',
          notes: 'Disetujui penuh oleh Dewan Direksi.',
          versionTag: 'V0',
          timestamp: '2026-08-20T15:00:00.000Z',
        },
        {
          stage: 5,
          action: 'Unggah Dokumen Final (FINAL)',
          actor: 'Toto Rubianto',
          notes: 'Dokumen final diarsipkan resmi ke Google Drive RIDE.',
          versionTag: 'FINAL',
          timestamp: '2026-08-25T16:00:00.000Z',
        },
      ],
      driveFolderId: 'gdrive-ride-2026-0143',
      driveFolderUrl: 'https://drive.google.com/drive/search?q=RIDE-2026-0143',
      createdBy: 'usr_toto_admin_01',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-25T16:00:00.000Z',
    },
  ]

  store.notifications = [
    {
      _id: 'notif_01',
      userId: 'usr_toto_admin_01',
      type: 'signed',
      title: 'Dokumen Final Tersedia: RIDE-2026-0143',
      description: 'Dokumen IUPK Pengolahan & Pemurnian telah diterbitkan versi FINAL.',
      isRead: false,
      createdAt: now,
    },
    {
      _id: 'notif_02',
      userId: 'usr_toto_admin_01',
      type: 'email_sent',
      title: 'Penyimpanan Google Drive Aktif',
      description: 'Sistem RIDE telah terintegrasi dengan Google Drive File Engine.',
      isRead: false,
      createdAt: now,
    },
  ]

  store.isInitialized = true
}

// ----------------------------------------------------
// DOCUMENT STORE OPERATIONS
// ----------------------------------------------------

export async function getDriveDocuments(query = '', status = '', category = '') {
  await initAndSeedDriveStore()
  const store = getStore()
  let docs = [...store.documents]

  if (query) {
    const q = query.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.docNumber.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.pic.toLowerCase().includes(q) ||
        d.division.toLowerCase().includes(q)
    )
  }

  if (status) {
    if (status === 'Perlu Revisi') docs = docs.filter((d) => d.revisionRequested)
    else if (status === 'Sedang Diproses') docs = docs.filter((d) => d.stageStatus === 'active' && !d.revisionRequested)
    else if (status === 'Dokumen Final' || status === 'Selesai') docs = docs.filter((d) => d.stage === 5 || d.stageStatus === 'completed')
  }

  if (category) {
    docs = docs.filter((d) => d.category.toLowerCase() === category.toLowerCase())
  }

  return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getDriveDocumentById(id: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  return store.documents.find((d) => d._id === id || d.docNumber === id) || null
}

export async function saveDriveDocument(doc: StoredDocument) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.documents.findIndex((d) => d._id === doc._id)
  if (idx >= 0) {
    store.documents[idx] = { ...doc, updatedAt: new Date().toISOString() }
  } else {
    store.documents.unshift(doc)
  }
  return doc
}

export async function deleteDriveDocument(id: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.documents.findIndex((d) => d._id === id || d.docNumber === id)
  if (idx >= 0) {
    store.documents.splice(idx, 1)
    return true
  }
  return false
}

// ----------------------------------------------------
// USER STORE OPERATIONS
// ----------------------------------------------------

export async function getDriveUsers() {
  await initAndSeedDriveStore()
  const store = getStore()
  return store.users.map(({ passwordHash, twoFactorSecret, ...safe }) => safe)
}

export async function getDriveUserByEmail(email: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

export async function getDriveUserById(id: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  return store.users.find((u) => u._id === id || u.id === id) || null
}

export async function saveDriveUser(user: StoredUser) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.users.findIndex((u) => u._id === user._id || u.email.toLowerCase() === user.email.toLowerCase())
  if (idx >= 0) {
    store.users[idx] = { ...user, updatedAt: new Date().toISOString() }
  } else {
    store.users.push(user)
  }
  return user
}

export async function deleteDriveUser(id: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.users.findIndex((u) => u._id === id || u.id === id)
  if (idx >= 0) {
    store.users.splice(idx, 1)
    return true
  }
  return false
}

// ----------------------------------------------------
// NOTIFICATION OPERATIONS
// ----------------------------------------------------

export async function getDriveNotifications(userId?: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  if (userId) {
    return store.notifications.filter((n) => !n.userId || n.userId === userId)
  }
  return store.notifications
}

export async function addDriveNotification(notif: Omit<StoredNotification, '_id' | 'createdAt'>) {
  await initAndSeedDriveStore()
  const store = getStore()
  const newNotif: StoredNotification = {
    ...notif,
    _id: 'notif_' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
  }
  store.notifications.unshift(newNotif)
  return newNotif
}

export async function markDriveNotificationsRead(userId?: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  store.notifications = store.notifications.map((n) => {
    if (!userId || n.userId === userId) {
      return { ...n, isRead: true }
    }
    return n
  })
}
