import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const result = await seedDatabase(force)
    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const force = body.force === true
    const result = await seedDatabase(force)
    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
