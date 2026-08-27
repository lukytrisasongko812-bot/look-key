import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const uploadedResults = []

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        continue // Skip files over 10MB
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uniqueFilename = `${Date.now()}_${sanitizedName}`
      const filePath = path.join(uploadDir, uniqueFilename)

      await writeFile(filePath, buffer)

      uploadedResults.push({
        originalName: file.name,
        filename: uniqueFilename,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        url: `/uploads/${uniqueFilename}`,
        uploadedAt: new Date(),
      })
    }

    return NextResponse.json({ success: true, files: uploadedResults })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
