import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import { NotificationModel } from '@/models/Notification'
import { seedDatabase } from '@/lib/seed'
import { getUserFromRequest } from '@/lib/auth'

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
    // 0,1: Review | 2: Legal Drafting | 3,4: Waiting Approval | 5,6: Archived
    if (status) {
      if (status === 'Rejected') {
        filter.rejected = true
      } else if (status === 'Revision Needed') {
        filter.revisionRequested = true
        filter.rejected = false
      } else if (status === 'Review') {
        filter.stage = { $in: [0, 1] }
        filter.rejected = false
        filter.revisionRequested = false
      } else if (status === 'Legal Drafting') {
        filter.stage = 2
        filter.rejected = false
        filter.revisionRequested = false
      } else if (status === 'Waiting Approval') {
        filter.stage = { $in: [3, 4] }
        filter.rejected = false
      } else if (status === 'Completed' || status === 'Archived') {
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
      return NextResponse.json({ error: 'Document name and category are required' }, { status: 400 })
    }

    // Auto-generate document number
    const totalCount = await DocumentModel.countDocuments()
    const docNumber = `RISE-2026-${(143 + totalCount).toString().padStart(4, '0')}`

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
      pic: 'Luky P.',
      files: files || [],
      createdBy: tokenUser?.userId,
    })

    // Create confirmation notification
    await NotificationModel.create({
      userId: tokenUser?.userId,
      type: 'email_sent',
      title: 'Request Submitted',
      description: `Request ${docNumber} submitted — Email & WhatsApp notification sent`,
    })

    return NextResponse.json(newDoc, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
