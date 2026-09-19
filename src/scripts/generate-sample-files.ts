import fs from 'fs'
import path from 'path'

function createMinimalPdf(title: string, subtitle: string, docNo: string): Buffer {
  const content = `BT
/F1 18 Tf
50 720 Td
(RIDE PLATFORM - ARSIP RESMI DOKUMEN) Tj
/F1 14 Tf
0 -30 Td
(${title.replace(/[()\\]/g, '')}) Tj
/F1 11 Tf
0 -25 Td
(Nomor Tiket: ${docNo}) Tj
0 -20 Td
(Keterangan : ${subtitle.replace(/[()\\]/g, '')}) Tj
0 -20 Td
(Status     : Terverifikasi oleh Sistem RIDE) Tj
0 -20 Td
(Penerbit   : PT Vale Indonesia Tbk - Legal & Compliance) Tj
0 -30 Td
(Dokumen ini adalah berkas digital resmi yang terdaftar dan terverifikasi di portal RIDE.) Tj
ET`

  const streamLength = Buffer.byteLength(content)

  const pdfParts = [
    '%PDF-1.4\n',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj\n`,
  ]

  let offset = 0
  const offsets: number[] = []
  let fullPdf = ''

  for (const part of pdfParts) {
    offsets.push(offset)
    offset += Buffer.byteLength(part)
    fullPdf += part
  }

  const startXref = offset
  let xref = `xref\n0 6\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i++) {
    xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n'
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`

  return Buffer.from(fullPdf + xref + trailer)
}

function createMinimalDocx(title: string, docNo: string): Buffer {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>RIDE PLATFORM — ARSIP RESMI DOKUMEN</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${title}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Nomor Registrasi: ${docNo}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Diterbitkan secara sah oleh Direktorat Legal &amp; Compliance melalui sistem RIDE Platform.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`

  const files = [
    { name: '[Content_Types].xml', content: Buffer.from(contentTypesXml) },
    { name: '_rels/.rels', content: Buffer.from(relsXml) },
    { name: 'word/document.xml', content: Buffer.from(documentXml) },
    { name: 'word/_rels/document.xml.rels', content: Buffer.from(wordRelsXml) },
  ]

  const localHeaders: Buffer[] = []
  const centralDirs: Buffer[] = []
  let offset = 0

  for (const f of files) {
    const nameBuf = Buffer.from(f.name)
    const crc = crc32(f.content)
    const size = f.content.length

    const lh = Buffer.alloc(30 + nameBuf.length)
    lh.writeUInt32LE(0x04034b50, 0)
    lh.writeUInt16LE(20, 4)
    lh.writeUInt16LE(0, 6)
    lh.writeUInt16LE(0, 8)
    lh.writeUInt16LE(0, 10)
    lh.writeUInt16LE(0, 12)
    lh.writeUInt32LE(crc, 14)
    lh.writeUInt32LE(size, 18)
    lh.writeUInt32LE(size, 22)
    lh.writeUInt16LE(nameBuf.length, 26)
    lh.writeUInt16LE(0, 28)
    nameBuf.copy(lh, 30)

    localHeaders.push(lh, f.content)

    const cd = Buffer.alloc(46 + nameBuf.length)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(20, 4)
    cd.writeUInt16LE(20, 6)
    cd.writeUInt16LE(0, 8)
    cd.writeUInt16LE(0, 10)
    cd.writeUInt16LE(0, 12)
    cd.writeUInt16LE(0, 14)
    cd.writeUInt32LE(crc, 16)
    cd.writeUInt32LE(size, 20)
    cd.writeUInt32LE(size, 24)
    cd.writeUInt16LE(nameBuf.length, 28)
    cd.writeUInt16LE(0, 30)
    cd.writeUInt16LE(0, 32)
    cd.writeUInt16LE(0, 34)
    cd.writeUInt16LE(0, 36)
    cd.writeUInt32LE(0, 38)
    cd.writeUInt32LE(offset, 42)
    nameBuf.copy(cd, 46)

    centralDirs.push(cd)
    offset += lh.length + size
  }

  const cdOffset = offset
  let cdSize = 0
  for (const cd of centralDirs) cdSize += cd.length

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cdSize, 12)
  eocd.writeUInt32LE(cdOffset, 16)
  eocd.writeUInt16LE(0, 20)

  return Buffer.concat([...localHeaders, ...centralDirs, eocd])
}

function crc32(buf: Buffer): number {
  let crc = ~0
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (~crc) >>> 0
}

const targetDir = path.join(process.cwd(), 'public', 'files')
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const sampleFiles = [
  { name: 'File 4 Peralatan.docx', type: 'docx', title: 'Perjanjian Pengadaan Peralatan Berat', docNo: 'RIDE-2026-0145' },
  { name: 'DRAFT PERJANJIAN KERJA YYBA DAN PT Lainnya.docx', type: 'docx', title: 'Draf Perjanjian Kerja Bersama YYBA & Mitra', docNo: 'RIDE-2026-0146' },
  { name: 'NDA_Smelter_Pomalaa_Signed_Final.pdf', type: 'pdf', title: 'Non-Disclosure Agreement (NDA) Smelter Pomalaa', docNo: 'RIDE-2026-0147' },
  { name: 'Draf_Awal_NDA_Pomalaa_V0.pdf', type: 'pdf', title: 'Draf Awal NDA Pomalaa (V0)', docNo: 'RIDE-2026-0147' },
  { name: 'Draft_Perjanjian_Sewa_Alat_Pomalaa_V0.pdf', type: 'pdf', title: 'Draf Perjanjian Sewa Alat Pomalaa (V0)', docNo: 'RIDE-2026-0148' },
  { name: 'Revisi_Pasal_Denda_K3_Rev01.pdf', type: 'pdf', title: 'Revisi Klausul K3 & Denda Operasional (Rev.01)', docNo: 'RIDE-2026-0148' },
  { name: 'Spesifikasi_Teknis_Excavator_30Ton.pdf', type: 'pdf', title: 'Lampiran Spesifikasi Teknis Excavator 30 Ton', docNo: 'RIDE-2026-0148' },
  { name: 'IUPK_Pemurnian_Final_Sah.pdf', type: 'pdf', title: 'Izin Usaha Pertambangan Khusus (IUPK) Pemurnian', docNo: 'RIDE-2026-0149' },
  { name: 'Draf_Pengajuan_IUPK_V0.pdf', type: 'pdf', title: 'Draf Pengajuan Perizinan IUPK (V0)', docNo: 'RIDE-2026-0149' },
  { name: 'Draf_Pengadaan_Ban_HDT_V0.pdf', type: 'pdf', title: 'Pengadaan Ban Heavy Duty Truck Komatsu 785', docNo: 'RIDE-2026-0150' },
  { name: 'Draf_PPA_Smelter_150MW_Rev02.pdf', type: 'pdf', title: 'Power Purchase Agreement (PPA) Smelter 150MW (Rev.02)', docNo: 'RIDE-2026-0151' },
  { name: 'Draf_Awal_PPA_150MW_V0.pdf', type: 'pdf', title: 'Draf Awal PPA Smelter 150MW (V0)', docNo: 'RIDE-2026-0151' },
  { name: 'Draf_PPA_Penyesuaian_Tarif_Rev01.pdf', type: 'pdf', title: 'Draf PPA Penyesuaian Tarif Daya Listrik (Rev.01)', docNo: 'RIDE-2026-0151' },
]

for (const item of sampleFiles) {
  const filePath = path.join(targetDir, item.name)
  let buf: Buffer
  if (item.type === 'docx') {
    buf = createMinimalDocx(item.title, item.docNo)
  } else {
    buf = createMinimalPdf(item.title, item.title, item.docNo)
  }
  fs.writeFileSync(filePath, buf)
  console.log(`Created: ${item.name} (${buf.length} bytes)`)
}

console.log('All sample files created successfully!')
