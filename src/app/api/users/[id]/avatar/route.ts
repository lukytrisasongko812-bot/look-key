import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, getDriveUserByEmail } from '@/lib/drive-store'
import {
  getUserAvatarBufferFromGoogleDrive,
  getUserCoverBufferFromGoogleDrive,
} from '@/lib/gdrive'

export const dynamic = 'force-dynamic'

function generateInitialsSvg(name: string): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'RD'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2147"/>
      <stop offset="100%" stop-color="#163A70"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#g)"/>
  <text x="64" y="74" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="44" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`
}

function generateCoverFallbackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 1200 320">
  <defs>
    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07162E"/>
      <stop offset="50%" stop-color="#0B2147"/>
      <stop offset="100%" stop-color="#163A70"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="320" fill="url(#cg)"/>
  <circle cx="1050" cy="60" r="180" fill="#D4A843" fill-opacity="0.08"/>
  <circle cx="180" cy="280" r="220" fill="#3B82F6" fill-opacity="0.08"/>
</svg>`
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const cleanId = decodeURIComponent(id)
    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get('type') === 'cover' ? 'cover' : 'avatar'

    let user = await getDriveUserById(cleanId)
    if (!user && cleanId.includes('@')) {
      user = await getDriveUserByEmail(cleanId)
    }

    if (!user) {
      const svg = mediaType === 'cover' ? generateCoverFallbackSvg() : generateInitialsSvg('User')
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    if (mediaType === 'cover') {
      // 1. Direct Base64 dataUrl if stored locally
      if (user.coverUrl && user.coverUrl.startsWith('data:image/')) {
        const matches = user.coverUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
        if (matches) {
          const mime = `image/${matches[1]}`
          const buffer = Buffer.from(matches[2], 'base64')
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mime,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
          })
        }
      }

      // 2. Fetch cover binary from Google Drive / memory cache
      try {
        const driveCover = await getUserCoverBufferFromGoogleDrive(
          user._id || user.email,
          user.coverFileId
        )
        if (driveCover && driveCover.buffer && driveCover.buffer.length > 0) {
          return new NextResponse(new Uint8Array(driveCover.buffer), {
            headers: {
              'Content-Type': driveCover.mimeType || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
          })
        }
      } catch (gErr) {
        console.warn('[Cover GDrive Stream Warning]', gErr)
      }

      // 3. External cover URL
      if (user.coverUrl && user.coverUrl.startsWith('http') && !user.coverUrl.includes('drive.google.com')) {
        return NextResponse.redirect(user.coverUrl, { status: 307 })
      }

      // 4. Default fallback cover SVG
      return new NextResponse(generateCoverFallbackSvg(), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // AVATAR STREAMING
    // 1. Direct Base64 dataUrl if stored locally
    if (user.avatarUrl && user.avatarUrl.startsWith('data:image/')) {
      const matches = user.avatarUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
      if (matches) {
        const mime = `image/${matches[1]}`
        const buffer = Buffer.from(matches[2], 'base64')
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        })
      }
    }

    // 2. Fetch image binary from Google Drive via avatarFileId or user folder
    try {
      const driveImage = await getUserAvatarBufferFromGoogleDrive(
        user._id || user.email,
        user.avatarFileId
      )
      if (driveImage && driveImage.buffer && driveImage.buffer.length > 0) {
        return new NextResponse(new Uint8Array(driveImage.buffer), {
          headers: {
            'Content-Type': driveImage.mimeType || 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        })
      }
    } catch (gErr) {
      console.warn('[Avatar GDrive Stream Warning]', gErr)
    }

    // 3. If external image url (excluding non-image Google Drive html viewers)
    if (user.avatarUrl && user.avatarUrl.startsWith('http') && !user.avatarUrl.includes('drive.google.com')) {
      return NextResponse.redirect(user.avatarUrl, { status: 307 })
    }

    // 4. Default fallback: SVG initials
    const svg = generateInitialsSvg(user.employeeName || 'User')
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: unknown) {
    const svg = generateInitialsSvg('User')
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
