import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Pendaftaran publik ditutup. Akun baru sistem RISE hanya dapat diterbitkan melalui undangan resmi Administrator.',
    },
    { status: 403 }
  )
}
