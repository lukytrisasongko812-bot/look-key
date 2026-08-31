import { NextRequest, NextResponse } from 'next/server'
import { getDriveDocuments, saveDriveDocument, getDriveUsers } from '@/lib/drive-store'
import { sendContractReminderEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleCronReminders(request)
}

export async function POST(request: NextRequest) {
  return handleCronReminders(request)
}

async function handleCronReminders(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 })
    }

    const docs = await getDriveDocuments()
    const users = await getDriveUsers()

    const now = new Date()
    let processed = 0
    let emailsSent = 0
    const results: Array<{
      docNumber: string
      name: string
      diffDays: number
      milestone: string
      recipient: string
      status: string
    }> = []

    for (const doc of docs) {
      if (!doc.contractEnd || doc.noDuration) continue

      const end = new Date(doc.contractEnd)
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const config = doc.reminders || {
        h60: true,
        h30: true,
        h15: true,
        h7: true,
        h1: true,
      }

      // Determine active milestone
      let milestone: 'h60' | 'h30' | 'h15' | 'h7' | 'h1' | 'expired' | null = null

      if (diffDays <= 60 && diffDays > 30 && config.h60) {
        milestone = 'h60'
      } else if (diffDays <= 30 && diffDays > 15 && config.h30) {
        milestone = 'h30'
      } else if (diffDays <= 15 && diffDays > 7 && config.h15) {
        milestone = 'h15'
      } else if (diffDays <= 7 && diffDays > 1 && config.h7) {
        milestone = 'h7'
      } else if (diffDays === 1 || diffDays === 0) {
        if (config.h1) milestone = 'h1'
      } else if (diffDays < 0 && diffDays >= -7) {
        milestone = 'expired'
      }

      if (!milestone) continue

      // Prevent duplicate spam if already sent for this milestone
      if (doc.reminders?.lastSentMilestone === milestone) {
        continue
      }

      processed++

      // Determine recipients: doc creator, PIC, or division admins
      const creatorUser = users.find(
        (u) =>
          u.employeeName === doc.createdBy ||
          u.email === doc.createdBy ||
          u.employeeName === doc.pic
      )
      const targetEmail =
        creatorUser?.email ||
        (doc.createdBy?.includes('@') ? doc.createdBy : 'toto.rubianto.17@gmail.com')
      const targetName =
        creatorUser?.employeeName || doc.pic || doc.createdBy || 'Bapak/Ibu'

      // Send Contract Expiry Reminder Email via Resend / SMTP
      const emailResult = await sendContractReminderEmail({
        to: targetEmail,
        userName: targetName,
        docNumber: doc.docNumber,
        docName: doc.name,
        milestone,
        diffDays,
        contractEnd: doc.contractEnd,
        division: doc.division || 'Umum',
        customNotes: config.customNotes,
      })

      // Update document with last sent milestone
      doc.reminders = {
        ...config,
        lastSentMilestone: milestone,
      }
      await saveDriveDocument(doc)

      if (emailResult.success) emailsSent++

      results.push({
        docNumber: doc.docNumber,
        name: doc.name,
        diffDays,
        milestone,
        recipient: targetEmail,
        status: emailResult.provider || 'sent',
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      contractsChecked: docs.filter((d) => d.contractEnd && !d.noDuration).length,
      remindersTriggered: processed,
      emailsSent,
      results,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memproses cron pengingat'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
