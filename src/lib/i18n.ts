export type AppLanguage = 'id' | 'en'

/**
 * Exact phrase dictionary (case-insensitive lookup with case-preserving fallback)
 * Covers all UI labels, headings, stages, buttons, statuses, categories, roles,
 * modals, table headers, tooltips, and descriptions across RIDE.
 */
export const EXACT_PHRASE_DICTIONARY: Record<string, string> = {
  // === 7 STAGES OF CONTRACT WORKFLOW ===
  'Pengajuan': 'Submission',
  'Drafting': 'Drafting',
  'Revisi Draft': 'Draft Revision',
  'Revisi draft': 'Draft Revision',
  'Persetujuan Legal': 'Legal Approval',
  'persetujuan legal': 'Legal Approval',
  'Tanda Tangan Direksi': 'Board Signature',
  'tanda tangan direksi': 'Board Signature',
  'Pengarsipan': 'Archiving',
  'Pengingat': 'Reminder',

  // Legacy / alternative stage names
  'Inisiasi Kontrak': 'Contract Initiation',
  'Penyusunan Draf Legal': 'Legal Drafting',
  'Harmonisasi & Review': 'Harmonization & Review',
  'Legal Clearance (Paraf)': 'Legal Clearance (Initials)',
  'Eksekusi Direksi (TTD)': 'Board Execution (Signature)',
  'Registrasi Arsip Resmi': 'Official Archive Registration',
  'Monitoring Masa Berlaku': 'Validity Period Monitoring',

  // Stage descriptions
  'Pengajuan kontrak / dokumen awal beserta lampiran berkas pendukung oleh User.':
    'Initial contract / document submission along with supporting attachments by the User.',
  'Penyusunan draf kontrak oleh Divisi Legal.':
    'Preparation of the contract draft by the Legal Division.',
  'Pengecekan draf kontrak antara User dan pihak terkait serta pengembalian draf revisi ke Legal.':
    'Contract draft review between User and related parties, returning the revised draft to Legal.',
  'Proses paraf & persetujuan oleh Legal Manager.':
    'Initialing & approval process by the Legal Manager.',
  'Penandatanganan kontrak resmi oleh Direksi.':
    'Official contract signing by the Board of Directors.',
  'Penyimpanan kontrak resmi ke dalam arsip perusahaan.':
    'Storing the official contract into the corporate archive.',
  'Notifikasi pengingat jangka waktu & jatuh tempo kontrak.':
    'Contract duration & expiration reminder notifications.',

  // === NAVIGATION & LAYOUT ===
  'Beranda': 'Dashboard',
  'Ajukan Dokumen': 'Submit Document',
  'Ajukan': 'Submit',
  'Lacak Alur': 'Track Workflow',
  'Lacak': 'Track',
  'Dokumen Saya': 'My Documents',
  'Arsip Dokumen': 'Document Archive',
  'Dokumen': 'Documents',
  'Matriks Kewenangan': 'Authority Matrix',
  'Profil Akun': 'Account Profile',
  'Akun': 'Account',
  'Kelola Pengguna': 'Manage Users',
  'Pengaturan': 'Settings',
  'Pengaturan Sistem': 'System Settings',
  'Keluar': 'Sign Out',
  'Keluar dari Akun': 'Sign Out of Account',
  'Keluar dari Akun (Logout)': 'Sign Out of Account (Logout)',
  'Buka / Tutup Navigasi': 'Toggle Navigation',
  'Navigasi Mobile Bawah': 'Bottom Mobile Navigation',
  'Ajukan Dokumen Baru': 'Submit New Document',
  'Cari dokumen atau PIC... (Enter)': 'Search documents or PIC... (Enter)',
  'Cari dokumen atau PIC...': 'Search documents or PIC...',
  'Cari nama, email, jabatan, atau divisi...': 'Search name, email, position, or division...',
  'Notifikasi': 'Notifications',
  'Notifikasi Sistem': 'System Notifications',
  'Tandai dibaca': 'Mark as read',
  'Tandai semua dibaca': 'Mark all as read',
  'Belum ada notifikasi saat ini.': 'No notifications at this time.',
  'Tidak ada notifikasi baru': 'No new notifications',
  'PLATFORM RIDE': 'RIDE PLATFORM',
  'Pengguna': 'User',
  'Pengguna RIDE': 'RIDE User',
  'Karyawan': 'Employee',

  // === LOGIN & AUTHENTICATION ===
  'Masuk ke Portal RIDE': 'Sign In to RIDE Portal',
  'Masuk ke Akun': 'Sign In to Account',
  'Masuk ke Akun Anda': 'Sign In to Your Account',
  'Gunakan email dan kata sandi terdaftar Anda.': 'Use your registered email and password.',
  'Aktivasi Akun Undangan Resmi': 'Official Invitation Account Activation',
  'Akun telah terdaftar. Masukkan kata sandi untuk masuk.': 'Account registered. Enter your password to sign in.',
  'Sistem Manajemen & Pelacakan Dokumen Korporat': 'Corporate Document Management & Tracking System',
  'Email Korporat': 'Corporate Email',
  'Alamat Email': 'Email Address',
  'nama@email.com': 'name@email.com',
  'nama@domain.co.id': 'name@company.com',
  'Kata Sandi': 'Password',
  'Ingat Saya': 'Remember Me',
  'Ingat sesi masuk': 'Remember sign-in session',
  'Ingat perangkat ini': 'Remember this device',
  'Lupa Kata Sandi?': 'Forgot Password?',
  'Lupa kata sandi?': 'Forgot password?',
  'Lupa Sandi?': 'Forgot Password?',
  'Masuk': 'Sign In',
  'Masuk ke Portal': 'Sign In to Portal',
  'Memverifikasi...': 'Verifying...',
  'Memproses...': 'Processing...',
  'Verifikasi 2FA': '2FA Verification',
  'Verifikasi': 'Verify',
  'Verifikasi Dua Langkah (2FA)': 'Two-Factor Verification (2FA)',
  'Verifikasi OTP 2FA': '2FA OTP Verification',
  'Masukkan 6 digit kode OTP yang dikirim ke email Anda.': 'Enter the 6-digit OTP code sent to your email.',
  'Masukkan 6 digit kode OTP yang dikirim ke email': 'Enter the 6-digit OTP code sent to email',
  'Verifikasi & Masuk': 'Verify & Sign In',
  'Kirim Ulang Kode OTP': 'Resend OTP Code',
  'Kirim ulang kode OTP': 'Resend OTP code',
  'Mengirim ulang...': 'Resending...',
  'Reset Kata Sandi': 'Reset Password',
  'Atur Ulang Kata Sandi': 'Reset Password',
  'Kata Sandi Baru': 'New Password',
  'Kata Sandi Baru (min. 6 karakter)': 'New Password (min. 6 characters)',
  'Kata Sandi Lama': 'Current Password',
  'Konfirmasi Kata Sandi': 'Confirm Password',
  'Simpan Kata Sandi': 'Save Password',
  'Simpan Sandi': 'Save Password',
  'Ubah Kata Sandi': 'Change Password',
  'Masukkan kata sandi lama dan baru Anda.': 'Enter your current and new password.',
  'Masukkan email dan kata sandi baru Anda.': 'Enter your email and new password.',
  'Email dan kata sandi wajib diisi.': 'Email and password are required.',
  'Autentikasi gagal. Periksa kembali email dan kata sandi Anda.': 'Authentication failed. Please check your email and password.',

  // === DASHBOARD VIEW ===
  'Selamat Datang,': 'Welcome,',
  'Selamat Pagi': 'Good Morning',
  'Selamat Siang': 'Good Afternoon',
  'Selamat Sore': 'Good Afternoon',
  'Selamat Malam': 'Good Evening',
  'Kelola pengajuan berkas, alur persetujuan, dan jatuh tempo kontrak.':
    'Manage document submissions, approval workflows, and contract expirations.',
  'Bagaimana mood kerja Anda hari ini?': 'How is your work mood today?',
  'Pilih Suasana Hati Anda Hari Ini': 'Choose Your Mood Today',
  'Klik untuk memilih suasana hati Anda hari ini': 'Click to choose your mood today',
  'Pilih Mood Hari Ini': 'Select Today’s Mood',
  'Suasana Hati Hari Ini': 'Today’s Mood',
  'Pilih maskot suasana hati Anda untuk menyapa hari ini!': 'Pick your mood mascot to greet you today!',
  'Mood Hari Ini': 'Today’s Mood',
  'Ganti Mood': 'Change Mood',
  'Semangat': 'Energized',
  'Siap tuntaskan target': 'Ready to crush targets',
  'Siap tuntaskan target hari ini': 'Ready to crush today’s targets',
  'Fokus': 'Focused',
  'Konsentrasi penuh': 'Full concentration',
  'Konsentrasi penuh & teliti': 'Full concentration & precision',
  'Butuh Kopi': 'Need Coffee',
  'Perlu kafein tambahan': 'Need extra caffeine',
  'Perlu asupan kafein hangat': 'Need a warm caffeine boost',
  'Bahagia': 'Happy',
  'Hari menyenangkan': 'Having a great day',
  'Hati gembira & senyum cerah': 'Joyful heart & bright smile',
  'Santai': 'Relaxed',
  'Semua terkendali': 'Everything under control',
  'Tenang, semua terkendali': 'Calm, everything under control',
  'Lelah': 'Tired',
  'Butuh jeda istirahat': 'Need a short break',
  'Butuh jeda & tarik napas': 'Need a pause & deep breath',
  'Sedih': 'Sad',
  'Perlu dukungan & semangat baru': 'Need support & fresh encouragement',
  'Marah': 'Frustrated',
  'Sedang kesal & butuh ruang tenang': 'Feeling upset & need a calm space',
  'Gaspol': 'Full Speed',
  'Kecepatan penuh': 'Maximum velocity',
  'Penuh Ide': 'Inspired',
  'Kreativitas mengalir': 'Creativity flowing',
  'Waktunya Istirahat': 'Need a Break',
  'Jaga kesehatan': 'Take care of your health',
  'Terima Kasih, Lanjut Bekerja!': 'Thank You, Back to Work!',
  'Energi positifmu hari ini luar biasa! Semoga seluruh aktivitas dan pengajuan dokumenmu berjalan lancar penuh senyuman.':
    'Your positive energy today is amazing! May all your activities and document submissions go smoothly with a big smile.',
  'Tidak ada target yang terlalu sulit hari ini! Ayo kita tuntaskan setiap proses kontrak dengan cepat dan presisi.':
    'No target is too tough today! Let’s complete every contract workflow with speed and precision.',
  'Pikiran yang tenang menghasilkan keputusan terbaik. Nikmati ritme kerjamu hari ini dengan nyaman dan teratur.':
    'A calm mind makes the best decisions. Enjoy your work rhythm today comfortably and steadily.',
  'Ketelitianmu adalah kunci! Setiap klausul dan dokumen pasti tuntas dengan rapi dan akurat hari ini.':
    'Your precision is key! Every clause and document will be completed neatly and accurately today.',
  'Kamu sudah bekerja keras! Ambil napas dalam-dalam, minum air putih, dan kerjakan satu per satu dengan tenang.':
    'You have worked hard! Take a deep breath, drink some water, and take things one step at a time.',
  'Tidak apa-apa jika hari ini terasa berat. Kamu tidak sendirian, pelan-pelan saja ya—besok pasti akan lebih cerah!':
    'It is okay if today feels heavy. You are not alone—take it gently, tomorrow will surely be brighter!',
  'Wajar kok kalau ada hal yang bikin kesal. Tenangkan hati sejenak, biar kepalamu kembali adem sebelum lanjut lagi!':
    'It is natural to feel frustrated sometimes. Take a moment to cool down and clear your mind before continuing!',
  'Secangkir kopi hangat siap mengembalikan fokus dan mood kerjamu. Nikmati seruputan pertamamu hari ini!':
    'A warm cup of coffee is ready to restore your focus and work mood. Enjoy your first sip today!',
  'Cerah': 'Clear',
  'Cerah Berawan': 'Partly Cloudy',
  'Berawan': 'Cloudy',
  'Berkabut': 'Foggy',
  'Gerimis': 'Drizzle',
  'Hujan': 'Rainy',
  'Bersalju': 'Snowy',
  'Hujan Deras': 'Heavy Rain',
  'Hujan Petir': 'Thunderstorm',
  'Semua': 'All',
  'Tindakan': 'Action Needed',
  'Berjalan': 'Active',
  'Sah': 'Validated',
  'Total terdaftar': 'Total registered',
  'Perlu perbaikan': 'Needs revision',
  'Sedang berjalan': 'Currently in progress',
  'Sudah sah': 'Validated & final',
  'Total Pengajuan': 'Total Submissions',
  'Total Dokumen': 'Total Documents',
  'Diproses': 'In Progress',
  'Sedang Diproses': 'In Progress',
  'Perlu Revisi': 'Needs Revision',
  'Menunggu Persetujuan': 'Awaiting Approval',
  'Final Sah': 'Validated Final',
  'Dokumen Final': 'Final Documents',
  'Dokumen Sah': 'Validated Document',
  'Selesai / Dokumen Final': 'Completed / Final Document',
  'Ditolak': 'Rejected',
  'Pengajuan Baru': 'New Submission',
  'Pengajuan Baru (V0)': 'New Submission (V0)',
  'Jatuh Tempo Kontrak': 'Contract Expiration',
  'Kontrak yang mendekati batas akhir (≤ 60 hari).': 'Contracts approaching expiration date (≤ 60 days).',
  'Tidak ada dokumen mendekati jatuh tempo saat ini.': 'No documents approaching expiration at this time.',
  'Perpanjang': 'Renew',
  'Adendum': 'Addendum',
  'Terminasi': 'Terminate',
  'Alur Persetujuan Dokumen': 'Document Approval Workflow',
  'Status 7 tahapan alur berkas dari draf hingga final sah.': '7-stage document workflow status from initial draft to validated final.',
  'Riwayat Versi': 'Version History',
  'Tahap Saat Ini': 'Current Stage',
  'Kelengkapan Alur': 'Workflow Completion',
  'Aksi Cepat': 'Quick Actions',
  'Buat Pengajuan Baru': 'Create New Submission',
  'Ringkasan Dokumen Terbaru': 'Recent Documents Summary',
  'Lihat Semua': 'View All',

  // === TRACKING & SUBMISSION VIEW ===
  'Pengajuan Dokumen': 'Document Submission',
  'Pelacakan Dokumen': 'Document Tracking',
  'Formulir registrasi dokumen dan permohonan kajian hukum.': 'Document registration and legal review request form.',
  'Pelacakan alur berkas, kajian klausul hukum, dan persetujuan 7 tahap.': 'Document workflow tracking, legal clause review, and 7-stage approval.',
  'Formulir Pengajuan Kontrak / Dokumen': 'Contract / Document Submission Form',
  'Lengkapi data pengajuan dan lampirkan dokumen pendukung untuk penyusunan kontrak.': 'Complete the submission details and attach supporting documents for contract preparation.',
  'Nama Dokumen': 'Document Title',
  'Contoh: Perjanjian Sewa Alat Berat': 'Example: Heavy Equipment Rental Agreement',
  'Kategori Dokumen': 'Document Category',
  'Kontrak Hukum': 'Legal Contract',
  'NDA (Non-Disclosure Agreement)': 'NDA (Non-Disclosure Agreement)',
  'MoU (Memorandum of Understanding)': 'MoU (Memorandum of Understanding)',
  'Legal Opinion / Analyst': 'Legal Opinion / Analysis',
  'Perizinan': 'Licensing & Permits',
  'Surat Menyurat Resmi': 'Official Correspondence',
  'Surat Menyurat Resmi (Korespondensi)': 'Official Correspondence',
  'Dokumen Lainnya': 'Other Documents',
  'Tingkat Prioritas': 'Priority Level',
  'Tingkat Prioritas (Target SLA)': 'Priority Level (SLA Target)',
  'Standard Corporate SLA (10 Hari Kerja)': 'Standard Corporate SLA (10 Business Days)',
  'Executive Fast-Track SLA (5 Hari Kerja)': 'Executive Fast-Track SLA (5 Business Days)',
  '10 Hari Kerja (Standard Corporate SLA)': '10 Business Days (Standard Corporate SLA)',
  '5 Hari Kerja (Executive Fast-Track SLA)': '5 Business Days (Executive Fast-Track SLA)',
  'Divisi': 'Division',
  'Contoh: Direktorat Operasi': 'Example: Directorate of Operations',
  'Tingkat Kerahasiaan': 'Confidentiality Level',
  'Internal': 'Internal',
  'Rahasia': 'Confidential',
  'Rahasia (Confidential)': 'Confidential',
  'Terbatas': 'Restricted',
  'Terbatas (Restricted)': 'Restricted',
  'Masa Berlaku Kontrak': 'Contract Validity Period',
  'Tanpa Batas Waktu': 'No Expiration Date',
  'Tanggal Mulai': 'Start Date',
  'Tanggal Jatuh Tempo': 'Expiration Date',
  'Tanggal Berakhir': 'End Date',
  'Catatan Pengajuan': 'Submission Notes',
  'Catatan tambahan untuk reviewer...': 'Additional notes for the reviewer...',
  'Lampirkan Dokumen Pendukung Kontrak': 'Attach Contract Supporting Document',
  'PDF, DOCX, XLSX, JPG, PNG (Maks. 20 MB)': 'PDF, DOCX, XLSX, JPG, PNG (Max. 20 MB)',
  'Sedang mengunggah dan memproses berkas...': 'Uploading and processing file...',
  'Mohon tunggu, berkas sedang divalidasi dan disiapkan untuk transmisi ke Google Drive.': 'Please wait, the file is being validated and prepared for Google Drive transmission.',
  'Pilih atau seret berkas ke sini': 'Select or drag file here',
  'Format: PDF, Word, Excel, Gambar (Maks. 20 MB)': 'Format: PDF, Word, Excel, Image (Max. 20 MB)',
  'Pilih Berkas': 'Choose File',
  'Cari Berkas': 'Browse File',
  'Siap Diajukan': 'Ready to Submit',
  'Hapus / Ganti Berkas': 'Remove / Replace File',
  'Kirim Pengajuan': 'Submit Request',
  'Mengirim Pengajuan...': 'Submitting Request...',
  'Mengunggah Berkas...': 'Uploading File...',
  'Mengunggah...': 'Uploading...',
  'Menyimpan...': 'Saving...',
  'Menghapus...': 'Deleting...',
  'Mengirim...': 'Sending...',
  'Belum Ada Pengajuan Dokumen': 'No Document Submissions Yet',
  'Akun Anda belum memiliki riwayat pengajuan dokumen. Klik tombol di bawah untuk membuat draf pengajuan dokumen baru.':
    'Your account has no document submission history yet. Click the button below to create a new document submission.',
  'Daftar Pengajuan': 'Submission List',
  'Folder Drive': 'Drive Folder',
  'Buka di Drive': 'Open in Drive',
  'Buka Google Drive ↗': 'Open Google Drive ↗',
  'Unduh': 'Download',
  'Alur Proses Kontrak': 'Contract Process Workflow',
  'Tahapan Aktif:': 'Active Stage:',
  'Tahapan Hukum Aktif:': 'Active Legal Stage:',

  // Workflow Action Buttons
  'Mulai Drafting': 'Start Drafting',
  'Unggah Draft': 'Upload Draft',
  'Lanjut ke Revisi Draft': 'Proceed to Draft Revision',
  'Unggah Revisi Draft': 'Upload Revised Draft',
  'Lanjut ke Persetujuan Legal': 'Proceed to Legal Approval',
  'Unggah Paraf Legal': 'Upload Legal Initials',
  'Lanjut ke Tanda Tangan Direksi': 'Proceed to Board Signature',
  'Unggah Tanda Tangan Direksi': 'Upload Board Signature',
  'Selesai & Arsipkan': 'Complete & Archive',
  'Verifikasi & Lanjutkan': 'Verify & Continue',
  'Revisi': 'Revision',
  'Minta Revisi': 'Request Revision',
  'Tolak': 'Reject',
  'Tolak Dokumen': 'Reject Document',
  'Unggah Arsip Kontrak Resmi': 'Upload Official Contract Archive',
  'Masa Berlaku & Pengingat': 'Validity Period & Reminders',
  'Jatuh Tempo Hari Ini': 'Due Today',
  'H-1 Jatuh Tempo': 'D-1 Due Tomorrow',
  'Pengingat Email Otomatis:': 'Automated Email Reminders:',
  'Keputusan Kontrak:': 'Contract Decision:',
  'Perpanjang Kontrak': 'Renew Contract',
  'Adendum Klausul': 'Clause Addendum',
  'Terminasi / Akhiri': 'Terminate / End',
  'Ubah Keputusan': 'Change Decision',
  'Dokumen Pengajuan & Riwayat Revisi': 'Submitted Documents & Revision History',
  'Seluruh berkas pengajuan awal, revisi draf, dan dokumen final dalam satu daftar terpadu.':
    'All initial submission files, draft revisions, and final documents in one unified list.',
  'Unggah Revisi': 'Upload Revision',
  'Terbitkan Final': 'Publish Final',
  'Sinkronisasi Drive': 'Sync Drive',
  'Dokumen Awal': 'Initial Document',
  'Dokumen Final Resmi': 'Official Final Document',
  'Draf / Revisi': 'Draft / Revision',
  'Oleh:': 'By:',
  'Riwayat Jejak Audit (Audit Trail)': 'Audit Trail History',
  'Catatan Kronologis Tahapan': 'Chronological Stage Log',

  // Considerations
  'Kinerja vendor memuaskan': 'Satisfactory vendor performance',
  'Kebutuhan operasional berlanjut': 'Ongoing operational need',
  'Efisiensi biaya & ketersediaan anggaran': 'Cost efficiency & budget availability',
  'Kepatuhan & legalitas aman': 'Safe compliance & legality',
  'Perubahan ruang lingkup (SOW)': 'Scope of Work (SOW) changes',
  'Pekerjaan selesai / tidak dilanjutkan': 'Work completed / discontinued',
  'Tersedia vendor alternatif': 'Alternative vendor available',
  'Perlu adendum klausul / nilai / jangka waktu': 'Requires clause / value / duration addendum',

  // Stage Upload Modal
  'Unggah Draf Hukum (Legal Drafting)': 'Upload Legal Draft (Legal Drafting)',
  'Unggah Lembar Legal Clearance (Paraf Legal Manager)': 'Upload Legal Approval Sheet (Legal Manager Initials)',
  'Unggah Naskah Eksekusi Direksi (Board Signed)': 'Upload Board Signed Contract',
  'Unggah Salinan Kontrak Final (Registrasi Arsip Resmi)': 'Upload Final Contract Copy (Official Archive)',
  'Unggah Draf Hasil Harmonisasi & Review': 'Upload Revised Draft',
  'Unggah naskah draf kontrak hasil penyusunan klausul hukum oleh Divisi Legal.':
    'Upload the contract draft prepared by the Legal Division.',
  'Unggah draf kontrak yang telah memperoleh validasi dan paraf persetujuan Legal Manager.':
    'Upload the contract draft validated and initialed by the Legal Manager.',
  'Unggah naskah kontrak yang telah disahkan dan ditandatangani oleh Dewan Direksi.':
    'Upload the contract signed and executed by the Board of Directors.',
  'Unggah salinan kontrak final yang telah dieksekusi lengkap ke dalam repositori arsip resmi perusahaan.':
    'Upload the fully executed final contract copy into the corporate official archive.',
  'Unggah draf kontrak hasil harmonisasi klausul bersama Divisi Pemohon dan Mitra untuk dikembalikan ke Divisi Legal.':
    'Upload the revised contract draft reviewed with the Requester and Counterparty to return to Legal.',
  'Nomor Berkas': 'Document Number',
  'Label / Tag Versi': 'Version Label / Tag',
  'Berkas Dokumen': 'Document File',
  'Sedang memproses berkas dokumen...': 'Processing document file...',
  'Mempersiapkan berkas untuk transmisi': 'Preparing file for transmission',
  'Pilih berkas untuk diunggah': 'Select a file to upload',
  'PDF, DOCX, XLSX (Maks. 20 MB)': 'PDF, DOCX, XLSX (Max. 20 MB)',
  'Catatan / Keterangan Dokumen': 'Document Notes / Remarks',
  'Tuliskan ringkasan kajian hukum, penyesuaian pasal, atau instruksi kerja...':
    'Write a summary of legal review, clause adjustments, or work instructions...',
  'Lanjutkan ke Tahap Berikutnya': 'Advance to Next Stage',
  'Otomatis perbarui status dan ajukan berkas ke proses selanjutnya.':
    'Automatically update status and advance the document to the next stage.',
  'Unggah & Simpan': 'Upload & Save',
  'Batal': 'Cancel',
  'Tutup': 'Close',
  'Simpan': 'Save',
  'Simpan Perubahan': 'Save Changes',
  'Simpan Pengingat': 'Save Reminders',
  'Kirim Justifikasi': 'Submit Justification',
  'Simpan & Terbitkan Revisi': 'Save & Publish Revision',
  'Terbitkan Dokumen Final': 'Publish Final Document',

  // === MY DOCUMENTS VIEW ===
  'Repositori Dokumen': 'Document Repository',
  'Daftar dan status dokumen pengajuan Anda.': 'List and status of your submitted documents.',
  'Daftar seluruh pengajuan kontrak dan dokumen hukum yang dapat Anda akses.':
    'List of all contract submissions and legal documents accessible to you.',
  'Semua Dokumen': 'All Documents',
  'Pengajuan Saya': 'My Submissions',
  'Semua Status': 'All Statuses',
  'No. Pengajuan': 'Submission No.',
  'No. Dokumen': 'Doc. Number',
  'Nama & Kategori': 'Title & Category',
  'Kategori / Divisi': 'Category / Division',
  'Versi Aktif': 'Active Version',
  'Status Alur': 'Workflow Status',
  'Divisi & PIC': 'Division & PIC',
  'Tahapan & Status': 'Stage & Status',
  'Tanggal': 'Date',
  'Aksi': 'Actions',
  'Detail': 'Details',
  'Edit': 'Edit',
  'Hapus': 'Delete',
  'Lihat Detail Dokumen': 'View Document Details',
  'Edit Metadata Dokumen': 'Edit Document Metadata',
  'Perbarui informasi pengajuan dokumen.': 'Update document submission information.',
  'Penanggung Jawab (PIC)': 'Person in Charge (PIC)',
  'Tidak ada dokumen yang sesuai dengan pencarian atau filter.':
    'No documents match your search or filter criteria.',

  // === ACCOUNT PROFILE VIEW ===
  'Kelola informasi identitas, keamanan kata sandi, dan pengaturan 2FA Anda.':
    'Manage your identity details, password security, and 2FA settings.',
  'Aktif': 'Active',
  '✓ Aktif': '✓ Active',
  'Data Diri': 'Personal Info',
  'Keamanan': 'Security',
  'Wewenang': 'Authority',
  'Nama Lengkap': 'Full Name',
  'Jabatan': 'Position / Title',
  'Nomor WhatsApp / Telepon': 'WhatsApp / Phone Number',
  'Simpan Profil': 'Save Profile',
  'Tersimpan!': 'Saved!',
  'Otentikasi Dua Langkah (2FA OTP)': 'Two-Factor Authentication (2FA OTP)',
  'Kirim kode OTP 6 digit ke email Anda setiap kali masuk portal.':
    'Send a 6-digit OTP code to your email every time you sign in.',
  'Notifikasi Email': 'Email Notifications',
  'Terima email saat ada pengajuan, permohonan revisi, atau dokumen final selesai.':
    'Receive emails on new submissions, revision requests, or completed final documents.',
  'Peran Pengguna:': 'User Role:',
  'Wewenang operasional dalam alur dokumen.': 'Operational authority in the document workflow.',
  'Matriks Lengkap': 'Full Matrix',
  'Pembuatan Dokumen:': 'Document Creation:',
  'Dapat mengajukan berkas draf awal (V0).': 'Can submit initial draft documents (V0).',
  'Kajian & Perbaikan:': 'Review & Revision:',
  'Dapat melakukan kajian hukum, memberikan catatan perbaikan, dan memproses persetujuan tahapan.':
    'Can perform legal review, provide revision notes, and process stage approvals.',

  // === USERS MANAGEMENT & AUTHORITY MATRIX ===
  'Manajemen Pengguna': 'User Management',
  'Kelola akun pengguna dan kirim undangan resmi.': 'Manage user accounts and send official invitations.',
  'Kelola akun pengguna, divisi, jabatan, dan penetapan peran (RBAC).':
    'Manage user accounts, divisions, positions, and role assignments (RBAC).',
  'Undang Pengguna': 'Invite User',
  'Undang Pengguna Baru': 'Invite New User',
  'Kirim Undangan': 'Send Invitation',
  'Undangan Berhasil Dibuat': 'Invitation Successfully Created',
  'Email telah dikirim. Anda juga dapat menyalin tautan berikut:':
    'Email has been sent. You can also copy the following link:',
  'Salin Tautan': 'Copy Link',
  'Konfirmasi Hapus Pengguna': 'Confirm Delete User',
  'Akun dan hak akses pengguna ini akan dihapus secara permanen.':
    'This user’s account and access rights will be permanently deleted.',
  'Nama:': 'Name:',
  'Email:': 'Email:',
  'Peran:': 'Role:',
  'Divisi & Jabatan:': 'Division & Position:',
  'Divisi & Jabatan': 'Division & Position',
  'Peran Matriks': 'Matrix Role',
  'Nama': 'Name',
  'Email': 'Email',
  'Ya, Hapus': 'Yes, Delete',
  'Akses Terbatas': 'Restricted Access',
  'Akses Ditolak (403 Unauthorized)': 'Access Denied (403 Unauthorized)',
  'Kembali ke Beranda': 'Back to Dashboard',
  'Kembali ke Dashboard': 'Back to Dashboard',
  'Hak akses dan wewenang operasional 6 peran resmi.': 'Access rights and operational authorities of the 6 official roles.',
  'Aktivitas & Wewenang': 'Activity & Authority',
  'Daftar Peran & Tanggung Jawab': 'Roles & Responsibilities List',
  'Rincian wewenang setiap peran di sistem RIDE.': 'Detailed authority of each role in the RIDE system.',
  'Kewenangan:': 'Authorities:',
  'Daftar Anggota Matriks': 'Matrix Members List',
  'Atur peran atau hapus keanggotaan pengguna.': 'Configure roles or remove user memberships.',
  'Tidak ada pengguna di kategori ini.': 'No users in this category.',

  // Matrix Roles & Actions
  'Peninjau Tamu': 'Guest Reviewer',
  'Tingkat 0 • Tamu': 'Level 0 • Guest',
  'Unit Kerja Pemohon': 'Requesting Business Unit',
  'Tingkat 1 • Pemohon': 'Level 1 • Requester',
  'Analis Hukum & Drafter': 'Legal Analyst & Drafter',
  'Tingkat 2 • Staf Legal': 'Level 2 • Legal Staff',
  'Tata Kelola & Kustodian': 'Governance & Custodian',
  'Tingkat 3 • Manajemen Legal': 'Level 3 • Legal Management',
  'Dewan Direksi & Otorisasi': 'Board of Directors & Authorization',
  'Tingkat 4 • Otorisator': 'Level 4 • Authorizer',
  'Sistem, Keamanan & Akses': 'System, Security & Access',
  'Tingkat 5 • Superuser': 'Level 5 • Superuser',
  '1. Inisiasi & Akses': '1. Initiation & Access',
  '2. Kajian & Analisis Hukum': '2. Legal Review & Analysis',
  '3. Otorisasi & Keputusan': '3. Authorization & Decision',
  '4. Tata Kelola & Sistem': '4. Governance & System',
  'Ajukan Dokumen (V0)': 'Submit Document (V0)',
  'Pendaftaran berkas draf awal oleh unit kerja': 'Initial draft registration by requesting unit',
  'Akses & Unduh Berkas': 'Access & Download Files',
  'Melihat dan mengunduh berkas aktif & lampiran di seluruh tahapan': 'View and download active files & attachments across all stages',
  'Catatan Kajian Hukum': 'Legal Review Notes',
  'Memberikan catatan analisis & kajian hukum resmi': 'Provide official legal analysis & review notes',
  'Permintaan Revisi': 'Revision Request',
  'Mengembalikan berkas untuk perbaikan naskah': 'Return document for draft revision',
  'Unggah Revisi (Rev.01+)': 'Upload Revision (Rev.01+)',
  'Mengunggah draf perbaikan / berkas pembaruan': 'Upload revised draft / updated files',
  'Unggah Kajian Legal (Draf)': 'Upload Legal Draft',
  'Mengunggah hasil kajian hukum & draf perjanjian kerja sama': 'Upload legal review results & contract drafts',
  'Unggah Persetujuan Legal (Clearance)': 'Upload Legal Approval (Clearance)',
  'Mengunggah lembar persetujuan formal legal clearance': 'Upload formal legal clearance approval sheet',
  'Unggah Pengesahan Direksi (Signed)': 'Upload Board Signature (Signed)',
  'Mengunggah berkas pengesahan bertanda tangan Direksi': 'Upload contract signed by Board of Directors',
  'Persetujuan Tahapan': 'Stage Approval',
  'Otorisasi persetujuan kajian hukum atau direksi': 'Authorize legal or board stage approval',
  'Penolakan Dokumen': 'Document Rejection',
  'Menolak pengajuan yang tidak sesuai dengan justifikasi': 'Reject non-compliant submission with justification',
  'Keputusan Jatuh Tempo': 'Expiration Decision',
  'Perpanjangan, adendum, atau terminasi kontrak': 'Contract renewal, addendum, or termination',
  'Rilis Dokumen Final (FINAL)': 'Release Final Document (FINAL)',
  'Mengunggah dan mengunci berkas final resmi sah': 'Upload and lock validated official final document',
  'Undang pengguna dan atur peran sistem': 'Invite users and manage system roles',
  'Hapus Keanggotaan': 'Remove Membership',
  'Mencabut akses akun dari sistem': 'Revoke account access from the system',
  'Kelola data & penyimpanan cloud (Eksklusif Admin)': 'Manage data & cloud storage (Admin Exclusive)',

  // === SETTINGS VIEW ===
  'Konfigurasi notifikasi, integrasi Drive, dan basis data.':
    'Configure notifications, Drive integration, and database settings.',
  'Bahasa Antarmuka (Bilingual)': 'Interface Language (Bilingual)',
  'Pilih bahasa tampilan untuk seluruh menu, formulir, dan alur kerja.':
    'Choose the display language for all menus, forms, and workflows.',
  'Pemberitahuan otomatis ke email pengguna.': 'Automated email notifications to users.',
  'Pengajuan & Permintaan Revisi': 'Submissions & Revision Requests',
  'Kirim email saat ada berkas baru atau permintaan revisi.':
    'Send email when there is a new submission or revision request.',
  'Persetujuan & Dokumen Final': 'Approvals & Final Documents',
  'Kirim email saat dokumen disetujui atau diterbitkan berkas final.':
    'Send email when a document is approved or published as final.',
  'Integrasi Google Drive': 'Google Drive Integration',
  'Penyimpanan berkas dan riwayat dokumen otomatis.':
    'Automated file storage and document history.',
  'Mekanisme Penyimpanan Otomatis:': 'Automated Storage Mechanism:',
  'Folder Per Tiket': 'Folder Per Ticket',
  'Log Riwayat (.txt)': 'History Log (.txt)',
  'Arsip Lengkap': 'Complete Archive',
  'Buka Matriks →': 'Open Matrix →',
  'Kelola peran dan wewenang pengguna sistem sesuai kebijakan perusahaan.':
    'Manage user roles and system authorities according to corporate policy.',
  'Manajemen Basis Data': 'Database Management',
  'Penyimpanan data dan sinkronisasi berkas.': 'Data storage and file synchronization.',
  'Khusus Administrator': 'Administrator Only',
  'Keamanan Akses': 'Access Security',
  'Terkunci Sesuai Matriks': 'Locked per Authority Matrix',
  'Foto, data diri, kata sandi, dan 2FA': 'Photo, personal info, password, and 2FA',
}

// Build case-insensitive lookup map for fast O(1) matching
const LOWER_PHRASE_MAP = new Map<string, string>()
for (const [k, v] of Object.entries(EXACT_PHRASE_DICTIONARY)) {
  LOWER_PHRASE_MAP.set(k.trim().toLowerCase(), v)
}

/**
 * Regex pattern rules for dynamic strings (counts, stages, dates, relative time, etc.)
 */
const DYNAMIC_PATTERNS: Array<{ regex: RegExp; replace: (...args: string[]) => string }> = [
  {
    regex: /^Selamat Datang,\s*(.+)$/i,
    replace: (_, name) => `Welcome, ${name}`,
  },
  {
    regex: /^Daftar dokumen sesuai kewenangan\s*(.+)\.$/i,
    replace: (_, role) => `Document list under ${role} authority.`,
  },
  {
    regex: /^Peran Anda:\s*(.+)$/i,
    replace: (_, role) => `Your Role: ${role}`,
  },
  {
    regex: /^Semua\s*\((\d+)\)$/i,
    replace: (_, n) => `All (${n})`,
  },
  {
    regex: /^Tahap\s+(\d+)\s+dari\s+(\d+)$/i,
    replace: (_, a, b) => `Stage ${a} of ${b}`,
  },
  {
    regex: /^(\d+)\s+Dokumen$/i,
    replace: (_, n) => `${n} ${Number(n) === 1 ? 'Document' : 'Documents'}`,
  },
  {
    regex: /^(\d+)\s+Pengguna$/i,
    replace: (_, n) => `${n} ${Number(n) === 1 ? 'User' : 'Users'}`,
  },
  {
    regex: /^Peran:\s*(.+)$/i,
    replace: (_, role) => `Role: ${role}`,
  },
  {
    regex: /^Versi Aktif:\s*(.+)$/i,
    replace: (_, ver) => `Active Version: ${ver}`,
  },
  {
    regex: /^Lewat\s+(\d+)\s+Hari$/i,
    replace: (_, d) => `${d} Days Overdue`,
  },
  {
    regex: /^Tersisa\s+(\d+)\s+Hari$/i,
    replace: (_, d) => `${d} Days Remaining`,
  },
  {
    regex: /^H-(\d+)\s+Jatuh Tempo$/i,
    replace: (_, d) => `D-${d} Due`,
  },
  {
    regex: /^H-(\d+)\s+\(Mendesak\)$/i,
    replace: (_, d) => `D-${d} (Urgent)`,
  },
  {
    regex: /^H-(\d+)\s+\(Peringatan\)$/i,
    replace: (_, d) => `D-${d} (Warning)`,
  },
  {
    regex: /^H-(\d+)\s+\(Evaluasi\)$/i,
    replace: (_, d) => `D-${d} (Evaluation)`,
  },
  {
    regex: /^H-(\d+)\s+\(Pra-Evaluasi\)$/i,
    replace: (_, d) => `D-${d} (Pre-Evaluation)`,
  },
  {
    regex: /^(\d+)\s+mnt\s+lalu$/i,
    replace: (_, m) => `${m} mins ago`,
  },
  {
    regex: /^(\d+)\s+jam\s+lalu$/i,
    replace: (_, h) => `${h} hrs ago`,
  },
  {
    regex: /^(\d+)\s+hari\s+lalu$/i,
    replace: (_, d) => `${d} days ago`,
  },
  {
    regex: /^(\d+)\s+notifikasi belum dibaca$/i,
    replace: (_, n) => `${n} unread notifications`,
  },
  {
    regex: /^Berakhir:\s*(.+)$/i,
    replace: (_, dt) => `Expires: ${dt}`,
  },
  {
    regex: /^Suasana Hati:\s*(.+)$/i,
    replace: (_, m) => `Current Mood: ${EXACT_PHRASE_DICTIONARY[m.trim()] || m.trim()}`,
  },
  {
    regex: /^Halo,\s*(.+?)!\s*Senangnya melihatmu bahagia!\s*✨$/i,
    replace: (_, n) => `Hello, ${n}! So happy to see you smiling! ✨`,
  },
  {
    regex: /^Gaspol,\s*(.+?)!\s*Semangatmu menyala!\s*🔥$/i,
    replace: (_, n) => `Full speed ahead, ${n}! Your energy is on fire! 🔥`,
  },
  {
    regex: /^Stay cool,\s*(.+?)!\s*Semua terkendali!\s*😎$/i,
    replace: (_, n) => `Stay cool, ${n}! Everything is under control! 😎`,
  },
  {
    regex: /^Mode Fokus Aktif,\s*(.+?)!\s*🎯$/i,
    replace: (_, n) => `Focus Mode Activated, ${n}! 🎯`,
  },
  {
    regex: /^Hai\s+(.+?),\s*jangan lupa istirahat sejenak ya!\s*🌙$/i,
    replace: (_, n) => `Hi ${n}, don’t forget to take a short rest! 🌙`,
  },
  {
    regex: /^Peluk hangat untukmu,\s*(.+?)!\s*💛$/i,
    replace: (_, n) => `A warm hug for you, ${n}! 💛`,
  },
  {
    regex: /^Tarik napas dulu ya,\s*(.+?)!\s*Huft!\s*😤$/i,
    replace: (_, n) => `Take a deep breath first, ${n}! Phew! 😤`,
  },
  {
    regex: /^Waktunya ngopi dulu,\s*(.+?)!\s*☕$/i,
    replace: (_, n) => `Time for a coffee break, ${n}! ☕`,
  },
]

/**
 * Multi-word & single-word replacement table for compound sentences, modals,
 * authority matrix descriptions, audit history logs, and notifications.
 */
const SUBSTRING_REPLACEMENTS: Array<[string, string]> = [
  ['Pengajuan Dokumen Awal (V0)', 'Initial Document Submission (V0)'],
  ['Dokumen berhasil diajukan ke antrean verifikasi.', 'Document successfully submitted to verification queue.'],
  ['Permintaan revisi diajukan:', 'Revision request submitted:'],
  ['Revisi telah diselesaikan:', 'Revision completed:'],
  ['Dokumen ditolak:', 'Document rejected:'],
  ['Maju ke tahap:', 'Advanced to stage:'],
  ['Disetujui oleh', 'Approved by'],
  ['Lanjut ke', 'Proceed to'],
  ['Tanda Tangan Direksi', 'Board Signature'],
  ['Persetujuan Legal', 'Legal Approval'],
  ['Revisi Draft', 'Draft Revision'],
  ['Revisi draft', 'Draft Revision'],
  ['Pengajuan Baru', 'New Submission'],
  ['Sedang Diproses', 'In Progress'],
  ['Perlu Revisi', 'Needs Revision'],
  ['Menunggu Persetujuan', 'Awaiting Approval'],
  ['Dokumen Final', 'Final Document'],
  ['Kontrak Hukum', 'Legal Contract'],
  ['Surat Menyurat Resmi', 'Official Correspondence'],
  ['Dokumen Lainnya', 'Other Documents'],
  ['Perizinan', 'Licensing & Permits'],
  ['Direktorat Operasi & Logistik', 'Directorate of Operations & Logistics'],
  ['Direktorat Keuangan & Risiko', 'Directorate of Finance & Risk'],
  ['Direktorat SDM & Korporat', 'Directorate of HR & Corporate'],
  ['Direktorat Legal & Compliance', 'Directorate of Legal & Compliance'],
  ['Direktorat Umum', 'General Directorate'],
  ['Divisi Legal & Kepatuhan', 'Legal & Compliance Division'],
  ['Hari Kerja', 'Business Days'],
  ['Masa Berlaku:', 'Validity Period:'],
  ['Masa Berlaku', 'Validity Period'],
  ['Jatuh Tempo', 'Expiration Date'],
  ['Kata Sandi', 'Password'],
  ['Pengguna', 'User'],
  ['Pengajuan', 'Submission'],
  ['Pengarsipan', 'Archiving'],
  ['Pengingat', 'Reminder'],
  ['Kerahasiaan:', 'Confidentiality:'],
  ['Divisi:', 'Division:'],
  ['Peran', 'Role'],
  ['Wewenang', 'Authority'],
  ['Matriks Kewenangan', 'Authority Matrix'],
  ['Kelola Pengguna', 'Manage Users'],
  ['Profil Akun', 'Account Profile'],
  ['Pengaturan', 'Settings'],
  ['Beranda', 'Dashboard'],
  ['Lacak Alur', 'Track Workflow'],
  ['Ajukan Dokumen', 'Submit Document'],
  ['Dokumen Saya', 'My Documents'],
  ['Unggah', 'Upload'],
  ['Unduh', 'Download'],
  ['Simpan', 'Save'],
  ['Hapus', 'Delete'],
  ['Batal', 'Cancel'],
  ['Tutup', 'Close'],
  ['Aktif', 'Active'],
  ['Nonaktif', 'Inactive'],
  ['Berhasil', 'Successful'],
  ['Gagal', 'Failed'],
]

export function translateText(raw: string, lang: AppLanguage): string {
  if (lang === 'id' || !raw) return raw

  const trimmed = raw.trim()
  if (!trimmed) return raw

  // Preserve leading/trailing whitespace
  const leadingMatch = raw.match(/^\s*/)
  const trailingMatch = raw.match(/\s*$/)
  const leading = leadingMatch ? leadingMatch[0] : ''
  const trailing = trailingMatch ? trailingMatch[0] : ''

  // 1. Direct exact dictionary lookup
  if (EXACT_PHRASE_DICTIONARY[trimmed]) {
    return `${leading}${EXACT_PHRASE_DICTIONARY[trimmed]}${trailing}`
  }

  const lowerKey = trimmed.toLowerCase()
  if (LOWER_PHRASE_MAP.has(lowerKey)) {
    return `${leading}${LOWER_PHRASE_MAP.get(lowerKey)!}${trailing}`
  }

  // 2. Dynamic regex patterns
  for (const pat of DYNAMIC_PATTERNS) {
    if (pat.regex.test(trimmed)) {
      const replaced = trimmed.replace(pat.regex, (...args) => pat.replace(...args))
      return `${leading}${replaced}${trailing}`
    }
  }

  // 3. Substring replacement for longer sentences / logs / matrix descriptions
  let result = trimmed
  for (const [idPhrase, enPhrase] of SUBSTRING_REPLACEMENTS) {
    if (result.includes(idPhrase)) {
      result = result.split(idPhrase).join(enPhrase)
    }
  }

  return `${leading}${result}${trailing}`
}
