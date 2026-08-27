import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (body.role !== undefined) user.role = body.role
    if (body.position !== undefined) user.position = body.position
    if (body.division !== undefined) user.division = body.division
    if (body.employeeName !== undefined) user.employeeName = body.employeeName

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        employeeName: user.employeeName,
        email: user.email,
        position: user.position,
        division: user.division,
        role: user.role,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
