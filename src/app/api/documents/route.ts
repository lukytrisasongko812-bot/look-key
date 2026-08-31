import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { sendNotificationEmail } from '@/lib/email'
import { seedDatabase } from '@/lib/seed'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Auto-seed if collection is empty
    const count = await DocumentModel.countDocuments()
    if (count === 0) {
      await seedDatabase()
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''

    const filter: Record<string, unknown> = {}

    if (q) {
      const regex = new RegExp(q, 'i')
      filter.$or = [
        { docNumber: regex },
        { name: regex },
        { category: regex },
        { pic: regex },
        { division: regex },
      ]
    }

    if (category) {
      filter.category = category
    }

    // Status filter mapping:
    if (status) {
      if (status === 'Rejected') {
        filter.rejected = true
      } else if (status === 'Revision Needed' || status === 'Perlu Revisi') {
        filter.revisionRequested = true
        filter.rejected = false
      } else if (status === 'Review' || status === 'Sedang Diproses') {
        filter.stage = { $in: [0, 1, 2] }
        filter.rejected = false
        filter.revisionRequested = false
      } else if (status === 'Waiting Approval' || status === 'Menunggu Persetujuan') {
        filter.stage = { $in: [3, 4] }
        filter.rejected = false
      } else if (status === 'Completed' || status === 'Archived' || status === 'Selesai') {
        filter.stage = { $in: [5, 6] }
        filter.rejected = false
      }
    }

    const docs = await DocumentModel.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(docs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
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

    const totalCount = await DocumentModel.countDocuments()
    const docNumber = `RIDE-2026-${(145 + totalCount).toString().padStart(4, '0')}`
    const actorName = tokenUser?.employeeName || 'Requester'
    const now = new Date()

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

    const newDoc = await DocumentModel.create({
      docNumber,
      name,
      category,
      division: division || 'Direktorat Umum',
      priority: priority || 'Normal',
      confidentiality: confidentiality || 'Internal',
      contractStart: noDuration ? null : contractStart ? new Date(contractStart) : null,
      contractEnd: noDuration ? null : contractEnd ? new Date(contractEnd) : null,
      noDuration: Boolean(noDuration),
      notes: notes || '',
      stage: 0, // Submitted
      stageStatus: 'active',
      statusLabel: 'Pengajuan Baru (V0)',
      pic: actorName,
      picEmail: tokenUser?.email || '',
      files: uploadedFilesList,
      initialDocument: initialDocFile,
      revisionDocuments: [],
      supportingDocuments: supportingFiles,
      finalDocument: null,
      versions: versionsList,
      history: historyList,
      createdBy: tokenUser?.userId,
    })

    // Create confirmation notification
    await NotificationModel.create({
      userId: tokenUser?.userId ? new mongoose.Types.ObjectId(tokenUser.userId) : undefined,
      type: 'email_sent',
      title: 'Pengajuan Dokumen Baru',
      description: `Pengajuan ${docNumber} (${name}) berhasil didaftarkan ke sistem RIDE.`,
    })

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
