import { google } from 'googleapis'
import { StoredDocument, StoredUser, StoredNotification } from './drive-store'

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

    // Upload physical ringkasan_dan_log_dokumen.txt and attached document files via Google Apps Script Webhook
    if (folderId) {
      const txtContent = generateDocumentTxtLog(doc)
      uploadFileViaGasWebhook(folderId, 'ringkasan_dan_log_dokumen.txt', txtContent).catch((e) =>
        console.error('[GAS Background Upload Error]', e)
      )

      if (doc.files && doc.files.length > 0) {
        for (const f of doc.files) {
          const fileName = f.originalName || f.filename
          if (fileName && fileName !== 'ringkasan_dan_log_dokumen.txt') {
            const fileInfoContent = `================================================================================
RIDE — BERKAS DOKUMEN: ${fileName}
ARSIP: [${doc.docNumber}] ${doc.name}
================================================================================
Nama Berkas    : ${fileName}
Kategori       : ${doc.category}
Divisi Pemohon : ${doc.division}
Penanggung Jwb : ${doc.pic} (${doc.picEmail || '-'})
Status Tahapan : ${doc.statusLabel} (Tahap ${doc.stage}/5)
Ukuran Berkas  : ${f.size ? (f.size / 1024).toFixed(1) + ' KB' : '-'}
Tipe Format    : ${f.mimeType || 'Dokumen'}
Tanggal Unggah : ${f.uploadedAt || doc.createdAt}
================================================================================
Tautan Portal  : https://risetrack.id
`
            uploadFileViaGasWebhook(folderId, fileName, fileInfoContent).catch((e) =>
              console.error('[GAS Attachment Sync Error]', e)
            )
          }
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
): Promise<string | null> {
  try {
    const drive = getDriveClient()
    const existing = await drive.files.list({
      q: `'${folderId}' in parents and name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, webViewLink)',
    })

    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    if (existing.data.files && existing.data.files.length > 0) {
      const fileId = existing.data.files[0].id!
      const updated = await drive.files.update({
        fileId,
        media: {
          mimeType,
          body: stream,
        },
        supportsAllDrives: true,
        fields: 'id, webViewLink',
      })
      return updated.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
    } else {
      const created = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType,
        },
        media: {
          mimeType,
          body: stream,
        },
        supportsAllDrives: true,
        fields: 'id, webViewLink',
      })
      return created.data.webViewLink || `https://drive.google.com/file/d/${created.data.id}/view`
    }
  } catch (err) {
    console.error(`[GDrive Direct Upload Error for ${fileName}]`, err)
    // Fallback to GAS Webhook for text or small base64
    if (buffer.length < 5 * 1024 * 1024) {
      uploadFileViaGasWebhook(folderId, fileName, buffer.toString('utf-8')).catch((e) =>
        console.error('[GAS Upload Fallback Error]', e)
      )
    }
    return null
  }
}

/**
 * Sync user profile to Google Drive User Registry folder
 */
export async function syncUserToGoogleDrive(user: StoredUser): Promise<boolean> {
  try {
    const drive = getDriveClient()
    const folderName = `👤 ${user.employeeName} (${user.role})`

    const existing = await drive.files.list({
      q: `'${USERS_REGISTRY_FOLDER_ID}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, webViewLink)',
    })

    const userMetadata = JSON.stringify({
      id: user._id,
      employeeName: user.employeeName,
      email: user.email,
      position: user.position,
      division: user.division,
      role: user.role,
      phone: user.phone || '',
      twoFactorEnabled: user.twoFactorEnabled,
      isActive: user.isActive,
      updatedAt: new Date().toISOString(),
    }, null, 2)

    let folderId: string | undefined

    if (existing.data.files && existing.data.files.length > 0) {
      folderId = existing.data.files[0].id!
      await drive.files.update({
        fileId: folderId,
        requestBody: {
          name: folderName,
          description: userMetadata,
        },
        supportsAllDrives: true,
      })
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
Email             : ${user.email}
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
