import { NextRequest, NextResponse } from 'next/server'
import { getDriveUserById, getDriveUserByEmail } from '@/lib/drive-store'

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const cleanId = decodeURIComponent(id)

    let user = await getDriveUserById(cleanId)
    if (!user && cleanId.includes('@')) {
      user = await getDriveUserByEmail(cleanId)
    }

    if (!user) {
      const svg = generateInitialsSvg('User')
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

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

    if (user.avatarUrl && user.avatarUrl.startsWith('http')) {
      return NextResponse.redirect(user.avatarUrl, { status: 307 })
    }

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
