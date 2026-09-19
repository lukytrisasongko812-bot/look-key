import { google } from 'googleapis'
import bcrypt from 'bcryptjs'
import { StoredDocument, StoredUser, StoredNotification, StoredFile } from './drive-store'

const DEFAULT_SERVICE_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  'ridetrackingofficial@track-507213.iam.gserviceaccount.com'

const DEFAULT_PRIVATE_KEY = (
  process.env.GOOGLE_PRIVATE_KEY ||
  `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCle3X0a+s6Ylag
a5gOav/ODAuS8yjpfDwlTq4IyDmhm9BAsrK2zfM1arWicH5gNdzyGl0QH3TU/7VN
wsdHYD56I8W/7+QICiop3UKbOF5ueMiicHW6p5pNWUBf8r8H1pqAg+8t8s9DXu1H
h67AcPLSC5YBYq48s0pGuU7M7keYv+AGtt9Uy/OyTVU9NXiwvhzqPX/475SVWAjG
7tyL5gzlUn0dkVD75L11k2Ui1xGusK4XAbjRp6fuGQUc/wq76jqSLksClFEnVtmc
SX4plFjAbCzi/g9pNNFMFQVdhDWSy6XCVEMKoyQGltRHU27qIYAUPXhNmAoujFeJ
7k0LNFGJAgMBAAECggEACynrUPg32Ao60Fs52J0o0Th4TmtXkvrV3ulyLbb+RlQJ
5ld33YPC2NNwWftPV0PC+lVDens4yUbP7yVJBtxsEpbXuCVho5Y19nmODQUuP7Mn
y+ec1aEJdJblFCP+9bMpXKqp59Zl26RriwQRCrwD8Z4k+kZzPTaWN/O36HTZwSjy
0/Z5FOPXPH9n4uWSyloabCUEp9hjJ7V8csxWEpJLcWDSCTG/q/9mYgWnhZMfL2J9
0eJBU0umViORgXaZkGkAB4W/PE37flCGS/WmGn6X0WLVNKnEeHC9Beb/ryNoVC+v
MKrn5U4srmYrcukgvNEGNcrB6mhFopfygTti8ktNxQKBgQDWGKVN70/rYqYwyfik
aS+bF7Zsw/s0mrReVtselPTRtXh22FLBD+ZLtRNMwnkeCqBWjExqxmzNIbGTW7js
oKiHW0cSvL76CShg1QfdYk8csw7GLL2d7i9TsxTgK27C6R1z6NjXhi2lpTguVB6Z
iYKCEQbkz9p2pnpVHhj1KdY59QKBgQDF3v8jVRLf8r2ZxXm7QXCOSTObK0hN2aB8
jF/y5H5ho3AnxBsl9gkpxQO7uD1d4GM+++rHpmULEniiB3H6FzqNebTQxQgljQjB
rZgowNxidQBCn+ct6UFOQSWwmgcA0lsgcawkGOqDxoTbpk7O+4I6UFc8RDfkZlK1
njqh/8fYxQKBgFmlxEIX/Q0BJ7myOK0PZmG40ihFAAEM7o26LNJnaQQOyrxo5G32
7GWzErvHitOre2wCH1VudMyIWUTs2UgsFaVn8SDFa+piv0ecrEhlC99mkr8kqNli
jOqtSAZ96UkwN6b7TyEgDCkaP6YWjyGXVNCFtK9G4aFhIERX7/doZ02pAoGBALTn
8oBNMZqKhgpm36ryY4PTLVl6svpqNC5q8PZTLbD7Cnlw9Bk63pnPxGAGTCTeGB7n
l3m9ibgbxSruf6hVQHVEhqow2gfq78yTeAAag+OIcRp4s5XoIor3SQwzZp+7sxDw
nJ/MH+0mvSVM4dSfYisKdRdmj2tEme3uolCmWAK5AoGBAI4Do0wWNi//miEclwHv
tza4x4sBV3x5xBK74064/Q6IE42vrgaKyJwRYit0a7V1ls/7DStXRFss/79OKi3v
d4lfGubWJSWWwi/MDeU7YFwVXlnSI8exT8ooT7m+JFCXmvlYl/0ON1MucMJ19439
svR0VzPeh1ITi+HByUIaoEEM
-----END PRIVATE KEY-----`
).replace(/\\n/g, '\n')

const DEFAULT_PARENT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || '1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F'

const USERS_REGISTRY_FOLDER_ID = '1JRjTJOGlGs0S0iE1HYIBaI0nIcqDXugf'

function getDriveClient() {
  const auth = new google.auth.JWT({
    email: DEFAULT_SERVICE_EMAIL,
    key: DEFAULT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

/**
 * Format complete text log for document history (.txt file)
 */
export function generateDocumentTxtLog(doc: StoredDocument): string {
  const now = new Date()
  const createdDateStr = doc.createdAt
    ? new Date(doc.createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    : '-'

  const contractStartStr = doc.contractStart
    ? new Date(doc.contractStart).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const contractEndStr = doc.noDuration
    ? 'Berlaku Selamanya (Tanpa Batas Waktu)'
    : doc.contractEnd
    ? new Date(doc.contractEnd).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  let versionsBlock = ''
  if (doc.versions && doc.versions.length > 0) {
    versionsBlock = doc.versions
      .map((v) => {
        const time = new Date(v.uploadedAt).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        return `  [${v.version}] ${v.file?.originalName || 'Berkas'}\n    • Tipe Berkas : ${v.fileType.toUpperCase()}\n    • Pengunggah   : ${v.uploadedBy}\n    • Waktu Unggah : ${time} WIB\n    • Catatan      : ${v.notes || '-'}`
      })
      .join('\n\n')
  } else {
    versionsBlock = '  Belum ada draf berkas terdaftar.'
  }

  let historyBlock = ''
  if (doc.history && doc.history.length > 0) {
    historyBlock = doc.history
      .map((h, i) => {
        const time = new Date(h.timestamp).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        return `  ${(i + 1).toString().padStart(2, '0')}. [${time} WIB] [Versi: ${h.versionTag || 'V0'}]\n      Aksi     : ${h.action}\n      Pelaksana: ${h.actor}\n      Catatan  : ${h.notes || '-'}`
      })
      .join('\n\n')
  } else {
    historyBlock = '  Belum ada riwayat audit.'
  }

  return `================================================================================
RIDE — REQUEST INTEGRATED DOCUMENT ECOSYSTEM
ARSIP RESMI DOKUMEN GOOGLE DRIVE: ${doc.docNumber}
================================================================================

[1. INFORMASI UMUM PENGADAAN & KONTRAK]
--------------------------------------------------------------------------------
Nomor Tiket Dokumen : ${doc.docNumber}
Nama Dokumen        : ${doc.name}
Kategori            : ${doc.category}
Divisi Pemohon      : ${doc.division}
Tingkat Prioritas   : ${doc.priority}
Kerahasiaan         : ${doc.confidentiality}
Penanggung Jawab    : ${doc.pic} (${doc.picEmail || '-'})
Tanggal Pengajuan   : ${createdDateStr}
Masa Berlaku        : ${contractStartStr} s/d ${contractEndStr}
Status Alur Kerja   : ${doc.statusLabel || 'Sedang Diproses'}
Tahapan Terkini     : Tahap ${doc.stage + 1} (${doc.stageStatus.toUpperCase()})

[2. CATATAN & LATAR BELAKANG PENGURUSAN]
--------------------------------------------------------------------------------
${doc.notes || 'Tidak ada catatan latar belakang.'}

[3. STRUKTUR PAKET BERKAS & PELACAKAN VERSI (VERSION TRACKING)]
--------------------------------------------------------------------------------
${versionsBlock}

[4. LOG AUDIT RIWAYAT DOKUMEN LENGKAP (DOCUMENT HISTORY)]
--------------------------------------------------------------------------------
${historyBlock}

================================================================================
Log sinkronisasi otomatis diterbitkan pada: ${now.toLocaleString('id-ID')} WIB
Sistem RIDE Platform (https://risetrack.id)
Folder Google Drive: ${doc.driveFolderUrl || 'https://drive.google.com'}
================================================================================
`.trim()
}

/**
 * Sync document folder and text logs to Google Drive
 */
export async function syncDocumentToGoogleDrive(doc: StoredDocument): Promise<{
  folderId: string
  folderUrl: string
  isLive: boolean
  message: string
}> {
  const folderName = `[${doc.docNumber}] ${doc.name}`

  try {
    const drive = getDriveClient()

    // Check if subfolder exists in parent
    const existing = await drive.files.list({
      q: `'${DEFAULT_PARENT_FOLDER_ID}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, webViewLink)',
    })

    let folderId = existing.data.files?.[0]?.id
    let folderUrl = existing.data.files?.[0]?.webViewLink

    if (!folderId) {
      const descriptionData = JSON.stringify({
        docNumber: doc.docNumber,
        name: doc.name,
        category: doc.category,
        division: doc.division,
        priority: doc.priority,
        stage: doc.stage,
        statusLabel: doc.statusLabel,
        pic: doc.pic,
        versionsCount: doc.versions?.length || 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }, null, 2)

      const createdFolder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [DEFAULT_PARENT_FOLDER_ID],
          description: descriptionData,
        },
        supportsAllDrives: true,
        fields: 'id, webViewLink',
      })
      folderId = createdFolder.data.id!
      folderUrl = createdFolder.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`
    }

    doc.driveFolderId = folderId || undefined
    doc.driveFolderUrl = folderUrl || undefined

    // Set anyone reader permissions on the document folder so it can be viewed by all authorized company users
    if (folderId) {
      try {
        await drive.permissions.create({
          fileId: folderId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        })
      } catch (permErr) {
        console.warn('[GDrive Folder Permission Warning]', permErr)
      }

      // Upload physical ringkasan_dan_log_dokumen.txt as complete audit trail log
      const txtContent = generateDocumentTxtLog(doc)
      uploadFileViaGasWebhook(folderId, 'ringkasan_dan_log_dokumen.txt', txtContent).catch((e) =>
        console.error('[GAS Background Upload Error]', e)
      )

      // Gather all document files: initial document, supporting documents, revision files, final document
      const filesToSync: StoredFile[] = []

      if (doc.initialDocument) {
        filesToSync.push(doc.initialDocument)
      }
      if (doc.supportingDocuments && doc.supportingDocuments.length > 0) {
        for (const sf of doc.supportingDocuments) {
          if (!filesToSync.some((x) => x.originalName === sf.originalName)) {
            filesToSync.push(sf)
          }
        }
      }
      if (doc.files && doc.files.length > 0) {
        for (const f of doc.files) {
          if (!filesToSync.some((x) => x.originalName === f.originalName)) {
            filesToSync.push(f)
          }
        }
      }
      if (doc.finalDocument) {
        if (!filesToSync.some((x) => x.originalName === doc.finalDocument!.originalName)) {
          filesToSync.push(doc.finalDocument)
        }
      }
      if (doc.revisionDocuments && doc.revisionDocuments.length > 0) {
        for (const rev of doc.revisionDocuments) {
          if (rev.file && !filesToSync.some((x) => x.originalName === rev.file.originalName)) {
            filesToSync.push(rev.file)
          }
        }
      }

      // Upload actual intact binary file for each file that contains dataUrl
      for (const f of filesToSync) {
        const fileName = f.originalName || f.filename
        if (!fileName || fileName === 'ringkasan_dan_log_dokumen.txt') continue

        // Always ensure url points to the reliable application download route
        const appDownloadUrl = `/api/documents/${doc.docNumber}/download?name=${encodeURIComponent(fileName)}`

        if (f.dataUrl && f.dataUrl.includes('base64,')) {
          try {
            const base64Data = f.dataUrl.split('base64,')[1]
            const buffer = Buffer.from(base64Data, 'base64')
            const uploadResult = await uploadOrUpdateFileInFolder(
              folderId,
              fileName,
              f.mimeType || 'application/octet-stream',
              buffer
            )
            if (uploadResult) {
              f.driveFileId = uploadResult.fileId
              f.driveViewUrl = uploadResult.webViewLink
              f.url = appDownloadUrl
            } else {
              f.url = appDownloadUrl
            }
          } catch (fileErr) {
            console.error(`[Upload Intact Document Error: ${fileName}]`, fileErr)
            f.url = appDownloadUrl
          }
        } else {
          f.url = appDownloadUrl
        }
      }
    }

    return {
      folderId: folderId || DEFAULT_PARENT_FOLDER_ID,
      folderUrl: folderUrl || `https://drive.google.com/drive/folders/${folderId}`,
      isLive: true,
      message: 'Folder Google Drive berhasil disinkronkan langsung!',
    }
  } catch (err: unknown) {
    console.error('[Google Drive Sync Exception]', err)
    const fallbackUrl = `https://drive.google.com/drive/folders/${DEFAULT_PARENT_FOLDER_ID}`
    return {
      folderId: DEFAULT_PARENT_FOLDER_ID,
      folderUrl: fallbackUrl,
      isLive: false,
      message: 'Sinkronisasi siap.',
    }
  }
}

export async function uploadFileViaGasWebhook(
  folderId: string,
  fileName: string,
  content: string
): Promise<boolean> {
  const gasUrl =
    process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL ||
    'https://script.google.com/macros/s/AKfycbz_iRTZF_Hul1zUQCkp-jxlX5dWZzOp6xkdDKmkUXSZV4rRpTHXyCTaWHRET9j6WCuJWw/exec'

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      body: JSON.stringify({ folderId, fileName, content }),
      redirect: 'follow',
    })
    return res.ok
  } catch (e) {
    console.error('[GAS Webhook Error]', e)
    return false
  }
}

import { Readable } from 'stream'

export async function uploadOrUpdateFileInFolder(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ fileId: string; webViewLink: string } | null> {
  const gasUrl =
    process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL ||
    'https://script.google.com/macros/s/AKfycbz_iRTZF_Hul1zUQCkp-jxlX5dWZzOp6xkdDKmkUXSZV4rRpTHXyCTaWHRET9j6WCuJWw/exec'

  try {
    const drive = getDriveClient()
    const sanitizedFileName = fileName.replace(/'/g, "\\'")

    const existing = await drive.files.list({
      q: `'${folderId}' in parents and name = '${sanitizedFileName}' and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, webViewLink)',
    })

    let fileId: string | undefined = existing.data.files?.[0]?.id || undefined

    if (!fileId) {
      // Create file in folder via GAS webhook so ownership and quota belong to ridetrackingofficial@gmail.com
      const res = await fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify({ folderId, fileName, content: 'init' }),
        redirect: 'follow',
      })
      if (res.ok) {
        const gasData = (await res.json()) as { fileId?: string; status?: string }
        fileId = gasData?.fileId
      }
    }

    if (!fileId) {
      console.error(`[GDrive Direct Upload] Could not create fileId for ${fileName}`)
      return null
    }

    // Stream the real intact binary data directly into the Google Drive file entry
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    const updated = await drive.files.update({
      fileId,
      media: {
        mimeType: mimeType || 'application/octet-stream',
        body: stream,
      },
      supportsAllDrives: true,
      fields: 'id, name, mimeType, size, webViewLink',
    })

    const webViewLink = updated.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`

    // Set permission to anyone reader so it can be previewed without Google account barrier
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      })
    } catch (permErr) {
      console.warn(`[GDrive Permission Anyone Warning for ${fileName}]`, permErr)
    }

    return {
      fileId,
      webViewLink,
    }
  } catch (err) {
    console.error(`[GDrive Direct Binary Sync Error for ${fileName}]`, err)
    return null
  }
}

/**
 * Download file binary stream from Google Drive
 */
export async function downloadFileFromGoogleDrive(
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
  try {
    const drive = getDriveClient()
    const meta = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: 'id, name, mimeType, size',
    })

    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      { responseType: 'arraybuffer' }
    )

    const buffer = Buffer.from(response.data as ArrayBuffer)
    return {
      buffer,
      mimeType: meta.data.mimeType || 'application/octet-stream',
      fileName: meta.data.name || 'document',
    }
  } catch (err) {
    console.error(`[GDrive Download Error for fileId ${fileId}]`, err)
    return null
  }
}

/**
 * Sync user profile to Google Drive User Registry folder
 */
let cachedDefaultHash: string | null = null

async function getDefaultPasswordHash(): Promise<string> {
  if (!cachedDefaultHash) {
    cachedDefaultHash = await bcrypt.hash('Password123!', 10)
  }
  return cachedDefaultHash
}

/**
 * Sync user profile and credentials to Google Drive User Registry folder
 */
export async function syncUserToGoogleDrive(user: StoredUser): Promise<boolean> {
  try {
    const drive = getDriveClient()
    const cleanEmail = user.email.toLowerCase().trim()
    const folderName = `👤 [${cleanEmail}] ${user.employeeName} (${user.role})`

    // Search for any existing folder in USERS_REGISTRY_FOLDER_ID matching this user
    const existing = await drive.files.list({
      q: `'${USERS_REGISTRY_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, description)',
    })

    const matchingFolders: { id: string; name?: string; description?: string }[] = []
    for (const f of existing.data.files || []) {
      let isMatch = false
      if (f.name && f.name.toLowerCase().includes(cleanEmail)) {
        isMatch = true
      } else if (f.description) {
        try {
          const d = JSON.parse(f.description)
          if (
            (d.email && d.email.toLowerCase().trim() === cleanEmail) ||
            d._id === user._id ||
            d.id === user.id ||
            d.id === user._id ||
            (cleanEmail === 'lukytrisasongko812@gmail.com' && d.email?.toLowerCase().includes('lukytrissasongko812')) ||
            (cleanEmail === 'lukytrissasongko812@gmail.com' && d.email?.toLowerCase().includes('lukytrisasongko812'))
          ) {
            isMatch = true
          }
        } catch {}
      }
      if (isMatch && f.id) {
        matchingFolders.push({ id: f.id, name: f.name || undefined, description: f.description || undefined })
      }
    }

    const fallbackHash = await getDefaultPasswordHash()
    const userMetadata = JSON.stringify({
      _id: user._id,
      id: user.id || user._id,
      employeeName: user.employeeName,
      email: cleanEmail,
      passwordHash: user.passwordHash || fallbackHash,
      position: user.position || 'Reviewer',
      division: user.division || 'Direktorat Umum',
      role: user.role,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      coverUrl: user.coverUrl || '',
      twoFactorEnabled: user.twoFactorEnabled ?? true,
      twoFactorSecret: user.twoFactorSecret || null,
      twoFactorExpires: user.twoFactorExpires || null,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, null, 2)

    let folderId: string | undefined

    if (matchingFolders.length > 0) {
      folderId = matchingFolders[0].id
      await drive.files.update({
        fileId: folderId,
        requestBody: {
          name: folderName,
          description: userMetadata,
        },
        supportsAllDrives: true,
      })

      // Clean up extra duplicate folders for this user
      if (matchingFolders.length > 1) {
        for (let i = 1; i < matchingFolders.length; i++) {
          try {
            await drive.files.update({
              fileId: matchingFolders[i].id,
              requestBody: { trashed: true },
              supportsAllDrives: true,
            })
          } catch {}
        }
      }
    } else {
      const created = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [USERS_REGISTRY_FOLDER_ID],
          description: userMetadata,
        },
        supportsAllDrives: true,
        fields: 'id',
      })
      folderId = created.data.id!
    }

    if (folderId) {
      // 1. Upload User Summary Text Log
      const profileTxt = `================================================================================
RIDE — PROFIL PENGGUNA TERDAFTAR
================================================================================
Nama Lengkap      : ${user.employeeName}
Email             : ${cleanEmail}
Peran (Role)      : ${user.role}
Jabatan/Posisi    : ${user.position || '-'}
Divisi/Direktorat : ${user.division || '-'}
No. Handphone     : ${user.phone || '-'}
Status Akun       : ${user.isActive ? 'Aktif' : 'Nonaktif'}
Keamanan 2FA      : ${user.twoFactorEnabled ? 'Aktif (Wajib OTP)' : 'Nonaktif'}
Terakhir Diupdate : ${new Date().toLocaleString('id-ID')}
================================================================================
Tautan Portal     : https://risetrack.id
`
      await uploadOrUpdateFileInFolder(
        folderId,
        'ringkasan_profil_pengguna.txt',
        'text/plain',
        Buffer.from(profileTxt, 'utf-8')
      )

      // 2. Upload Profile Picture (avatarUrl)
      if (user.avatarUrl && user.avatarUrl.startsWith('data:image/')) {
        const matches = user.avatarUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
          const mime = `image/${matches[1]}`
          const buf = Buffer.from(matches[2], 'base64')
          await uploadOrUpdateFileInFolder(folderId, `foto_profil.${ext}`, mime, buf)
        }
      }

      // 3. Upload Cover Photo (coverUrl)
      if (user.coverUrl && user.coverUrl.startsWith('data:image/')) {
        const matches = user.coverUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
          const mime = `image/${matches[1]}`
          const buf = Buffer.from(matches[2], 'base64')
          await uploadOrUpdateFileInFolder(folderId, `foto_sampul.${ext}`, mime, buf)
        }
      }
    }

    return true
  } catch (e) {
    console.error('[User Drive Sync Error]', e)
    return false
  }
}

/**
 * Retrieve all registered users directly from Google Drive User Registry
 */
export async function getUsersFromGoogleDriveRegistry(): Promise<StoredUser[]> {
  try {
    const drive = getDriveClient()
    const res = await drive.files.list({
      q: `'${USERS_REGISTRY_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, description)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    const usersMap = new Map<string, StoredUser>()
    const files = res.data.files || []
    const fallbackHash = await getDefaultPasswordHash()

    for (const f of files) {
      if (!f.description) continue
      try {
        const data = JSON.parse(f.description)
        if (!data.email) continue
        const email = data.email.toLowerCase().trim()
        const id = data._id || data.id || `usr_${f.id}`

        const stored: StoredUser = {
          _id: id,
          id: id,
          employeeName: data.employeeName || 'Pengguna RIDE',
          email: email,
          passwordHash: data.passwordHash || fallbackHash,
          position: data.position || 'Reviewer',
          division: data.division || 'Direktorat Umum',
          role: data.role || 'Reviewer',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || undefined,
          coverUrl: data.coverUrl || undefined,
          twoFactorEnabled: data.twoFactorEnabled ?? true,
          twoFactorSecret: data.twoFactorSecret || undefined,
          twoFactorExpires: data.twoFactorExpires || null,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        }

        if (usersMap.has(email)) {
          const prev = usersMap.get(email)!
          const prevTime = new Date(prev.updatedAt).getTime()
          const currTime = new Date(stored.updatedAt).getTime()
          if (currTime >= prevTime) {
            usersMap.set(email, stored)
          }
        } else {
          usersMap.set(email, stored)
        }
      } catch (parseErr) {
        // Non-user folder description or format error
      }
    }

    return Array.from(usersMap.values())
  } catch (err) {
    console.error('[GDrive getUsersFromGoogleDriveRegistry Error]', err)
    return []
  }
}

/**
 * Live lookup of a user by email directly from Google Drive User Registry
 */
export async function getUserFromGoogleDriveByEmail(email: string): Promise<StoredUser | null> {
  if (!email) return null
  const clean = email.toLowerCase().trim()
  const allUsers = await getUsersFromGoogleDriveRegistry()
  return (
    allUsers.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (clean === 'lukytrisasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrissasongko812@gmail.com') ||
        (clean === 'lukytrissasongko812@gmail.com' && u.email.toLowerCase() === 'lukytrisasongko812@gmail.com') ||
        (clean === 'luckytrisasongko812@gmail.com' && u.email.toLowerCase().includes('luckytrisasongko812'))
    ) || null
  )
}

/**
 * Live lookup of a user by ID directly from Google Drive User Registry
 */
export async function getUserFromGoogleDriveById(id: string): Promise<StoredUser | null> {
  if (!id) return null
  const cleanId = id.trim()
  const allUsers = await getUsersFromGoogleDriveRegistry()
  return (
    allUsers.find(
      (u) =>
        u._id === cleanId ||
        u.id === cleanId ||
        u.email.toLowerCase() === cleanId.toLowerCase()
    ) || null
  )
}

/**
 * Delete / trash user folder in Google Drive User Registry
 */
export async function deleteUserFromGoogleDrive(id: string, email?: string): Promise<boolean> {
  try {
    const drive = getDriveClient()
    const cleanId = id.trim()
    const cleanEmail = email ? email.toLowerCase().trim() : ''

    const res = await drive.files.list({
      q: `'${USERS_REGISTRY_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, description)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    for (const f of res.data.files || []) {
      let shouldDelete = false
      if (cleanEmail && f.name?.toLowerCase().includes(cleanEmail)) {
        shouldDelete = true
      }
      if (!shouldDelete && f.description) {
        try {
          const d = JSON.parse(f.description)
          if (
            (cleanEmail && d.email?.toLowerCase().trim() === cleanEmail) ||
            d._id === cleanId ||
            d.id === cleanId
          ) {
            shouldDelete = true
          }
        } catch {}
      }
      if (shouldDelete && f.id) {
        await drive.files.update({
          fileId: f.id,
          requestBody: { trashed: true },
          supportsAllDrives: true,
        })
      }
    }
    return true
  } catch (err) {
    console.error('[GDrive deleteUserFromGoogleDrive Error]', err)
    return false
  }
}

