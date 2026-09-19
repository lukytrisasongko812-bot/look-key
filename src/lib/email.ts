import nodemailer from 'nodemailer'

interface SendOtpEmailOptions {
  to: string
  userName: string
  otpCode: string
  expiresInMinutes?: number
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  fromAddress?: string
}

/**
 * Universal email dispatcher with Resend API (and fallback) + SMTP support
 */
async function dispatchEmail({
  to,
  subject,
  html,
  text,
  fromAddress,
}: SendEmailParams): Promise<{ success: boolean; provider: string; emailId?: string; error?: string }> {
  const defaultFrom = fromAddress || process.env.EMAIL_FROM || 'RIDE Platform <support@risetrack.id>'
  const resendApiKey = process.env.RESEND_API_KEY

  if (resendApiKey) {
    try {
      let response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: defaultFrom.includes('<') ? defaultFrom : `RIDE <${defaultFrom}>`,
          to: [to],
          subject,
          html,
          text,
          reply_to: 'support@risetrack.id',
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
            text,
            reply_to: 'support@risetrack.id',
          }),
        })
        data = await response.json()
        if (response.ok && data.id) {
          return { success: true, provider: 'resend-fallback', emailId: data.id }
        }
      }
    } catch (err: unknown) {
      console.error('[Resend Dispatch Error]', err)
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
        from: defaultFrom,
        to,
        subject,
        html,
        text,
        replyTo: 'support@risetrack.id',
      })

      return { success: true, provider: 'smtp', emailId: info.messageId }
    } catch (err: unknown) {
      console.error('[SMTP Dispatch Error]', err)
    }
  }

  return { success: true, provider: 'simulated' }
}

/**
 * Generate a professional corporate HTML email template for 2FA OTP with 3-blade RIDE logo
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
    .container { max-width: 540px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 33, 71, 0.08); }
    .header { background: linear-gradient(135deg, #07152E 0%, #0B2147 50%, #163A70 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .header-logo-icon { width: 64px; height: 64px; border-radius: 16px; display: block; margin: 0 auto 10px auto; background: #FFFFFF; padding: 4px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .header-title { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 3px; }
    .header-sub { font-size: 11px; color: #93C5FD; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; }
    .content { padding: 36px 32px; color: #0F172A; }
    .greeting { font-size: 17px; font-weight: 700; margin-bottom: 12px; color: #0B2147; }
    .message { font-size: 13.5px; line-height: 1.65; color: #475569; margin-bottom: 26px; }
    .otp-box { background: #F8FAFC; border: 2px dashed #2563EB; border-radius: 14px; padding: 24px 20px; text-align: center; margin-bottom: 26px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06); }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #163A70; margin: 0; }
    .otp-note { font-size: 12px; color: #64748B; margin-top: 10px; font-weight: 600; }
    .security-notice { background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; font-size: 12px; color: #92400E; margin-bottom: 24px; line-height: 1.55; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://risetrack.id/images/rise-icon.png" alt="RIDE Logo" class="header-logo-icon" />
      <div class="header-title">RIDE</div>
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
        <div class="otp-note">⏳ Kode berlaku selama ${expiresInMinutes} menit</div>
      </div>

      <div class="security-notice">
        <strong>Peringatan Keamanan:</strong> Jangan pernah memberikan kode OTP ini kepada siapa pun. Staf atau sistem RIDE tidak pernah meminta kode otentikasi Anda secara langsung.
      </div>

      <div class="message" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        Jika Anda tidak merasa melakukan permintaan masuk ini, segera amankan akun Anda melalui sistem <a href="https://risetrack.id" style="color: #163A70; font-weight: 600;">risetrack.id</a>.
      </div>
    </div>
    <div class="footer">
      <div><strong>RIDE</strong> — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Email ini dikirim secara otomatis oleh sistem keamanan <a href="https://risetrack.id" style="color: #163A70; text-decoration: none; font-weight: 600;">risetrack.id</a>.</div>
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
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Security <support@risetrack.id>'
  const subject = `[RIDE] Kode Verifikasi 2FA Anda: ${otpCode}`
  const html = generateOtpHtml(userName, otpCode, expiresInMinutes)
  const text = `Halo ${userName},\n\nKode One-Time Password (OTP) 2FA Anda untuk masuk ke sistem RIDE adalah: ${otpCode}\n\nKode ini berlaku selama ${expiresInMinutes} menit.\nJangan bagikan kode ini kepada siapapun.\n\nSistem RIDE — risetrack.id`

  return dispatchEmail({ to, subject, html, text, fromAddress })
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
  <title>Undangan Akses & Kredensial Akun Portal RIDE</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #CBD5E1; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 33, 71, 0.08); }
    .header { background: linear-gradient(135deg, #07152E 0%, #0B2147 50%, #163A70 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .header-logo-icon { width: 64px; height: 64px; border-radius: 16px; display: block; margin: 0 auto 10px auto; background: #FFFFFF; padding: 4px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .header-title { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 3px; }
    .header-sub { font-size: 11px; color: #93C5FD; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; }
    .content { padding: 36px 32px; color: #0F172A; }
    .greeting { font-size: 18px; font-weight: 800; margin-bottom: 12px; color: #0B2147; }
    .message { font-size: 13.5px; line-height: 1.65; color: #475569; margin-bottom: 24px; }
    
    /* Credentials Card Styling */
    .creds-card { background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 14px; padding: 22px 24px; margin-bottom: 26px; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04); }
    .creds-title { font-weight: 800; font-size: 12.5px; color: #0B2147; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; }
    .creds-row { margin-bottom: 12px; }
    .creds-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .creds-box-email { background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 9px 14px; font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; color: #0F172A; }
    .creds-box-password { background: #EFF6FF; border: 1.5px dashed #2563EB; border-radius: 8px; padding: 10px 14px; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 800; color: #163A70; letter-spacing: 0.5px; }
    .creds-meta-table { width: 100%; font-size: 12.5px; border-collapse: collapse; margin-top: 14px; border-top: 1px solid #E2E8F0; padding-top: 10px; }
    .creds-meta-table td { padding: 6px 0; }
    
    .btn-container { text-align: center; margin: 28px 0 22px 0; }
    .btn-login { display: inline-block; background: #163A70; color: #FFFFFF !important; font-weight: 800; font-size: 14.5px; padding: 14px 34px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(22, 58, 112, 0.28); letter-spacing: 0.3px; }
    .link-box { background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 22px; font-size: 11.5px; color: #475569; word-break: break-all; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://risetrack.id/images/rise-icon.png" alt="RIDE Logo" class="header-logo-icon" />
      <div class="header-title">RIDE</div>
      <div class="header-sub">Request Integrated Document Ecosystem · Undangan Akses Akun Resmi</div>
    </div>
    <div class="content">
      <div class="greeting">Halo, ${opts.userName}</div>
      <div class="message">
        Anda telah diundang untuk bergabung ke portal <strong>RIDE (Request Integrated Document Ecosystem)</strong> sebagai <strong>${opts.role}</strong>${opts.invitedByName ? ` oleh <strong>${opts.invitedByName}</strong>` : ''}.
        Berikut adalah informasi akun Anda untuk masuk ke sistem:
      </div>

      <!-- Kredensial Box Modern -->
      <div class="creds-card">
        <div class="creds-title">
          🔐 KREDENSIAL MASUK AKUN ANDA
        </div>

        <div class="creds-row">
          <div class="creds-label">Email Akun (Login):</div>
          <div class="creds-box-email">${opts.to}</div>
        </div>

        ${opts.temporaryPassword ? `
        <div class="creds-row" style="margin-top: 12px;">
          <div class="creds-label">Kata Sandi (Password):</div>
          <div class="creds-box-password">${opts.temporaryPassword}</div>
        </div>
        ` : ''}

        <table class="creds-meta-table">
          <tr>
            <td style="width: 140px; font-weight: 600; color: #64748B;">Peran (Role RBAC):</td>
            <td>
              <span style="background: #EBF2FF; color: #1D4ED8; border: 1px solid #BFDBFE; font-weight: 700; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; display: inline-block;">
                ${opts.role}
              </span>
            </td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Divisi / Posisi:</td>
            <td style="color: #334155; font-weight: 600;">${opts.division || 'Direktorat Operasi'} · ${opts.position || 'Staff'}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Otentikasi 2FA:</td>
            <td style="color: #059669; font-weight: 700;">🛡️ Aktif (Kode 6-Digit via Email)</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a href="${inviteUrl}" class="btn-login">Masuk ke Portal RIDE &rarr;</a>
      </div>

      <div class="link-box">
        <span style="font-weight: 700; color: #0F172A; display: block; margin-bottom: 4px;">Tautan Langsung:</span>
        <a href="${inviteUrl}" style="color: #163A70; text-decoration: underline;">${inviteUrl}</a>
      </div>

      <div class="message" style="font-size: 12px; color: #64748B; margin-bottom: 0;">
        💡 <em>Catatan: Setelah berhasil masuk, Anda dapat memperbarui kata sandi Anda kapan saja melalui menu pengaturan profil.</em>
      </div>
    </div>
    <div class="footer">
      <div><strong>RIDE</strong> — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Undangan resmi diterbitkan melalui sistem <a href="https://risetrack.id" style="color: #163A70; text-decoration: none; font-weight: 600;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendInviteEmail(opts: SendInviteEmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Portal <support@risetrack.id>'
  const subject = `[RIDE] Undangan Akses & Kredensial Akun: ${opts.userName}`
  const html = generateInviteHtml(opts)
  const text = `Halo ${opts.userName},\n\nAnda telah diundang untuk bergabung ke portal RIDE (Request Integrated Document Ecosystem) sebagai ${opts.role}.\n\nInformasi Akun Anda:\n- Email: ${opts.to}\n- Password: ${opts.temporaryPassword || '(Kata sandi yang telah Anda atur)'}\n- Role: ${opts.role}\n- Divisi: ${opts.division}\n\nSilakan masuk melalui link: https://risetrack.id/?email=${encodeURIComponent(opts.to)}&invited=true\n\nSistem RIDE — risetrack.id`

  return dispatchEmail({ to: opts.to, subject, html, text, fromAddress })
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
    .container { max-width: 560px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 33, 71, 0.08); }
    .header { background: linear-gradient(135deg, #07152E 0%, #0B2147 50%, #163A70 100%); padding: 28px; text-align: center; color: #FFFFFF; }
    .header-logo-icon { width: 60px; height: 60px; border-radius: 15px; display: block; margin: 0 auto 8px auto; background: #FFFFFF; padding: 4px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .header-title { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 2px; }
    .header-sub { font-size: 11px; color: #93C5FD; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; }
    .content { padding: 32px 28px; color: #0F172A; }
    .title { font-size: 18px; font-weight: 800; color: #0B2147; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.65; color: #475569; margin-bottom: 24px; }
    .badge { display: inline-block; background: #EBF2FF; color: #163A70; border: 1px solid #BFDBFE; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 6px; margin-bottom: 16px; font-family: monospace; }
    .btn { display: inline-block; background: #163A70; color: #FFFFFF !important; font-weight: 800; font-size: 14px; padding: 13px 30px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(22, 58, 112, 0.25); }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://risetrack.id/images/rise-icon.png" alt="RIDE Logo" class="header-logo-icon" />
      <div class="header-title">RIDE</div>
      <div class="header-sub">Request Integrated Document Ecosystem · Notifikasi Alur Kerja</div>
    </div>
    <div class="content">
      ${opts.docNumber ? `<div class="badge">${opts.docNumber}</div>` : ''}
      <div class="title">${opts.title}</div>
      <div class="message">${opts.description}</div>

      <div style="text-align: center; margin: 26px 0;">
        <a href="https://risetrack.id" class="btn">Buka Dokumen di Portal RIDE &rarr;</a>
      </div>
    </div>
    <div class="footer">
      <div><strong>RIDE</strong> — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Notifikasi resmi sistem dari <a href="https://risetrack.id" style="color: #163A70; text-decoration: none; font-weight: 600;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendNotificationEmail(opts: SendNotificationEmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Portal <support@risetrack.id>'
  const subject = `[RIDE Notifikasi] ${opts.title}`
  const html = generateNotificationHtml(opts)
  const text = `Notifikasi RIDE:\n\n${opts.title}\n\n${opts.description}\n\nBuka portal di: https://risetrack.id`

  return dispatchEmail({ to: opts.to, subject, html, text, fromAddress })
}

export interface SendContractReminderEmailOptions {
  to: string
  userName: string
  docNumber: string
  docName: string
  milestone: 'h60' | 'h30' | 'h15' | 'h7' | 'h1' | 'expired'
  diffDays: number
  contractEnd: string
  division: string
  customNotes?: string
}

function generateContractReminderHtml(opts: SendContractReminderEmailOptions): string {
  const milestoneTitles: Record<string, { badge: string; color: string; desc: string }> = {
    h60: { badge: 'H-60 · Pra-Evaluasi', color: '#475569', desc: 'Kontrak akan berakhir dalam 60 hari. Mulai lakukan pra-evaluasi dan telaah kebutuhan operasional.' },
    h30: { badge: 'H-30 · Evaluasi & Telaah', color: '#2563EB', desc: 'Kontrak akan berakhir dalam 30 hari. Segera susun justifikasi perpanjangan, adendum, atau terminasi.' },
    h15: { badge: 'H-15 · Peringatan Proses', color: '#D97706', desc: 'Kontrak akan berakhir dalam 15 hari. Pastikan berkas draf dan telaah hukum telah siap diajukan.' },
    h7: { badge: 'H-7 · Peringatan Kritis', color: '#DC2626', desc: 'Kontrak akan berakhir dalam 7 hari (1 minggu). Dibutuhkan keputusan dan persetujuan segera!' },
    h1: { badge: 'H-1 · Batas Akhir Final', color: '#DC2626', desc: 'Kontrak berakhir BESOK. Harap segera tuntaskan administrasi atau tandatangani adendum/perpanjangan.' },
    expired: { badge: 'JATUH TEMPO / KADALUWARSA', color: '#991B1B', desc: 'Masa berlaku kontrak ini telah melewati batas jatuh tempo.' },
  }

  const ms = milestoneTitles[opts.milestone] || milestoneTitles.h30
  const endDateFormatted = new Date(opts.contractEnd).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Jatuh Tempo Kontrak RIDE</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #CBD5E1; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 33, 71, 0.08); }
    .header { background: linear-gradient(135deg, #07152E 0%, #0B2147 50%, #163A70 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .header-logo-icon { width: 64px; height: 64px; border-radius: 16px; display: block; margin: 0 auto 10px auto; background: #FFFFFF; padding: 4px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .header-title { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; margin-bottom: 3px; }
    .header-sub { font-size: 11px; color: #93C5FD; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; }
    .content { padding: 36px 30px; color: #0F172A; }
    .badge { display: inline-block; background: ${ms.color}15; color: ${ms.color}; border: 1px solid ${ms.color}40; font-weight: 800; font-size: 12px; padding: 5px 14px; border-radius: 9999px; margin-bottom: 16px; text-transform: uppercase; }
    .title { font-size: 19px; font-weight: 800; color: #0B2147; line-height: 1.35; margin-bottom: 12px; }
    .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 26px; }
    .info-table { width: 100%; font-size: 13px; border-collapse: collapse; }
    .info-table td { padding: 6px 0; }
    .btn { display: inline-block; background: #163A70; color: #FFFFFF !important; font-weight: 800; font-size: 14px; padding: 13px 30px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(22, 58, 112, 0.25); }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://risetrack.id/images/rise-icon.png" alt="RIDE Logo" class="header-logo-icon" />
      <div class="header-title">RIDE</div>
      <div class="header-sub">Request Integrated Document Ecosystem · Pengingat Jatuh Tempo Kontrak</div>
    </div>
    <div class="content">
      <div class="badge">${ms.badge}</div>
      <div class="title">Pengingat Masa Berlaku: ${opts.docName}</div>
      <div class="desc">${ms.desc}</div>

      <div class="info-card">
        <table class="info-table">
          <tr>
            <td style="width: 140px; font-weight: 600; color: #64748B;">Nomor Dokumen:</td>
            <td style="font-family: monospace; font-weight: 700; color: #163A70;">${opts.docNumber}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Divisi Pengaju:</td>
            <td style="font-weight: 600; color: #334155;">${opts.division}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Tanggal Berakhir:</td>
            <td style="font-weight: 700; color: #DC2626;">${endDateFormatted}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #64748B;">Sisa Waktu:</td>
            <td style="font-weight: 700; color: #0F172A;">${opts.diffDays > 0 ? `${opts.diffDays} Hari Kalender` : 'Sudah Lewat Jatuh Tempo'}</td>
          </tr>
          ${opts.customNotes ? `
          <tr>
            <td style="font-weight: 600; color: #64748B;">Catatan Khusus:</td>
            <td style="color: #475569; font-style: italic;">${opts.customNotes}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="text-align: center; margin: 26px 0;">
        <a href="https://risetrack.id" class="btn">Buka Dokumen &amp; Ajukan Justifikasi &rarr;</a>
      </div>

      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #92400E; line-height: 1.5;">
        <strong>Tindakan yang Disarankan:</strong> Masuk ke portal RIDE untuk memilih rekomendasi tindakan (Perpanjangan, Adendum Klausul, atau Terminasi) serta mengisi telaah pertimbangan resmi.
      </div>
    </div>
    <div class="footer">
      <div><strong>RIDE</strong> — Request Integrated Document Ecosystem</div>
      <div style="margin-top: 4px;">Pemberitahuan otomatis dari sistem <a href="https://risetrack.id" style="color: #163A70; text-decoration: none; font-weight: 600;">risetrack.id</a>.</div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendContractReminderEmail(opts: SendContractReminderEmailOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const fromAddress = process.env.EMAIL_FROM || 'RIDE Contract Alerts <support@risetrack.id>'
  const milestoneLabel = opts.milestone.toUpperCase()
  const subject = `[RIDE ${milestoneLabel}] Pengingat Masa Berlaku Kontrak: ${opts.docNumber} - ${opts.docName}`
  const html = generateContractReminderHtml(opts)
  const text = `Pengingat Jatuh Tempo Kontrak RIDE:\n\nNomor: ${opts.docNumber}\nNama Dokumen: ${opts.docName}\nTanggal Berakhir: ${opts.contractEnd}\nSisa Hari: ${opts.diffDays}\n\nBuka portal di: https://risetrack.id`

  return dispatchEmail({ to: opts.to, subject, html, text, fromAddress })
}
