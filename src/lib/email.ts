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
  <title>Kode Verifikasi 2FA RISE</title>
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
      <div class="header-logo">RISE</div>
      <div class="header-sub">MIND ID Shared Service Center · Two-Factor Authentication</div>
    </div>
    <div class="content">
      <div class="greeting">Halo, ${userName}</div>
      <div class="message">
        Kami menerima permintaan masuk ke akun Anda pada sistem <strong>RISE (Resources Integrated System for Efficiency)</strong>.
        Gunakan kode One-Time Password (OTP) berikut untuk menyelesaikan proses otentikasi:
      </div>

      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
        <div class="otp-note">Berlaku selama ${expiresInMinutes} menit</div>
      </div>

      <div class="security-notice">
        <strong>Peringatan Keamanan:</strong> Jangan pernah memberikan kode OTP ini kepada siapa pun, termasuk staf IT atau administrator. Sistem RISE tidak pernah meminta kode otentikasi Anda secara langsung.
      </div>

      <div class="message" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Jika Anda tidak merasa melakukan permintaan masuk ini, segera amankan akun Anda atau hubungi tim IT Security MIND ID.
      </div>
    </div>
    <div class="footer">
      <div>PT Mineral Industri Indonesia (Persero) · Legal & Corporate Governance</div>
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
  const fromAddress = process.env.EMAIL_FROM || 'RISE Security <official@risetrack.id>'
  const subject = `[RISE] Kode Verifikasi 2FA Anda: ${otpCode}`
  const html = generateOtpHtml(userName, otpCode, expiresInMinutes)

  // 1. Resend API Strategy (Recommended & fastest on Vercel)
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
      // If custom domain is pending verification in Resend, gracefully fallback
      if (!response.ok && (data.message?.includes('not verified') || data.statusCode === 403)) {
        console.warn(`[Resend Notice] ${fromAddress} pending domain verification. Delivering via verified fallback...`)
        response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RISE Security <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
          }),
        })
        data = await response.json()
      }

      if (!response.ok) {
        console.error('[Resend Error]', data)
        return { success: false, provider: 'resend', error: data.message || 'Resend API failed' }
      }

      console.log(`[Email Sent via Resend] To: ${to}, ID: ${data.id}`)
      return { success: true, provider: 'resend', emailId: data.id }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Resend error'
      console.error('[Resend Exception]', msg)
      return { success: false, provider: 'resend', error: msg }
    }
  }

  // 2. Custom SMTP Strategy (e.g. Domainesia, cPanel, Google Workspace)
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpPort = Number(process.env.SMTP_PORT) || 587

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      })

      console.log(`[Email Sent via SMTP] To: ${to}, MessageId: ${info.messageId}`)
      return { success: true, provider: 'smtp' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown SMTP error'
      console.error('[SMTP Exception]', msg)
      return { success: false, provider: 'smtp', error: msg }
    }
  }

  // 3. Simulated / Development fallback when credentials not yet set
  console.log(`[EMAIL DISPATCH SIMULATED - Configure RESEND_API_KEY or SMTP_* to send live]`)
  console.log(`From: ${fromAddress}`)
  console.log(`To: ${to}`)
  console.log(`OTP Code: ${otpCode}`)

  return {
    success: true,
    provider: 'simulated',
  }
}

export interface SendInviteEmailOptions {
  to: string
  userName: string
  invitedByName: string
  role: string
  temporaryPassword?: string
}

function generateInviteHtml(opts: SendInviteEmailOptions): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Undangan Bergabung ke Sistem RISE</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 560px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 42, 84, 0.05); }
    .header { background: linear-gradient(135deg, #0B2147 0%, #163A70 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .header-logo { font-size: 28px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px; }
    .header-sub { font-size: 11.5px; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; color: #0F172A; }
    .greeting { font-size: 17px; font-weight: 700; margin-bottom: 12px; color: #0F172A; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card-info { background: #F1F5F9; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px; color: #334155; }
    .btn { display: inline-block; background: #163A70; color: #FFFFFF !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 8px; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">RISE</div>
      <div class="header-sub">MIND ID Shared Service Center · Akses Portal Legal &amp; Tata Kelola</div>
    </div>
    <div class="content">
      <div class="greeting">Yth. ${opts.userName},</div>
      <div class="message">
        Anda telah diundang oleh <strong>${opts.invitedByName}</strong> untuk bergabung ke dalam platform <strong>RISE (Resources Integrated System for Efficiency)</strong> sebagai <strong>${opts.role}</strong>.
      </div>

      <div class="card-info">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 600; width: 140px; color: #64748B; padding: 6px 0;">Portal Akses:</td>
            <td style="padding: 6px 0;"><a href="https://risetrack.id" style="color: #163A70; font-weight: bold; text-decoration: none;">https://risetrack.id</a></td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B; padding: 6px 0;">Email Masuk:</td>
            <td style="font-family: monospace; font-weight: 700; padding: 6px 0;">${opts.to}</td>
          </tr>
          ${opts.temporaryPassword ? `
          <tr>
            <td style="font-weight: 600; color: #64748B; padding: 6px 0;">Kata Sandi:</td>
            <td style="font-family: monospace; font-weight: 700; color: #0F172A; padding: 6px 0;">${opts.temporaryPassword}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="font-weight: 600; color: #64748B; padding: 6px 0;">Otentikasi 2FA:</td>
            <td style="color: #059669; font-weight: 600; padding: 6px 0;">Aktif (Kode 6-Digit via Email)</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://risetrack.id" class="btn">Masuk ke Portal RISE &rarr;</a>
      </div>

      <div class="message" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Setelah berhasil masuk, Anda dapat memperbarui kata sandi Anda di menu pengaturan profil.
      </div>
    </div>
    <div class="footer">
      <div>PT Mineral Industri Indonesia (Persero) · Legal &amp; Corporate Governance</div>
      <div style="margin-top: 4px;">Undangan ini diterbitkan secara resmi melalui sistem <a href="https://risetrack.id" style="color: #163A70; text-decoration: none;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendInviteEmail(opts: SendInviteEmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RISE Portal <official@risetrack.id>'
  const subject = `[RISE] Undangan Akses Portal Korporat: ${opts.userName}`
  const html = generateInviteHtml(opts)

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress.includes('<') ? fromAddress : `RISE <${fromAddress}>`,
          to: [opts.to],
          subject,
          html,
        }),
      })

      const data = await res.json()
      if (res.ok && data.id) {
        console.log(`[Invite Email Sent via Resend] To: ${opts.to}, Id: ${data.id}`)
        return { success: true, provider: 'resend' }
      }
    } catch (err: unknown) {
      console.error('[Resend Invite Exception]', err)
    }
  }

  return { success: true, provider: 'simulated' }
}
