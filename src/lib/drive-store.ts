import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { UserRole } from '@/context/AppContext'
import {
  syncUserToGoogleDrive,
  syncDocumentToGoogleDrive,
  getUsersFromGoogleDriveRegistry,
  getUserFromGoogleDriveByEmail,
  getUserFromGoogleDriveById,
  deleteUserFromGoogleDrive,
  trashDocumentInGoogleDrive,
  getDeletedDocsFromGoogleDriveRegistry,
  addDeletedDocsToGoogleDriveRegistry,
  getDocumentsFromGoogleDriveRegistry,
  saveDocumentsToGoogleDriveRegistry,
} from './gdrive'
import { connectToDatabase } from './db'
import { User } from '@/models/User'
import { DocumentModel } from '@/models/Document'

const LOCAL_USERS_CACHE_FILE = '/tmp/ride_users_persistent_cache.json'
const LOCAL_DOCS_CACHE_FILE = '/tmp/ride_docs_persistent_cache.json'
const LOCAL_DELETED_DOCS_CACHE_FILE = '/tmp/ride_deleted_docs_persistent_cache.json'

function readLocalUsersCache(): StoredUser[] | null {
  try {
    if (fs.existsSync(LOCAL_USERS_CACHE_FILE)) {
      const data = fs.readFileSync(LOCAL_USERS_CACHE_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return null
}

function writeLocalUsersCache(users: StoredUser[]) {
  try {
    fs.writeFileSync(LOCAL_USERS_CACHE_FILE, JSON.stringify(users), 'utf-8')
  } catch (e) {
    // Ignore write errors
  }
}

function readLocalDocsCache(): StoredDocument[] | null {
  try {
    if (fs.existsSync(LOCAL_DOCS_CACHE_FILE)) {
      const data = fs.readFileSync(LOCAL_DOCS_CACHE_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return null
}

function writeLocalDocsCache(docs: StoredDocument[]) {
  try {
    fs.writeFileSync(LOCAL_DOCS_CACHE_FILE, JSON.stringify(docs), 'utf-8')
  } catch (e) {
    // Ignore write errors
  }
}

function readLocalDeletedDocsCache(): string[] {
  try {
    if (fs.existsSync(LOCAL_DELETED_DOCS_CACHE_FILE)) {
      const data = fs.readFileSync(LOCAL_DELETED_DOCS_CACHE_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return []
}

function writeLocalDeletedDocsCache(deletedIds: string[]) {
  try {
    fs.writeFileSync(LOCAL_DELETED_DOCS_CACHE_FILE, JSON.stringify(Array.from(new Set(deletedIds))), 'utf-8')
  } catch (e) {
    // Ignore write errors
  }
}

export interface StoredFile {
  originalName: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
  dataUrl?: string
  driveFileId?: string
  driveViewUrl?: string
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
  type: 'renew' | 'terminate' | 'amendment'
  justification: string
  considerations: string[]
  decidedAt: string
  decidedBy?: string
  recommendation?: string
}

export interface StoredReminderConfig {
  h60: boolean
  h30: boolean
  h15: boolean
  h7: boolean
  h1: boolean
  customNotes?: string
  lastSentMilestone?: string
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
  reminders?: StoredReminderConfig | null
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
  avatarFileId?: string
  coverUrl?: string
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
  if (store.isInitialized && store.users.length > 0 && store.documents.length >= 5) {
    return
  }

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10)
  const now = new Date().toISOString()

  // 1. Clean official users - Administrator Toto, Reviewer Luky, Requester Robert
  const seedUsers: StoredUser[] = [
    {
      _id: 'usr_toto_admin_01',
      id: 'usr_toto_admin_01',
      employeeName: 'Toto Rubianto',
      email: 'toto.rubianto.17@gmail.com',
      passwordHash: defaultPasswordHash,
      position: 'Head of Enterprise Legal & Governance',
      division: 'Direktorat Legal & Governance',
      role: 'System Administrator',
      phone: '+62 812-3456-7890',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'usr_luky_reviewer_01',
      id: 'usr_luky_reviewer_01',
      employeeName: 'Luky Tri Sasongko',
      email: 'lukytrisasongko812@gmail.com',
      passwordHash: defaultPasswordHash,
      position: 'Senior Legal Counsel & Compliance Reviewer',
      division: 'Direktorat Legal & Compliance',
      role: 'Legal Officer',
      phone: '+62 812-9876-5432',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: 'usr_robert_requester_01',
      id: 'usr_robert_requester_01',
      employeeName: 'Robert Pamungkas',
      email: 'robertpamungkas86@gmail.com',
      passwordHash: defaultPasswordHash,
      position: 'Staff Operasional & Pengadaan Lapangan',
      division: 'Direktorat Operasi & Logistik',
      role: 'User',
      phone: '+62 813-1122-3344',
      twoFactorEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Initialize store.users with seed users if currently empty
  if (store.users.length === 0) {
    store.users = [...seedUsers]
  }

  // 2. Load from local disk cache (/tmp)
  const cachedUsers = readLocalUsersCache()
  if (cachedUsers && cachedUsers.length > 0) {
    for (const cu of cachedUsers) {
      const idx = store.users.findIndex(
        (u) => u.email.toLowerCase() === cu.email.toLowerCase() || u._id === cu._id
      )
      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...cu }
      } else {
        store.users.push(cu)
      }
    }
  }

  // 3. Cloud Source of Truth: Google Drive User Registry
  try {
    const driveUsers = await getUsersFromGoogleDriveRegistry()
    if (driveUsers && driveUsers.length > 0) {
      for (const du of driveUsers) {
        const idx = store.users.findIndex(
          (u) =>
            u.email.toLowerCase() === du.email.toLowerCase() ||
            u._id === du._id ||
            u.id === du.id ||
            (du.email.toLowerCase() === 'luckytrisasongko812@gmail.com' && u.email.toLowerCase() === 'luckytrisasongko812@gmail.com')
        )
        if (idx >= 0) {
          store.users[idx] = { ...store.users[idx], ...du }
        } else {
          store.users.push(du)
        }
      }
      writeLocalUsersCache(store.users)
    }
  } catch (driveErr) {
    console.warn('[GDrive initAndSeed restore warning]', driveErr)
  }

  // 4. Try MongoDB in try/catch (graceful fallback)
  try {
    await connectToDatabase()
    const dbUsers = await User.find({}).lean()
    if (dbUsers && dbUsers.length > 0) {
      for (const u of dbUsers) {
        const mappedUser: StoredUser = {
          _id: u._id.toString(),
          id: u._id.toString(),
          employeeName: u.employeeName,
          email: u.email,
          passwordHash: u.passwordHash,
          position: u.position || 'Reviewer',
          division: u.division || 'Direktorat Umum',
          role: (u.role || 'Reviewer') as UserRole,
          phone: u.phone,
          avatarUrl: u.avatarUrl || undefined,
          coverUrl: u.coverUrl || undefined,
          twoFactorEnabled: u.twoFactorEnabled ?? true,
          isActive: u.isActive ?? true,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : now,
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : now,
        }
        const idx = store.users.findIndex((x) => x.email.toLowerCase() === mappedUser.email.toLowerCase())
        if (idx >= 0) {
          store.users[idx] = { ...store.users[idx], ...mappedUser }
        } else {
          store.users.push(mappedUser)
        }
      }
      writeLocalUsersCache(store.users)
    }
  } catch (err) {
    // MongoDB auth issues gracefully ignored; Google Drive is our primary cloud source of truth
  }

  writeLocalUsersCache(store.users)

  // 2. Official Corporate Documents seeded directly with Google Drive Folder IDs & Versions
  store.documents = [
    {
      _id: 'doc_ride_2026_0150',
      docNumber: 'RIDE-2026-0150',
      name: 'Perjanjian Kerja Sama Jual Beli RQD',
      category: 'Kontrak Hukum',
      division: 'Direktorat Operasi & Logistik',
      priority: 'Normal',
      confidentiality: 'Internal',
      contractStart: '2026-01-09T00:00:00.000Z',
      contractEnd: '2026-10-09T00:00:00.000Z',
      noDuration: false,
      notes: 'Pengajuan draf perjanjian kerja sama jual beli RQD site Pomalaa.',
      stage: 0,
      stageStatus: 'active',
      statusLabel: 'Pengajuan Baru (V0)',
      pic: 'Robert Pamungkas',
      picEmail: 'robertpamungkas86@gmail.com',
      revisionRequested: false,
      rejected: false,
      files: [
        {
          originalName: 'File 4 Peralatan.docx',
          filename: 'file_4_peralatan.docx',
          size: 788464,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '/files/File 4 Peralatan.docx',
          uploadedAt: '2026-08-31T14:15:59.000Z',
        },
      ],
      initialDocument: {
        originalName: 'File 4 Peralatan.docx',
        filename: 'file_4_peralatan.docx',
        size: 788464,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '/files/File 4 Peralatan.docx',
        uploadedAt: '2026-08-31T14:15:59.000Z',
      },
      revisionDocuments: [],
      supportingDocuments: [],
      finalDocument: null,
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'File 4 Peralatan.docx',
            filename: 'file_4_peralatan.docx',
            size: 788464,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            url: '/files/File 4 Peralatan.docx',
            uploadedAt: '2026-08-31T14:15:59.000Z',
          },
          notes: 'Pengajuan draf dokumen awal.',
          uploadedBy: 'Robert Pamungkas',
          uploadedAt: '2026-08-31T14:15:59.000Z',
          isFinal: false,
          fileType: 'initial',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Robert Pamungkas',
          notes: 'Dokumen berhasil diajukan ke antrean verifikasi.',
          versionTag: 'V0',
          timestamp: '2026-08-31T14:15:59.000Z',
        },
      ],
      driveFolderId: '1G4-ppRr4j0LEAqGc1E7DfJWk_6HID6wd',
      driveFolderUrl: 'https://drive.google.com/drive/folders/1G4-ppRr4j0LEAqGc1E7DfJWk_6HID6wd',
      createdBy: 'usr_robert_requester_01',
      createdAt: '2026-08-31T14:15:59.000Z',
      updatedAt: '2026-08-31T14:15:59.000Z',
    },
    {
      _id: 'doc_ride_2026_0151',
      docNumber: 'RIDE-2026-0151',
      name: 'Perjanjian Sewa Motor Operasional Lapangan',
      category: 'Kontrak Hukum',
      division: 'Direktorat Operasi & Logistik',
      priority: 'Normal',
      confidentiality: 'Internal',
      contractStart: '2026-09-01T00:00:00.000Z',
      contractEnd: '2027-09-01T00:00:00.000Z',
      noDuration: false,
      notes: 'Pengajuan draf sewa motor operasional lapangan site Pomalaa.',
      stage: 0,
      stageStatus: 'active',
      statusLabel: 'Pengajuan Baru (V0)',
      pic: 'Robert Pamungkas',
      picEmail: 'robertpamungkas86@gmail.com',
      revisionRequested: false,
      rejected: false,
      files: [
        {
          originalName: 'DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx',
          filename: 'draft_perjanjian_kerja_yyba_dan_pt_lainnya.docx',
          size: 828464,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '/files/DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx',
          uploadedAt: '2026-08-31T14:20:00.000Z',
        },
      ],
      initialDocument: {
        originalName: 'DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx',
        filename: 'draft_perjanjian_kerja_yyba_dan_pt_lainnya.docx',
        size: 828464,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '/files/DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx',
        uploadedAt: '2026-08-31T14:20:00.000Z',
      },
      revisionDocuments: [],
      supportingDocuments: [],
      finalDocument: null,
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx',
            filename: 'draft_perjanjian_kerja_yyba_dan_pt_lainnya.docx',
            size: 828464,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            url: '/files/DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx',
            uploadedAt: '2026-08-31T14:20:00.000Z',
          },
          notes: 'Pengajuan draf sewa motor operasional.',
          uploadedBy: 'Robert Pamungkas',
          uploadedAt: '2026-08-31T14:20:00.000Z',
          isFinal: false,
          fileType: 'initial',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Robert Pamungkas',
          notes: 'Dokumen berhasil diajukan ke antrean verifikasi.',
          versionTag: 'V0',
          timestamp: '2026-08-31T14:20:00.000Z',
        },
      ],
      driveFolderId: '1dHx_E6p1qetwpEVMKz2kS_6TybIPNPsa',
      driveFolderUrl: 'https://drive.google.com/drive/folders/1dHx_E6p1qetwpEVMKz2kS_6TybIPNPsa',
      createdBy: 'usr_robert_requester_01',
      createdAt: '2026-08-31T14:20:00.000Z',
      updatedAt: '2026-08-31T14:20:00.000Z',
    },
    {
      _id: 'doc_ride_2026_0141',
      docNumber: 'RIDE-2026-0141',
      name: 'Non-Disclosure Agreement (NDA) Studi Kelayakan Smelter Pomalaa',
      category: 'NDA',
      division: 'Direktorat Pengembangan Usaha',
      priority: 'Urgent',
      confidentiality: 'Confidential',
      contractStart: '2026-06-01T00:00:00.000Z',
      contractEnd: '2027-06-01T00:00:00.000Z',
      noDuration: false,
      notes: 'Perjanjian kerahasiaan data geologi, cadangan bijih nikel, dan desain teknik smelter.',
      stage: 5,
      stageStatus: 'completed',
      statusLabel: 'Dokumen Final Sah',
      pic: 'Toto Rubianto',
      picEmail: 'toto.rubianto.17@gmail.com',
      revisionRequested: false,
      rejected: false,
      files: [
        {
          originalName: 'NDA_Smelter_Pomalaa_Signed_Final.pdf',
          filename: 'NDA_Smelter_Pomalaa_Signed_Final.pdf',
          size: 1850000,
          mimeType: 'application/pdf',
          url: '/files/NDA_Smelter_Pomalaa_Signed_Final.pdf',
          uploadedAt: '2026-06-05T10:00:00.000Z',
        },
      ],
      initialDocument: {
        originalName: 'Draf_Awal_NDA_Pomalaa_V0.pdf',
        filename: 'Draf_Awal_NDA_Pomalaa_V0.pdf',
        size: 1500000,
        mimeType: 'application/pdf',
        url: '/files/Draf_Awal_NDA_Pomalaa_V0.pdf',
        uploadedAt: '2026-06-01T08:30:00.000Z',
      },
      revisionDocuments: [],
      supportingDocuments: [],
      finalDocument: {
        originalName: 'NDA_Smelter_Pomalaa_Signed_Final.pdf',
        filename: 'NDA_Smelter_Pomalaa_Signed_Final.pdf',
        size: 1850000,
        mimeType: 'application/pdf',
        url: '/files/NDA_Smelter_Pomalaa_Signed_Final.pdf',
        uploadedAt: '2026-06-05T10:00:00.000Z',
      },
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Draf_Awal_NDA_Pomalaa_V0.pdf',
            filename: 'Draf_Awal_NDA_Pomalaa_V0.pdf',
            size: 1500000,
            mimeType: 'application/pdf',
            url: '/files/Draf_Awal_NDA_Pomalaa_V0.pdf',
            uploadedAt: '2026-06-01T08:30:00.000Z',
          },
          notes: 'Pengajuan draf NDA standar kerahasiaan studi kelayakan.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-06-01T08:30:00.000Z',
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'FINAL',
          file: {
            originalName: 'NDA_Smelter_Pomalaa_Signed_Final.pdf',
            filename: 'NDA_Smelter_Pomalaa_Signed_Final.pdf',
            size: 1850000,
            mimeType: 'application/pdf',
            url: '/files/NDA_Smelter_Pomalaa_Signed_Final.pdf',
            uploadedAt: '2026-06-05T10:00:00.000Z',
          },
          notes: 'Dokumen final telah ditandatangani kedua belah pihak dan diarsipkan ke Google Drive.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-06-05T10:00:00.000Z',
          isFinal: true,
          fileType: 'final',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Toto Rubianto',
          notes: 'Draf diajukan.',
          versionTag: 'V0',
          timestamp: '2026-06-01T08:30:00.000Z',
        },
        {
          stage: 5,
          action: 'Unggah Dokumen Final (FINAL)',
          actor: 'Toto Rubianto',
          notes: 'Arsip final tersimpan di Google Drive.',
          versionTag: 'FINAL',
          timestamp: '2026-06-05T10:00:00.000Z',
        },
      ],
      driveFolderId: '1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F',
      driveFolderUrl: 'https://drive.google.com/drive/folders/1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F',
      createdBy: 'usr_toto_admin_01',
      createdAt: '2026-06-01T08:30:00.000Z',
      updatedAt: '2026-06-05T10:00:00.000Z',
    },
    {
      _id: 'doc_ride_2026_0142',
      docNumber: 'RIDE-2026-0142',
      name: 'Perjanjian Sewa Alat Berat Pertambangan - Site Pomalaa',
      category: 'Kontrak Hukum',
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
      driveFolderId: '1lwG61h7tl_5DqibZGaQadd5XQnq0n8xe',
      driveFolderUrl: 'https://drive.google.com/drive/folders/1lwG61h7tl_5DqibZGaQadd5XQnq0n8xe',
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
      driveFolderId: '15kySze_XjuUSdYoHX6_rlaOwabHqDxfz',
      driveFolderUrl: 'https://drive.google.com/drive/folders/15kySze_XjuUSdYoHX6_rlaOwabHqDxfz',
      createdBy: 'usr_toto_admin_01',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-25T16:00:00.000Z',
    },
    {
      _id: 'doc_ride_2026_0144',
      docNumber: 'RIDE-2026-0144',
      name: 'Kontrak Pengadaan Ban Heavy Dump Truck 100 Ton',
      category: 'Kontrak Hukum',
      division: 'Direktorat Operasi',
      priority: 'Urgent',
      confidentiality: 'Internal',
      contractStart: '2026-08-10T00:00:00.000Z',
      contractEnd: '2026-11-10T00:00:00.000Z',
      noDuration: false,
      notes: 'Pengadaan ban alat berat hauling 40 unit per triwulan.',
      stage: 1,
      stageStatus: 'revision',
      statusLabel: 'Perlu Revisi',
      pic: 'Toto Rubianto',
      picEmail: 'toto.rubianto.17@gmail.com',
      revisionRequested: true,
      rejected: false,
      files: [
        {
          originalName: 'Draf_Pengadaan_Ban_HDT_V0.pdf',
          filename: 'Draf_Pengadaan_Ban_HDT_V0.pdf',
          size: 1950000,
          mimeType: 'application/pdf',
          url: '/files/Draf_Pengadaan_Ban_HDT_V0.pdf',
          uploadedAt: '2026-08-10T11:00:00.000Z',
        },
      ],
      initialDocument: {
        originalName: 'Draf_Pengadaan_Ban_HDT_V0.pdf',
        filename: 'Draf_Pengadaan_Ban_HDT_V0.pdf',
        size: 1950000,
        mimeType: 'application/pdf',
        url: '/files/Draf_Pengadaan_Ban_HDT_V0.pdf',
        uploadedAt: '2026-08-10T11:00:00.000Z',
      },
      revisionDocuments: [],
      supportingDocuments: [],
      finalDocument: null,
      versions: [
        {
          version: 'V0',
          file: {
            originalName: 'Draf_Pengadaan_Ban_HDT_V0.pdf',
            filename: 'Draf_Pengadaan_Ban_HDT_V0.pdf',
            size: 1950000,
            mimeType: 'application/pdf',
            url: '/files/Draf_Pengadaan_Ban_HDT_V0.pdf',
            uploadedAt: '2026-08-10T11:00:00.000Z',
          },
          notes: 'Pengajuan pengadaan awal.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-10T11:00:00.000Z',
          isFinal: false,
          fileType: 'initial',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Toto Rubianto',
          notes: 'Pengajuan draf pengadaan ban heavy dump truck.',
          versionTag: 'V0',
          timestamp: '2026-08-10T11:00:00.000Z',
        },
        {
          stage: 1,
          action: 'Permintaan Revisi Diajukan',
          actor: 'Toto Rubianto',
          notes: 'Klausul garansi cacat pabrik minimal 12 bulan dan SLA pengiriman 14 hari kerja belum tercantum.',
          versionTag: 'V0',
          timestamp: '2026-08-14T09:15:00.000Z',
        },
      ],
      driveFolderId: '1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F',
      driveFolderUrl: 'https://drive.google.com/drive/folders/1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F',
      createdBy: 'usr_toto_admin_01',
      createdAt: '2026-08-10T11:00:00.000Z',
      updatedAt: '2026-08-14T09:15:00.000Z',
    },
    {
      _id: 'doc_ride_2026_0145',
      docNumber: 'RIDE-2026-0145',
      name: 'Power Purchase Agreement (PPA) Suplai Listrik Pabrik Smelter',
      category: 'MoU',
      division: 'Direktorat Operasi',
      priority: 'Critical',
      confidentiality: 'Confidential',
      contractStart: '2026-09-01T00:00:00.000Z',
      contractEnd: '2036-09-01T00:00:00.000Z',
      noDuration: false,
      notes: 'Perjanjian pasokan daya listrik 150 MW untuk fasilitas smelter nikel tahap 2.',
      stage: 4,
      stageStatus: 'active',
      statusLabel: 'Persetujuan Direksi (BOD Signed)',
      pic: 'Toto Rubianto',
      picEmail: 'toto.rubianto.17@gmail.com',
      revisionRequested: false,
      rejected: false,
      files: [
        {
          originalName: 'Draf_PPA_Smelter_150MW_Rev02.pdf',
          filename: 'Draf_PPA_Smelter_150MW_Rev02.pdf',
          size: 3400000,
          mimeType: 'application/pdf',
          url: '/files/Draf_PPA_Smelter_150MW_Rev02.pdf',
          uploadedAt: '2026-08-28T10:00:00.000Z',
        },
      ],
      initialDocument: {
        originalName: 'Draf_Awal_PPA_150MW_V0.pdf',
        filename: 'Draf_Awal_PPA_150MW_V0.pdf',
        size: 3100000,
        mimeType: 'application/pdf',
        url: '/files/Draf_Awal_PPA_150MW_V0.pdf',
        uploadedAt: '2026-08-05T09:00:00.000Z',
      },
      revisionDocuments: [
        {
          version: 'Rev.01',
          file: {
            originalName: 'Draf_PPA_Penyesuaian_Tarif_Rev01.pdf',
            filename: 'Draf_PPA_Penyesuaian_Tarif_Rev01.pdf',
            size: 3250000,
            mimeType: 'application/pdf',
            url: '/files/Draf_PPA_Penyesuaian_Tarif_Rev01.pdf',
            uploadedAt: '2026-08-18T14:00:00.000Z',
          },
          notes: 'Penyesuaian eskalasi tarif per kWh.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-18T14:00:00.000Z',
          isFinal: false,
          fileType: 'revision',
        },
        {
          version: 'Rev.02',
          file: {
            originalName: 'Draf_PPA_Smelter_150MW_Rev02.pdf',
            filename: 'Draf_PPA_Smelter_150MW_Rev02.pdf',
            size: 3400000,
            mimeType: 'application/pdf',
            url: '/files/Draf_PPA_Smelter_150MW_Rev02.pdf',
            uploadedAt: '2026-08-28T10:00:00.000Z',
          },
          notes: 'Finalisasi matriks jaminan ketersediaan daya 99.8%.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-28T10:00:00.000Z',
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
            originalName: 'Draf_Awal_PPA_150MW_V0.pdf',
            filename: 'Draf_Awal_PPA_150MW_V0.pdf',
            size: 3100000,
            mimeType: 'application/pdf',
            url: '/files/Draf_Awal_PPA_150MW_V0.pdf',
            uploadedAt: '2026-08-05T09:00:00.000Z',
          },
          notes: 'Draf awal perjanjian PPA.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-05T09:00:00.000Z',
          isFinal: false,
          fileType: 'initial',
        },
        {
          version: 'Rev.01',
          file: {
            originalName: 'Draf_PPA_Penyesuaian_Tarif_Rev01.pdf',
            filename: 'Draf_PPA_Penyesuaian_Tarif_Rev01.pdf',
            size: 3250000,
            mimeType: 'application/pdf',
            url: '/files/Draf_PPA_Penyesuaian_Tarif_Rev01.pdf',
            uploadedAt: '2026-08-18T14:00:00.000Z',
          },
          notes: 'Penyesuaian eskalasi tarif per kWh.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-18T14:00:00.000Z',
          isFinal: false,
          fileType: 'revision',
        },
        {
          version: 'Rev.02',
          file: {
            originalName: 'Draf_PPA_Smelter_150MW_Rev02.pdf',
            filename: 'Draf_PPA_Smelter_150MW_Rev02.pdf',
            size: 3400000,
            mimeType: 'application/pdf',
            url: '/files/Draf_PPA_Smelter_150MW_Rev02.pdf',
            uploadedAt: '2026-08-28T10:00:00.000Z',
          },
          notes: 'Finalisasi matriks jaminan ketersediaan daya 99.8%.',
          uploadedBy: 'Toto Rubianto',
          uploadedAt: '2026-08-28T10:00:00.000Z',
          isFinal: false,
          fileType: 'revision',
        },
      ],
      history: [
        {
          stage: 0,
          action: 'Pengajuan Dokumen Awal (V0)',
          actor: 'Toto Rubianto',
          notes: 'Draf PPA 150MW diajukan.',
          versionTag: 'V0',
          timestamp: '2026-08-05T09:00:00.000Z',
        },
        {
          stage: 2,
          action: 'Unggah Revisi Dokumen (Rev.01)',
          actor: 'Toto Rubianto',
          notes: 'Penyesuaian pasal tarif.',
          versionTag: 'Rev.01',
          timestamp: '2026-08-18T14:00:00.000Z',
        },
        {
          stage: 3,
          action: 'Persetujuan Legal (Approval)',
          actor: 'Toto Rubianto',
          notes: 'Legal clearance disetujui penuh.',
          versionTag: 'Rev.02',
          timestamp: '2026-08-28T15:00:00.000Z',
        },
      ],
      driveFolderId: '1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F',
      driveFolderUrl: 'https://drive.google.com/drive/folders/1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F',
      createdBy: 'usr_toto_admin_01',
      createdAt: '2026-08-05T09:00:00.000Z',
      updatedAt: '2026-08-28T15:00:00.000Z',
    },
  ]

  // Restore persistent deleted docs registry from Google Drive + local disk cache (/tmp)
  let deletedDocIds = readLocalDeletedDocsCache()
  try {
    const driveDeleted = await getDeletedDocsFromGoogleDriveRegistry()
    if (driveDeleted && driveDeleted.length > 0) {
      deletedDocIds = Array.from(new Set([...deletedDocIds, ...driveDeleted]))
      writeLocalDeletedDocsCache(deletedDocIds)
    }
  } catch (e) {
    console.warn('[GDrive getDeletedDocsRegistry in init warning]', e)
  }

  // Filter seed documents immediately against persistent deletion blacklist
  store.documents = store.documents.filter(
    (d) => !deletedDocIds.includes(d._id) && !deletedDocIds.includes(d.docNumber)
  )

  // Load active documents from Google Drive Registry (Cloud Source of Truth)
  try {
    const driveDocs = await getDocumentsFromGoogleDriveRegistry()
    if (driveDocs && driveDocs.length > 0) {
      for (const dd of driveDocs) {
        if (deletedDocIds.includes(dd._id) || (dd.docNumber && deletedDocIds.includes(dd.docNumber))) {
          continue
        }
        const idx = store.documents.findIndex(
          (d) => d._id === dd._id || (dd.docNumber && d.docNumber === dd.docNumber)
        )
        if (idx >= 0) {
          store.documents[idx] = { ...store.documents[idx], ...dd }
        } else {
          store.documents.unshift(dd)
        }
      }
    }
  } catch (e) {
    console.warn('[GDrive getDocumentsRegistry in init warning]', e)
  }

  const cachedDocs = readLocalDocsCache()
  if (cachedDocs && cachedDocs.length > 0) {
    for (const cd of cachedDocs) {
      if (deletedDocIds.includes(cd._id) || (cd.docNumber && deletedDocIds.includes(cd.docNumber))) {
        continue
      }
      const idx = store.documents.findIndex(
        (d) => d._id === cd._id || (cd.docNumber && d.docNumber === cd.docNumber)
      )
      if (idx >= 0) {
        store.documents[idx] = { ...store.documents[idx], ...cd }
      } else {
        store.documents.unshift(cd)
      }
    }
  }

  // Gracefully load from MongoDB if available
  try {
    await connectToDatabase()
    const dbDocs = await DocumentModel.find({}).lean()
    if (dbDocs && dbDocs.length > 0) {
      for (const d of dbDocs) {
        const dId = (d as any)._id?.toString() || (d as any).id
        if (deletedDocIds.includes(dId) || (d.docNumber && deletedDocIds.includes(d.docNumber))) {
          continue
        }
        const mappedDoc: StoredDocument = {
          _id: dId,
          docNumber: d.docNumber,
          name: d.name,
          category: d.category,
          division: d.division || 'Direktorat Umum',
          priority: d.priority || 'Normal',
          confidentiality: d.confidentiality || 'Internal',
          contractStart: d.contractStart ? new Date(d.contractStart).toISOString() : null,
          contractEnd: d.contractEnd ? new Date(d.contractEnd).toISOString() : null,
          noDuration: Boolean(d.noDuration),
          notes: d.notes || '',
          stage: d.stage ?? 0,
          stageStatus: d.stageStatus || 'active',
          statusLabel: d.statusLabel || 'Pengajuan Baru',
          pic: d.pic || 'Pengaju',
          picEmail: d.picEmail || '',
          revisionRequested: Boolean(d.revisionRequested),
          rejected: Boolean(d.rejected),
          files: (d.files || []) as any,
          initialDocument: (d.initialDocument || null) as any,
          revisionDocuments: (d.revisionDocuments || []) as any,
          supportingDocuments: (d.supportingDocuments || []) as any,
          finalDocument: (d.finalDocument || null) as any,
          versions: (d.versions || []) as any,
          decision: (d.decision || null) as any,
          reminders: (d.reminders || null) as any,
          history: (d.history || []) as any,
          driveFolderId: d.driveFolderId,
          driveFolderUrl: d.driveFolderUrl,
          createdBy: d.createdBy?.toString(),
          createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : now,
          updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : now,
        }
        const idx = store.documents.findIndex(
          (x) => x.docNumber === mappedDoc.docNumber || x._id === mappedDoc._id
        )
        if (idx >= 0) {
          store.documents[idx] = { ...store.documents[idx], ...mappedDoc }
        } else {
          store.documents.unshift(mappedDoc)
        }
      }
      writeLocalDocsCache(store.documents)
    }
  } catch (err) {
    // MongoDB failure ignored safely
  }

  // Filter one final time against deletedDocIds
  store.documents = store.documents.filter(
    (d) => !deletedDocIds.includes(d._id) && !deletedDocIds.includes(d.docNumber)
  )

  writeLocalDocsCache(store.documents)

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
      type: 'revision',
      title: 'Revisi Diperlukan: RIDE-2026-0144',
      description: 'Draf Kontrak Pengadaan Ban Heavy Dump Truck perlu penyesuaian klausul garansi.',
      isRead: false,
      createdAt: now,
    },
    {
      _id: 'notif_03',
      userId: 'usr_toto_admin_01',
      type: 'email_sent',
      title: 'Google Drive File Store Aktif',
      description: 'Sistem RIDE telah terintegrasi dengan Google Drive Enterprise Archive.',
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
  const deletedDocIds = readLocalDeletedDocsCache()
  let docs = store.documents.filter(
    (d) => !deletedDocIds.includes(d._id) && !deletedDocIds.includes(d.docNumber)
  )

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
  const deletedDocIds = readLocalDeletedDocsCache()
  if (deletedDocIds.includes(id)) return null
  return store.documents.find((d) => (d._id === id || d.docNumber === id) && !deletedDocIds.includes(d._id) && !deletedDocIds.includes(d.docNumber)) || null
}

export async function saveDriveDocument(doc: StoredDocument) {
  await initAndSeedDriveStore()
  const store = getStore()
  const deletedDocIds = readLocalDeletedDocsCache()
  // Remove from deleted list if re-saving
  if (deletedDocIds.includes(doc._id) || deletedDocIds.includes(doc.docNumber)) {
    const updatedDeleted = deletedDocIds.filter((x) => x !== doc._id && x !== doc.docNumber)
    writeLocalDeletedDocsCache(updatedDeleted)
  }

  const idx = store.documents.findIndex((d) => d._id === doc._id || d.docNumber === doc.docNumber)
  if (idx >= 0) {
    store.documents[idx] = { ...doc, updatedAt: new Date().toISOString() }
  } else {
    store.documents.unshift(doc)
  }

  // 1. Persist to local disk cache (/tmp)
  writeLocalDocsCache(store.documents)

  // 2. Synchronize to Google Drive folder and registry in background (Cloud source of truth)
  syncDocumentToGoogleDrive(doc).catch((e) => console.error('[Background GDrive Sync Doc Error]', e))
  saveDocumentsToGoogleDriveRegistry(store.documents).catch((e) =>
    console.error('[Background GDrive Save Documents Registry Error]', e)
  )

  // 3. Graceful MongoDB persistence
  try {
    await connectToDatabase()
    await DocumentModel.findOneAndUpdate(
      { docNumber: doc.docNumber },
      { $set: doc },
      { upsert: true, new: true }
    )
  } catch (err) {
    // MongoDB optional fallback
  }

  return doc
}

export async function deleteDriveDocument(id: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.documents.findIndex((d) => d._id === id || d.docNumber === id)
  let docToDelete: StoredDocument | null = null

  if (idx >= 0) {
    docToDelete = store.documents.splice(idx, 1)[0]
  }

  // 1. Record in persistent deleted registry locally
  const deletedDocIds = readLocalDeletedDocsCache()
  deletedDocIds.push(id)
  if (docToDelete) {
    if (docToDelete._id) deletedDocIds.push(docToDelete._id)
    if (docToDelete.docNumber) deletedDocIds.push(docToDelete.docNumber)
  }
  const cleanDeleted = Array.from(new Set(deletedDocIds.filter(Boolean)))
  writeLocalDeletedDocsCache(cleanDeleted)
  writeLocalDocsCache(store.documents)

  // 2. Persist deleted IDs to Google Drive registry and update active documents registry
  addDeletedDocsToGoogleDriveRegistry(cleanDeleted).catch((e) =>
    console.error('[GDrive addDeletedDocsRegistry Error]', e)
  )
  saveDocumentsToGoogleDriveRegistry(store.documents).catch((e) =>
    console.error('[GDrive saveDocumentsRegistry After Delete Error]', e)
  )

  // 3. Trash Google Drive folder
  if (docToDelete) {
    trashDocumentInGoogleDrive(docToDelete.driveFolderId || docToDelete.docNumber).catch((e) =>
      console.error('[GDrive Trash Doc Error]', e)
    )
  } else {
    trashDocumentInGoogleDrive(id).catch(() => {})
  }

  // 4. Delete from MongoDB
  try {
    await connectToDatabase()
    await DocumentModel.deleteMany({ $or: [{ _id: id }, { docNumber: id }] })
  } catch {}

  return true
}

// ----------------------------------------------------
// USER STORE OPERATIONS
// ----------------------------------------------------

export async function getDriveUsers() {
  await initAndSeedDriveStore()
  const store = getStore()

  // If store only has the base seed users, trigger a fast refresh from Google Drive
  if (store.users.length <= 3) {
    try {
      const driveUsers = await getUsersFromGoogleDriveRegistry()
      if (driveUsers && driveUsers.length > 0) {
        for (const du of driveUsers) {
          const idx = store.users.findIndex((u) => u.email.toLowerCase() === du.email.toLowerCase())
          if (idx >= 0) {
            store.users[idx] = { ...store.users[idx], ...du }
          } else {
            store.users.push(du)
          }
        }
        writeLocalUsersCache(store.users)
      }
    } catch {}
  }

  // Also check MongoDB if available
  try {
    await connectToDatabase()
    const dbUsers = await User.find({}).lean()
    if (dbUsers && dbUsers.length > 0) {
      for (const u of dbUsers) {
        const mappedUser: StoredUser = {
          _id: u._id.toString(),
          id: u._id.toString(),
          employeeName: u.employeeName,
          email: u.email,
          passwordHash: u.passwordHash,
          position: u.position || 'Reviewer',
          division: u.division || 'Direktorat Umum',
          role: (u.role || 'Reviewer') as UserRole,
          phone: u.phone,
          avatarUrl: u.avatarUrl || undefined,
          coverUrl: u.coverUrl || undefined,
          twoFactorEnabled: u.twoFactorEnabled ?? true,
          isActive: u.isActive ?? true,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
        }
        const idx = store.users.findIndex((x) => x.email.toLowerCase() === mappedUser.email.toLowerCase())
        if (idx >= 0) {
          store.users[idx] = { ...store.users[idx], ...mappedUser }
        } else {
          store.users.push(mappedUser)
        }
      }
      writeLocalUsersCache(store.users)
    }
  } catch (err) {
    // MongoDB failure ignored safely
  }

  return store.users.map(({ passwordHash, twoFactorSecret, ...safe }) => safe)
}

export async function getDriveUserByEmail(email: string) {
  if (!email) return null
  const clean = email.toLowerCase().trim()
  const store = getStore()

  // 1. In-memory lookup
  let user = store.users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      (clean === 'lukytrisasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrissasongko812@gmail.com') ||
      (clean === 'lukytrissasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrisasongko812@gmail.com') ||
      (clean === 'luckytrisasongko812@gmail.com' && u.email.toLowerCase().includes('luckytrisasongko812'))
  )
  if (user) return user

  // 2. Local disk cache lookup
  const cachedUsers = readLocalUsersCache()
  if (cachedUsers && cachedUsers.length > 0) {
    user = cachedUsers.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (clean === 'lukytrisasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrissasongko812@gmail.com') ||
        (clean === 'lukytrissasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrisasongko812@gmail.com') ||
        (clean === 'luckytrisasongko812@gmail.com' && u.email.toLowerCase().includes('luckytrisasongko812'))
    )
    if (user) {
      if (!store.users.some((u) => u.email.toLowerCase() === user!.email.toLowerCase())) {
        store.users.push(user)
      }
      return user
    }
  }

  // 3. Live Google Drive query
  try {
    const driveUser = await getUserFromGoogleDriveByEmail(clean)
    if (driveUser) {
      const idx = store.users.findIndex((u) => u.email.toLowerCase() === driveUser.email.toLowerCase())
      if (idx >= 0) {
        store.users[idx] = driveUser
      } else {
        store.users.push(driveUser)
      }
      writeLocalUsersCache(store.users)
      return driveUser
    }
  } catch (driveErr) {
    console.warn('[GDrive live getDriveUserByEmail warning]', driveErr)
  }

  // 4. Try MongoDB
  try {
    await connectToDatabase()
    const dbUser: any = await User.findOne({
      $or: [
        { email: clean },
        { email: clean === 'lukytrisasongko812@gmail.com' ? 'lukytrissasongko812@gmail.com' : clean },
        { email: clean === 'lukytrissasongko812@gmail.com' ? 'lukytrisasongko812@gmail.com' : clean },
        { email: clean === 'luckytrisasongko812@gmail.com' ? 'luckytrisasongko812@gmail.com' : clean },
      ]
    }).lean()
    if (dbUser) {
      const u: StoredUser = {
        _id: dbUser._id.toString(),
        id: dbUser._id.toString(),
        employeeName: dbUser.employeeName,
        email: dbUser.email,
        passwordHash: dbUser.passwordHash,
        position: dbUser.position || 'Reviewer',
        division: dbUser.division || 'Direktorat Umum',
        role: (dbUser.role || 'Reviewer') as UserRole,
        phone: dbUser.phone,
        avatarUrl: dbUser.avatarUrl || undefined,
        coverUrl: dbUser.coverUrl || undefined,
        twoFactorEnabled: dbUser.twoFactorEnabled ?? true,
        twoFactorSecret: dbUser.twoFactorCode || undefined,
        twoFactorExpires: dbUser.twoFactorExpires ? new Date(dbUser.twoFactorExpires).toISOString() : null,
        isActive: dbUser.isActive ?? true,
        createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: dbUser.updatedAt ? new Date(dbUser.updatedAt).toISOString() : new Date().toISOString(),
      }
      const idx = store.users.findIndex((x) => x.email.toLowerCase() === u.email.toLowerCase())
      if (idx >= 0) {
        store.users[idx] = u
      } else {
        store.users.push(u)
      }
      writeLocalUsersCache(store.users)
      return u
    }
  } catch (err) {
    // ignore
  }

  await initAndSeedDriveStore()
  return (
    store.users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (clean === 'lukytrisasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrissasongko812@gmail.com') ||
        (clean === 'lukytrissasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrisasongko812@gmail.com') ||
        (clean === 'luckytrisasongko812@gmail.com' && u.email.toLowerCase().includes('luckytrisasongko812'))
    ) || null
  )
}

export async function getDriveUserById(id: string) {
  if (!id) return null
  const cleanId = id.trim()
  const store = getStore()

  // 1. In-memory check
  let user = store.users.find(
    (u) => u._id === cleanId || u.id === cleanId || u.email.toLowerCase() === cleanId.toLowerCase()
  )
  if (user) return user

  // 2. Local disk cache check
  const cachedUsers = readLocalUsersCache()
  if (cachedUsers && cachedUsers.length > 0) {
    user = cachedUsers.find(
      (u) => u._id === cleanId || u.id === cleanId || u.email.toLowerCase() === cleanId.toLowerCase()
    )
    if (user) {
      if (!store.users.some((u) => u._id === user!._id)) {
        store.users.push(user)
      }
      return user
    }
  }

  // 3. Live Google Drive query
  try {
    const driveUser = await getUserFromGoogleDriveById(cleanId)
    if (driveUser) {
      const idx = store.users.findIndex((u) => u._id === driveUser._id || u.email.toLowerCase() === driveUser.email.toLowerCase())
      if (idx >= 0) {
        store.users[idx] = driveUser
      } else {
        store.users.push(driveUser)
      }
      writeLocalUsersCache(store.users)
      return driveUser
    }
  } catch (driveErr) {
    console.warn('[GDrive live getDriveUserById warning]', driveErr)
  }

  // 4. Try MongoDB
  try {
    await connectToDatabase()
    let dbUser: any = null
    const mongooseModule = await import('mongoose')
    if (mongooseModule.default.Types.ObjectId.isValid(cleanId)) {
      try {
        dbUser = await User.findById(cleanId).lean()
      } catch {}
    }
    if (!dbUser) {
      dbUser = await User.findOne({
        $or: [
          { email: cleanId.toLowerCase() },
          { email: cleanId.toLowerCase() === 'lukytrisasongko812@gmail.com' ? 'lukytrissasongko812@gmail.com' : cleanId.toLowerCase() },
          { email: cleanId.toLowerCase() === 'luckytrisasongko812@gmail.com' ? 'luckytrisasongko812@gmail.com' : cleanId.toLowerCase() },
        ]
      }).lean()
    }
    if (dbUser) {
      const u: StoredUser = {
        _id: dbUser._id.toString(),
        id: dbUser._id.toString(),
        employeeName: dbUser.employeeName,
        email: dbUser.email,
        passwordHash: dbUser.passwordHash,
        position: dbUser.position || 'Reviewer',
        division: dbUser.division || 'Direktorat Umum',
        role: (dbUser.role || 'Reviewer') as UserRole,
        phone: dbUser.phone,
        avatarUrl: dbUser.avatarUrl || undefined,
        coverUrl: dbUser.coverUrl || undefined,
        twoFactorEnabled: dbUser.twoFactorEnabled ?? true,
        twoFactorSecret: dbUser.twoFactorCode || undefined,
        twoFactorExpires: dbUser.twoFactorExpires ? new Date(dbUser.twoFactorExpires).toISOString() : null,
        isActive: dbUser.isActive ?? true,
        createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: dbUser.updatedAt ? new Date(dbUser.updatedAt).toISOString() : new Date().toISOString(),
      }
      const idx = store.users.findIndex((x) => x._id === u._id)
      if (idx >= 0) {
        store.users[idx] = u
      } else {
        store.users.push(u)
      }
      writeLocalUsersCache(store.users)
      return u
    }
  } catch (err) {
    // ignore
  }

  await initAndSeedDriveStore()
  return store.users.find((u) => u._id === cleanId || u.id === cleanId || u.email.toLowerCase() === cleanId.toLowerCase()) || null
}

export async function saveDriveUser(user: StoredUser) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.users.findIndex((u) => u._id === user._id || u.email.toLowerCase() === user.email.toLowerCase())
  if (idx >= 0) {
    const existing = store.users[idx]
    store.users[idx] = {
      ...existing,
      ...user,
      avatarUrl: user.avatarUrl !== undefined ? user.avatarUrl : existing.avatarUrl,
      avatarFileId: user.avatarFileId !== undefined ? user.avatarFileId : existing.avatarFileId,
      coverUrl: user.coverUrl !== undefined ? user.coverUrl : existing.coverUrl,
      updatedAt: new Date().toISOString(),
    }
  } else {
    store.users.push(user)
  }

  // 1. Immediately persist to local disk cache (/tmp)
  writeLocalUsersCache(store.users)

  // 2. Synchronously persist to Google Drive User Registry (Cloud source of truth)
  try {
    await syncUserToGoogleDrive(user)
  } catch (e) {
    console.error('[GDrive Sync User Exception]', e)
  }

  // 3. Attempt MongoDB update (graceful fallback)
  try {
    await connectToDatabase()
    const updateFields: any = {
      employeeName: user.employeeName,
      position: user.position,
      division: user.division,
      role: user.role,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorCode: user.twoFactorSecret !== undefined ? user.twoFactorSecret : null,
      twoFactorExpires: user.twoFactorExpires ? new Date(user.twoFactorExpires) : null,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      updatedAt: new Date(),
    }

    if (user.avatarUrl !== undefined) {
      updateFields.avatarUrl = user.avatarUrl
    }
    if (user.coverUrl !== undefined) {
      updateFields.coverUrl = user.coverUrl
    }

    await User.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      { $set: updateFields },
      { upsert: true, new: true }
    )
  } catch (err) {
    // ignore
  }

  return user
}

export async function deleteDriveUser(id: string) {
  await initAndSeedDriveStore()
  const store = getStore()
  const idx = store.users.findIndex(
    (u) => u._id === id || u.id === id || u.email.toLowerCase() === id.toLowerCase()
  )
  let removedUser: StoredUser | null = null
  if (idx >= 0) {
    removedUser = store.users.splice(idx, 1)[0]
    writeLocalUsersCache(store.users)
  }

  // 1. Delete from Google Drive User Registry
  try {
    await deleteUserFromGoogleDrive(id, removedUser?.email)
  } catch (e) {
    console.error('[GDrive Delete User Exception]', e)
  }

  // 2. Try MongoDB delete
  try {
    await connectToDatabase()
    try {
      await User.findByIdAndDelete(id)
    } catch {}
    await User.deleteOne({ _id: id })
    await User.deleteOne({ id: id })
    await User.deleteOne({ email: id.toLowerCase() })
  } catch (err) {
    // ignore
  }

  return true
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
