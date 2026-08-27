import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { DocumentModel } from '@/models/Document'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const doc = mongoose.Types.ObjectId.isValid(id)
      ? await DocumentModel.findById(id)
      : await DocumentModel.findOne({ docNumber: id })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(doc)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const doc = mongoose.Types.ObjectId.isValid(id)
      ? await DocumentModel.findById(id)
      : await DocumentModel.findOne({ docNumber: id })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (body.name !== undefined) doc.name = body.name
    if (body.pic !== undefined) doc.pic = body.pic
    if (body.stage !== undefined) doc.stage = body.stage
    if (body.stageStatus !== undefined) doc.stageStatus = body.stageStatus
    if (body.revisionRequested !== undefined) doc.revisionRequested = body.revisionRequested
    if (body.rejected !== undefined) doc.rejected = body.rejected
    if (body.contractStart !== undefined) doc.contractStart = body.contractStart ? new Date(body.contractStart) : null
    if (body.contractEnd !== undefined) doc.contractEnd = body.contractEnd ? new Date(body.contractEnd) : null
    if (body.notes !== undefined) doc.notes = body.notes

    await doc.save()

    return NextResponse.json(doc)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const doc = mongoose.Types.ObjectId.isValid(id)
      ? await DocumentModel.findByIdAndDelete(id)
      : await DocumentModel.findOneAndDelete({ docNumber: id })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
