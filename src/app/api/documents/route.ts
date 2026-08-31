import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocuments, saveDriveDocument, StoredDocument } from '@/lib/drive-store'
import { sendNotificationEmail } from '@/lib/email'
import { generateDocumentTxtLog, syncDocumentToGoogleDrive } from '@/lib/gdrive'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''

    let docs = await getDriveDocuments(query, status, category)

    // Role-based access control: Requester can strictly only view their own documents
    if (tokenUser && tokenUser.role === 'Requester') {
      const userEmail = tokenUser.email.toLowerCase()
      const userId = tokenUser.userId
      const userName = tokenUser.employeeName?.toLowerCase() || ''
      docs = docs.filter(
        (d) =>
          d.createdBy === userId ||
          (d.picEmail && d.picEmail.toLowerCase() === userEmail) ||
          (d.pic && d.pic.toLowerCase() === userName)
      )
    }

    return NextResponse.json(docs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request)
    const body = await request.json()

    const {
      name,
      category,
      division,
      priority,
      confidentiality,
      contractStart,
      contractEnd,
      noDuration,
      notes,
      files,
    } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Nama dan kategori dokumen wajib diisi.' }, { status: 400 })
    }

    const existingDocs = await getDriveDocuments()
    const docNumber = `RIDE-2026-${(145 + existingDocs.length).toString().padStart(4, '0')}`
    const actorName = tokenUser?.employeeName || 'Requester'
    const now = new Date().toISOString()

    const uploadedFilesList = files || []
    const initialDocFile = uploadedFilesList.length > 0 ? uploadedFilesList[0] : null
    const supportingFiles = uploadedFilesList.length > 1 ? uploadedFilesList.slice(1) : []

    const versionsList = []
    if (initialDocFile) {
      versionsList.push({
        version: 'V0',
        file: initialDocFile,
        notes: notes || 'Pengajuan draf dokumen awal.',
        uploadedBy: actorName,
        uploadedAt: now,
        isFinal: false,
        fileType: 'initial' as const,
      })
    }

    const historyList = [
      {
        stage: 0,
        action: 'Pengajuan Dokumen Awal (V0)',
        actor: actorName,
        notes: notes || 'Dokumen berhasil diajukan ke antrean verifikasi.',
        versionTag: 'V0',
        timestamp: now,
      },
    ]

    const newDoc: StoredDocument = {
      _id: 'doc_' + Math.random().toString(36).substring(2, 9),
      docNumber,
      name,
      category,
      division: division || 'Direktorat Umum',
      priority: priority || 'Normal',
      confidentiality: confidentiality || 'Internal',
      contractStart: noDuration ? null : contractStart ? new Date(contractStart).toISOString() : null,
      contractEnd: noDuration ? null : contractEnd ? new Date(contractEnd).toISOString() : null,
      noDuration: Boolean(noDuration),
      notes: notes || '',
      stage: 0,
      stageStatus: 'active',
      statusLabel: 'Pengajuan Baru (V0)',
      pic: actorName,
      picEmail: tokenUser?.email || '',
      revisionRequested: false,
      rejected: false,
      files: uploadedFilesList,
      initialDocument: initialDocFile,
      revisionDocuments: [],
      supportingDocuments: supportingFiles,
      finalDocument: null,
      versions: versionsList,
      history: historyList,
      driveFolderId: undefined,
      driveFolderUrl: undefined,
      createdBy: tokenUser?.userId,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const gdriveResult = await syncDocumentToGoogleDrive(newDoc)
      if (gdriveResult.folderId) {
        newDoc.driveFolderId = gdriveResult.folderId
        newDoc.driveFolderUrl = gdriveResult.folderUrl
      }
    } catch (gErr) {
      console.error('[Google Drive Live Folder Creation Error]', gErr)
    }

    await saveDriveDocument(newDoc)

    // Send real email notification via Resend
    const creatorEmail = tokenUser?.email || 'toto.rubianto.17@gmail.com'
    await sendNotificationEmail({
      to: creatorEmail,
      userName: actorName,
      title: `Pengajuan Dokumen Baru: ${docNumber}`,
      description: `Dokumen "${name}" (${category}) berhasil didaftarkan ke portal RIDE dan masuk ke antrean Reviewer.`,
      docNumber,
    }).catch((err) => console.error('[Creation Email Failed]', err))

    return NextResponse.json(newDoc, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
