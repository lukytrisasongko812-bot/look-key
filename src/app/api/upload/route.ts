import { NextRequest, NextResponse } from 'next/server'
import { uploadOrUpdateFileInFolder } from '@/lib/gdrive'

export const dynamic = 'force-dynamic'

const DEFAULT_UPLOAD_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || '1S8ifA-RtvGB0JGFPZSfsaL_IX65Nc16F'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const folderId = (formData.get('folderId') as string) || DEFAULT_UPLOAD_FOLDER_ID

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah.' }, { status: 400 })
    }

    const uploadedResults = []

    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        continue // Skip files over 25MB
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const sanitizedName = file.name.replace(/[^\w\s.-]/gi, '_')
      const mimeType = file.type || 'application/pdf'

      // Generate base64 dataUrl for small preview files (< 1.5 MB)
      let dataUrl: string | undefined
      if (file.size <= 1.5 * 1024 * 1024) {
        dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
      }

      // Upload to Google Drive
      let driveFileId = ''
      let driveViewUrl = ''
      try {
        const driveRes = await uploadOrUpdateFileInFolder(
          folderId,
          sanitizedName,
          mimeType,
          buffer
        )
        if (driveRes) {
          driveFileId = driveRes.fileId
          driveViewUrl = driveRes.webViewLink || ''
        }
      } catch (gErr) {
        console.warn('[Upload Route GDrive Sync Error]', gErr)
      }

      uploadedResults.push({
        originalName: file.name,
        filename: sanitizedName,
        size: file.size,
        mimeType,
        url: driveViewUrl || `/files/${encodeURIComponent(sanitizedName)}`,
        dataUrl,
        driveFileId,
        driveViewUrl,
        uploadedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, files: uploadedResults })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload gagal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
