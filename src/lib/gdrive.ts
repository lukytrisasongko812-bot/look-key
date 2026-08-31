import { google } from 'googleapis'
import { IDocumentRecord } from '@/models/Document'
import { Readable } from 'stream'

/**
 * Format complete text log for document history (.txt file)
 */
export function generateDocumentTxtLog(doc: IDocumentRecord): string {
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
      .map((v, i) => {
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
        return `  ${(i + 1).toString().padStart(2, '0')}. [${time} WIB] [Versi: ${h.versionTag || 'V0'}]\n      Aksi   : ${h.action}\n      Pelaksana: ${h.actor}\n      Catatan  : ${h.notes || '-'}`
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
================================================================================
`.trim()
}

/**
 * Sync document folder and text logs to Google Drive
 */
export async function syncDocumentToGoogleDrive(doc: IDocumentRecord): Promise<{
  folderId: string
  folderUrl: string
  isLive: boolean
  message: string
}> {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  const folderName = `[${doc.docNumber}] ${doc.name}`
  const txtContent = generateDocumentTxtLog(doc)
  const jsonMetadata = JSON.stringify(
    {
      docNumber: doc.docNumber,
      name: doc.name,
      category: doc.category,
      division: doc.division,
      priority: doc.priority,
      confidentiality: doc.confidentiality,
      stage: doc.stage,
      statusLabel: doc.statusLabel,
      pic: doc.pic,
      versionsCount: doc.versions?.length || 0,
      historyCount: doc.history?.length || 0,
      syncedAt: new Date().toISOString(),
    },
    null,
    2
  )

  // 1. If Google Service Account credentials exist, perform real Drive API call
  if (serviceEmail && privateKey) {
    try {
      const auth = new google.auth.JWT({
        email: serviceEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      })

      const drive = google.drive({ version: 'v3', auth })

      // Check if folder already exists
      let folderId = doc.driveFolderId
      if (!folderId) {
        const query = parentFolderId
          ? `'${parentFolderId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
          : `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`

        const existingFolders = await drive.files.list({
          q: query,
          fields: 'files(id, name, webViewLink)',
          spaces: 'drive',
        })

        if (existingFolders.data.files && existingFolders.data.files.length > 0) {
          folderId = existingFolders.data.files[0].id || undefined
        } else {
          // Create new folder in Drive
          const folderRes = await drive.files.create({
            requestBody: {
              name: folderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: parentFolderId ? [parentFolderId] : undefined,
            },
            fields: 'id, webViewLink',
          })
          folderId = folderRes.data.id || undefined
        }
      }

      if (folderId) {
        // Upload / Overwrite ringkasan_dan_log_dokumen.txt
        const txtStream = Readable.from([txtContent])
        const existingTxt = await drive.files.list({
          q: `'${folderId}' in parents and name = 'ringkasan_dan_log_dokumen.txt' and trashed = false`,
          fields: 'files(id)',
        })

        if (existingTxt.data.files && existingTxt.data.files.length > 0) {
          await drive.files.update({
            fileId: existingTxt.data.files[0].id!,
            media: { mimeType: 'text/plain', body: txtStream },
          })
        } else {
          await drive.files.create({
            requestBody: {
              name: 'ringkasan_dan_log_dokumen.txt',
              parents: [folderId],
            },
            media: { mimeType: 'text/plain', body: txtStream },
          })
        }

        // Upload / Overwrite metadata.json
        const jsonStream = Readable.from([jsonMetadata])
        const existingJson = await drive.files.list({
          q: `'${folderId}' in parents and name = 'metadata.json' and trashed = false`,
          fields: 'files(id)',
        })

        if (existingJson.data.files && existingJson.data.files.length > 0) {
          await drive.files.update({
            fileId: existingJson.data.files[0].id!,
            media: { mimeType: 'application/json', body: jsonStream },
          })
        } else {
          await drive.files.create({
            requestBody: {
              name: 'metadata.json',
              parents: [folderId],
            },
            media: { mimeType: 'application/json', body: jsonStream },
          })
        }

        const folderUrl = `https://drive.google.com/drive/folders/${folderId}`
        doc.driveFolderId = folderId
        doc.driveFolderUrl = folderUrl
        await doc.save()

        return {
          folderId,
          folderUrl,
          isLive: true,
          message: 'Folder Google Drive & file log teks berhasil disinkronkan!',
        }
      }
    } catch (err: unknown) {
      console.error('[Google Drive Sync Exception]', err)
    }
  }

  // 2. Structured Simulation / Virtual Drive Link (Ready for instant setup)
  const virtualFolderId = doc.driveFolderId || `gdrive-${doc.docNumber.toLowerCase()}`
  const virtualFolderUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(doc.docNumber)}`

  doc.driveFolderId = virtualFolderId
  doc.driveFolderUrl = virtualFolderUrl
  await doc.save()

  return {
    folderId: virtualFolderId,
    folderUrl: virtualFolderUrl,
    isLive: false,
    message: 'Log dokumen teks & metadata siap disinkronkan ke Google Drive.',
  }
}
