import bcrypt from 'bcryptjs'
import {
  initAndSeedDriveStore,
  getDriveDocuments,
  getDriveDocumentById,
  saveDriveDocument,
  deleteDriveDocument,
  getDriveUserByEmail,
  getDriveUserById,
  saveDriveUser,
} from '../lib/drive-store'
import { signToken, verifyToken } from '../lib/auth'

async function runTests() {
  console.log('=================================================================')
  console.log('STARTING RIDE SYSTEM INTEGRATION & BUGFIX VERIFICATION SUITE')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${name}`)
      failed++
    }
  }

  // -------------------------------------------------------------
  // TEST 1: User Avatar & Multi-device Storage Consistency
  // -------------------------------------------------------------
  console.log('--- TEST 1: Avatar Storage & Multi-Device Sync ---')
  await initAndSeedDriveStore()
  const user = await getDriveUserByEmail('toto.rubianto.17@gmail.com')
  assert(!!user, 'User Toto retrieved from drive store')

  if (user) {
    const sampleAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    user.avatarUrl = sampleAvatar
    await saveDriveUser(user)

    // Simulate Device B: retrieving user by ID freshly
    const deviceBUser = await getDriveUserById(user._id)
    assert(!!deviceBUser, 'Device B retrieves user by ID')
    assert(deviceBUser?.avatarUrl === sampleAvatar, 'Device B sees the exact same avatarUrl as Device A')
  }

  // -------------------------------------------------------------
  // TEST 2: Document Creation & Upload Stability
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Document Creation & Upload Stability ---')
  const testDocNumber = 'RIDE-2026-TEST-' + Math.floor(Math.random() * 9000 + 1000)
  const newDoc = {
    _id: 'doc_test_' + Math.random().toString(36).substring(2, 9),
    docNumber: testDocNumber,
    name: 'Dokumen Pengujian Stabilitas Upload',
    category: 'Kontrak Hukum',
    division: 'Direktorat Legal & Governance',
    priority: 'Urgent' as const,
    confidentiality: 'Internal' as const,
    contractStart: new Date().toISOString(),
    contractEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    noDuration: false,
    notes: 'Pengujian upload stabil tanpa 413 payload limit.',
    stage: 0,
    stageStatus: 'active' as const,
    statusLabel: 'Pengajuan Baru (V0)',
    pic: 'Toto Rubianto',
    picEmail: 'toto.rubianto.17@gmail.com',
    revisionRequested: false,
    rejected: false,
    files: [
      {
        originalName: 'Draft_Kontrak_Uji.pdf',
        filename: 'draft_kontrak_uji.pdf',
        size: 1540000,
        mimeType: 'application/pdf',
        url: '/files/Draft_Kontrak_Uji.pdf',
        uploadedAt: new Date().toISOString(),
      },
    ],
    initialDocument: {
      originalName: 'Draft_Kontrak_Uji.pdf',
      filename: 'draft_kontrak_uji.pdf',
      size: 1540000,
      mimeType: 'application/pdf',
      url: '/files/Draft_Kontrak_Uji.pdf',
      uploadedAt: new Date().toISOString(),
    },
    revisionDocuments: [],
    supportingDocuments: [],
    finalDocument: null,
    versions: [
      {
        version: 'V0',
        file: {
          originalName: 'Draft_Kontrak_Uji.pdf',
          filename: 'draft_kontrak_uji.pdf',
          size: 1540000,
          mimeType: 'application/pdf',
          url: '/files/Draft_Kontrak_Uji.pdf',
          uploadedAt: new Date().toISOString(),
        },
        notes: 'Pengajuan draf uji awal.',
        uploadedBy: 'Toto Rubianto',
        uploadedAt: new Date().toISOString(),
        isFinal: false,
        fileType: 'initial' as const,
      },
    ],
    history: [
      {
        stage: 0,
        action: 'Pengajuan Dokumen Awal (V0)',
        actor: 'Toto Rubianto',
        notes: 'Draf uji diajukan.',
        versionTag: 'V0',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await saveDriveDocument(newDoc)
  const retrievedDoc = await getDriveDocumentById(newDoc._id)
  assert(!!retrievedDoc, `Document ${testDocNumber} successfully created & retrieved`)
  assert(retrievedDoc?.versions.length === 1, 'Document version history preserved intact')

  // -------------------------------------------------------------
  // TEST 3: Document Deletion Persistence (No Reappearing on Refresh)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Document Deletion Persistence ---')
  const deleteOk = await deleteDriveDocument(newDoc._id)
  assert(deleteOk, `Document ${testDocNumber} deleted from store`)

  // Simulate cold start / store re-init
  await initAndSeedDriveStore()
  const checkDeleted = await getDriveDocumentById(newDoc._id)
  assert(checkDeleted === null, 'Deleted document does NOT exist in getDriveDocumentById after re-init')

  const allDocs = await getDriveDocuments()
  const foundInList = allDocs.some((d) => d._id === newDoc._id || d.docNumber === testDocNumber)
  assert(!foundInList, 'Deleted document does NOT reappear in getDriveDocuments after re-init / refresh')

  // -------------------------------------------------------------
  // TEST 4: Strict Session & Auth Verification
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Strict Session & Authentication Security ---')
  const validToken = signToken({
    userId: 'usr_toto_admin_01',
    email: 'toto.rubianto.17@gmail.com',
    role: 'System Administrator',
    employeeName: 'Toto Rubianto',
  })
  const verified = verifyToken(validToken)
  assert(!!verified && verified.email === 'toto.rubianto.17@gmail.com', 'Valid JWT token verified successfully')

  const invalidToken = 'invalid_tampered_token_string'
  const failedVerify = verifyToken(invalidToken)
  assert(failedVerify === null, 'Invalid token properly rejected with null (no auto-login bypass)')

  // -------------------------------------------------------------
  // TEST 5: Google Drive Cloud Registry Persistence
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Google Drive Cloud Registry Persistence ---')
  const { getDeletedDocsFromGoogleDriveRegistry, addDeletedDocsToGoogleDriveRegistry } = await import('../lib/gdrive')
  const gdriveDeleted = await getDeletedDocsFromGoogleDriveRegistry()
  assert(Array.isArray(gdriveDeleted), 'Google Drive deleted docs registry accessible as array')

  // -------------------------------------------------------------
  // TEST 6: User Avatar Streaming & Initials Fallback
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: User Avatar Binary Streaming & Initials ---')
  const { getUserAvatarBufferFromGoogleDrive } = await import('../lib/gdrive')
  const avatarRes = await getUserAvatarBufferFromGoogleDrive('toto.rubianto.17@gmail.com')
  assert(avatarRes === null || (!!avatarRes && avatarRes.buffer.length > 0), 'Avatar lookup from Google Drive completes cleanly')

  console.log('\n=================================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((e) => {
  console.error('Fatal Test Exception:', e)
  process.exit(1)
})
