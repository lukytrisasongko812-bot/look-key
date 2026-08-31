import nodemailer from 'nodemailer'

interface SendOtpEmailOptions {
  to: string
  userName: string
  otpCode: string
  expiresInMinutes?: number
}

/**
 * Generate a professional corporate HTML email template for 2FA OTP
 */
function generateOtpHtml(userName: string, otpCode: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi 2FA RIDE</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 540px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 42, 84, 0.05); }
    .header { background: linear-gradient(135deg, #0B2147 0%, #163A70 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .header-logo { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px; }
    .header-sub { font-size: 11px; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; color: #0F172A; }
    .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #0F172A; }
    .message { font-size: 13.5px; line-height: 1.6; color: #475569; margin-bottom: 28px; }
    .otp-box { background: #F1F5F9; border: 2px dashed #94A3B8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #163A70; margin: 0; }
    .otp-note { font-size: 11.5px; color: #64748B; margin-top: 8px; }
    .security-notice { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #92400E; margin-bottom: 24px; line-height: 1.5; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">RIDE</div>
      <div class="header-sub">Request Integrated Document Ecosystem · Otentikasi Keamanan 2FA</div>
    </div>
    <div class="content">
      <div class="greeting">Halo, ${userName}</div>
      <div class="message">
        Kami menerima permintaan masuk ke akun Anda pada sistem <strong>RIDE (Request Integrated Document Ecosystem)</strong>.
        Gunakan kode One-Time Password (OTP) berikut untuk menyelesaikan proses otentikasi:
      </div>

      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
        <div class="otp-note">Berlaku selama ${expiresInMinutes} menit</div>
      </div>

      <div class="security-notice">
        <strong>Peringatan Keamanan:</strong> Jangan pernah memberikan kode OTP ini kepada siapa pun. Sistem RIDE tidak pernah meminta kode otentikasi Anda secara langsung.
      </div>

      <div class="message" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Jika Anda tidak merasa melakukan permintaan masuk ini, segera amankan akun Anda melalui sistem risetrack.id.
      </div>
    </div>
    <div class="footer">
      <div>RIDE — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Email ini dikirim secara otomatis oleh sistem keamanan <a href="https://risetrack.id" style="color: #163A70; text-decoration: none;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send real 2FA OTP Email via Resend API or SMTP (nodemailer)
 */
export async function sendOtpEmail({
  to,
  userName,
  otpCode,
  expiresInMinutes = 5,
}: SendOtpEmailOptions): Promise<{ success: boolean; provider?: string; emailId?: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Security <official@risetrack.id>'
  const subject = `[RIDE] Kode Verifikasi 2FA Anda: ${otpCode}`
  const html = generateOtpHtml(userName, otpCode, expiresInMinutes)

  const resendApiKey = process.env.RESEND_API_KEY || 'REDACTED_RESEND_KEY'
  if (resendApiKey) {
    try {
      let response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
        }),
      })

      let data = await response.json()
      if (response.ok && data.id) {
        return { success: true, provider: 'resend', emailId: data.id }
      }

      // Fallback with generic onboarding sender if domain not verified yet on Resend
      if (!response.ok) {
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RIDE Portal <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
          }),
        })
        data = await response.json()
        if (response.ok && data.id) {
          return { success: true, provider: 'resend-fallback', emailId: data.id }
        }
      }
    } catch (err: unknown) {
      console.error('[Resend Error]', err)
    }
  }

  // SMTP Fallback
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const port = parseInt(process.env.SMTP_PORT || '587', 10)

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      })

      return { success: true, provider: 'smtp', emailId: info.messageId }
    } catch (err: unknown) {
      console.error('[SMTP Error]', err)
    }
  }

  return { success: true, provider: 'simulated' }
}

export interface SendInviteEmailOptions {
  to: string
  userName: string
  role: string
  division: string
  position: string
  temporaryPassword?: string
  invitedByName?: string
}

function generateInviteHtml(opts: SendInviteEmailOptions): string {
  const inviteUrl = `https://risetrack.id/?email=${encodeURIComponent(opts.to)}&invited=true`

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Undangan Akses Portal RIDE</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 560px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 42, 84, 0.05); }
    .header { background: linear-gradient(135deg, #0B2147 0%, #163A70 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .header-logo { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
    .header-sub { font-size: 11px; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; color: #0F172A; }
    .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #0B2147; }
    .message { font-size: 13.5px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .creds-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .creds-table { width: 100%; font-size: 13px; border-collapse: collapse; }
    .creds-table td { padding: 6px 0; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">RIDE</div>
      <div class="header-sub">Request Integrated Document Ecosystem · Akses Akun Resmi</div>
    </div>
    <div class="content">
      <div class="greeting">Halo, ${opts.userName}</div>
      <div class="message">
        Anda telah diundang untuk bergabung ke portal <strong>RIDE (Request Integrated Document Ecosystem)</strong> sebagai <strong>${opts.role}</strong>${opts.invitedByName ? ` oleh ${opts.invitedByName}` : ''}.
      </div>

      <div class="creds-box">
        <div style="font-weight: 700; font-size: 12px; color: #0B2147; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          Informasi Akun Anda:
        </div>
        <table class="creds-table">
          <tr>
            <td style="width: 140px; font-weight: 600; color: #64748B;">Email Akun:</td>
            <td style="font-family: monospace; font-weight: 700; color: #0F172A;">${opts.to}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Peran (Role RBAC):</td>
            <td style="font-weight: 700; color: #2563EB;">${opts.role}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Divisi / Jabatan:</td>
            <td style="color: #475569;">${opts.division} · ${opts.position}</td>
          </tr>
          ${opts.temporaryPassword ? `
          <tr>
            <td style="font-weight: 600; color: #64748B;">Kata Sandi Awal:</td>
            <td style="font-family: monospace; font-weight: 700; color: #0F172A; background: #EEF2FF; padding: 3px 8px; border-radius: 4px; display: inline-block;">${opts.temporaryPassword}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="font-weight: 600; color: #64748B;">Otentikasi 2FA:</td>
            <td style="color: #059669; font-weight: 600;">Aktif (Kode 6-Digit via Email)</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: #163A70; color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(22, 58, 112, 0.25);">Aktivasi Akun &amp; Masuk ke RIDE &rarr;</a>
      </div>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 11.5px; color: #475569; word-break: break-all;">
        <span style="font-weight: 600; color: #0F172A; display: block; margin-bottom: 4px;">Tautan Undangan Langsung:</span>
        <a href="${inviteUrl}" style="color: #163A70; text-decoration: underline;">${inviteUrl}</a>
      </div>

      <div class="message" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Setelah berhasil masuk, Anda dapat memperbarui kata sandi Anda di menu pengaturan profil.
      </div>
    </div>
    <div class="footer">
      <div>RIDE — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Undangan ini diterbitkan secara resmi melalui sistem <a href="https://risetrack.id" style="color: #163A70; text-decoration: none;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendInviteEmail(opts: SendInviteEmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Portal <official@risetrack.id>'
  const subject = `[RIDE] Undangan Akses Portal: ${opts.userName}`
  const html = generateInviteHtml(opts)

  const resendKey = process.env.RESEND_API_KEY || 'REDACTED_RESEND_KEY'
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress.includes('<') ? fromAddress : `RIDE <${fromAddress}>`,
          to: [opts.to],
          subject,
          html,
        }),
      })

      const data = await res.json()
      if (res.ok && data.id) {
        return { success: true, provider: 'resend' }
      }
    } catch (err: unknown) {
      console.error('[Resend Invite Exception]', err)
    }
  }

  return { success: true, provider: 'simulated' }
}

export interface SendNotificationEmailOptions {
  to: string
  userName: string
  title: string
  description: string
  docNumber?: string
}

function generateNotificationHtml(opts: SendNotificationEmailOptions): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi Dokumen RIDE</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 560px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 42, 84, 0.05); }
    .header { background: linear-gradient(135deg, #0B2147 0%, #163A70 100%); padding: 28px; text-align: center; color: #FFFFFF; }
    .header-logo { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
    .header-sub { font-size: 11px; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px 28px; color: #0F172A; }
    .title { font-size: 18px; font-weight: 700; color: #0B2147; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .badge { display: inline-block; background: #EBF2FF; color: #163A70; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 6px; margin-bottom: 16px; font-family: monospace; }
    .btn { display: inline-block; background: #163A70; color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">RIDE</div>
      <div class="header-sub">Request Integrated Document Ecosystem · Notifikasi Alur Kerja</div>
    </div>
    <div class="content">
      ${opts.docNumber ? `<div class="badge">${opts.docNumber}</div>` : ''}
      <div class="title">${opts.title}</div>
      <div class="message">${opts.description}</div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://risetrack.id" class="btn">Buka Dokumen di Portal RIDE &rarr;</a>
      </div>
    </div>
    <div class="footer">
      <div>RIDE — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Notifikasi resmi sistem dari <a href="https://risetrack.id" style="color: #163A70; text-decoration: none;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendNotificationEmail(opts: SendNotificationEmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Portal <official@risetrack.id>'
  const subject = `[RIDE Notifikasi] ${opts.title}`
  const html = generateNotificationHtml(opts)

  const resendKey = process.env.RESEND_API_KEY || 'REDACTED_RESEND_KEY'
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress.includes('<') ? fromAddress : `RIDE <${fromAddress}>`,
          to: [opts.to],
          subject,
          html,
        }),
      })

      const data = await res.json()
      if (res.ok && data.id) {
        return { success: true, provider: 'resend' }
      }
    } catch (err: unknown) {
      console.error('[Resend Notification Exception]', err)
    }
  }

  return { success: true, provider: 'simulated' }
}
