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
  // TEST 1: Cross-Device User Profile, Avatar, Cover Photo & Mood Sync
  // -------------------------------------------------------------
  console.log('--- TEST 1: Cross-Device Profile, Avatar, Cover Photo & Mood Sync ---')
  await initAndSeedDriveStore()
  const user = await getDriveUserByEmail('toto.rubianto.17@gmail.com')
  assert(!!user, 'User Toto retrieved from drive store')

  if (user) {
    const origName = user.employeeName
    const origDivision = user.division
    const origPosition = user.position
    const origPhone = user.phone

    const sampleAvatar =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const sampleCover =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk+M9QzwAEjDAGACCMAv89263LAAAAAElFTkSuQmCC'

    user.employeeName = 'Toto Rubianto, S.H., M.H.'
    user.division = 'Corporate Legal'
    user.position = 'Head of Enterprise Legal & Governance'
    user.phone = '+62 812-3456-7899'
    user.avatarUrl = sampleAvatar
    user.coverUrl = sampleCover
    user.mood = 'semangat'

    await saveDriveUser(user)

    // Simulate Device B: retrieving user by ID and by Email freshly
    const deviceBById = await getDriveUserById(user._id)
    const deviceBByEmail = await getDriveUserByEmail('toto.rubianto.17@gmail.com')

    assert(!!deviceBById, 'Device B retrieves user by ID')
    assert(!!deviceBByEmail, 'Device B retrieves user by Email')
    assert(
      deviceBById?.employeeName === 'Toto Rubianto, S.H., M.H.' &&
        deviceBByEmail?.employeeName === 'Toto Rubianto, S.H., M.H.',
      'Device B sees updated employeeName across ID and Email lookups'
    )
    assert(
      deviceBById?.division === 'Corporate Legal' && deviceBById?.mood === 'semangat',
      'Device B sees updated division and mood across devices'
    )
    assert(
      Boolean(deviceBById?.avatarUrl) && !deviceBById!.avatarUrl!.includes('drive.google.com/file/d/'),
      'Device B avatarUrl is a valid streamable endpoint or data URL (never a broken Drive HTML viewer link)'
    )
    assert(
      Boolean(deviceBById?.coverUrl) && !deviceBById!.coverUrl!.includes('drive.google.com/file/d/'),
      'Device B coverUrl is a valid streamable endpoint or data URL (never a broken Drive HTML viewer link)'
    )

    // Restore original name/division/phone after test
    user.employeeName = origName
    user.division = origDivision
    user.position = origPosition
    user.phone = origPhone
    await saveDriveUser(user)
  }

  // -------------------------------------------------------------
  // TEST 2: Document Creation, 7-Stage Workflow, Revision & Final Archiving
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Document Creation, 7-Stage Workflow, Revision & Final Archiving ---')
  const testDocNumber = 'RIDE-2026-TEST-' + Math.floor(Math.random() * 9000 + 1000)
  const newDoc = {
    _id: 'doc_test_' + Math.random().toString(36).substring(2, 9),
    docNumber: testDocNumber,
    name: 'Dokumen Pengujian End-to-End 7 Tahap',
    category: 'Kontrak Hukum',
    division: 'Corporate Legal',
    priority: 'Urgent' as const,
    confidentiality: 'Internal' as const,
    contractStart: new Date().toISOString(),
    contractEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    noDuration: false,
    notes: 'Pengujian siklus hidup penuh 7 tahapan alur kontrak.',
    stage: 0,
    stageStatus: 'active' as const,
    statusLabel: 'Pengajuan',
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
    revisionDocuments: [] as any[],
    supportingDocuments: [] as any[],
    finalDocument: null as any,
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
  let retrievedDoc = await getDriveDocumentById(newDoc._id)
  assert(!!retrievedDoc, `Document ${testDocNumber} created at Stage 0 (Pengajuan)`)
  assert(retrievedDoc?.versions.length === 1, 'Initial version V0 recorded')

  // Simulate Stage 1 (Drafting) & Stage 2 (Revisi Draft) + Revision upload
  newDoc.stage = 2
  newDoc.statusLabel = 'Revisi Draft'
  const revVersion = {
    version: 'Rev.01',
    file: {
      originalName: 'Draft_Kontrak_Uji_Rev01.pdf',
      filename: 'draft_kontrak_uji_rev01.pdf',
      size: 1620000,
      mimeType: 'application/pdf',
      url: '/files/Draft_Kontrak_Uji_Rev01.pdf',
      uploadedAt: new Date().toISOString(),
    },
    notes: 'Revisi klausul SLA disepakati.',
    uploadedBy: 'Luky Tri Sasongko',
    uploadedAt: new Date().toISOString(),
    isFinal: false,
    fileType: 'legal_draft' as const,
  }
  newDoc.revisionDocuments.push(revVersion)
  newDoc.versions.push(revVersion as any)
  newDoc.history.push({
    stage: 2,
    action: 'Unggah Draf Revisi (Rev.01)',
    actor: 'Luky Tri Sasongko',
    notes: 'Revisi klausul SLA disepakati.',
    versionTag: 'Rev.01',
    timestamp: new Date().toISOString(),
  })
  await saveDriveDocument(newDoc)

  retrievedDoc = await getDriveDocumentById(newDoc._id)
  assert(retrievedDoc?.stage === 2 && retrievedDoc?.versions.length === 2, 'Stage 2 (Revisi Draft) & Rev.01 persisted')

  // Simulate Stage 3 (Persetujuan Legal) -> Stage 4 (Tanda Tangan Direksi) -> Stage 5 (Pengarsipan Final)
  newDoc.stage = 5
  newDoc.stageStatus = 'completed' as any
  newDoc.statusLabel = 'Pengarsipan'
  newDoc.finalDocument = {
    originalName: 'Kontrak_Uji_Final_Signed.pdf',
    filename: 'kontrak_uji_final_signed.pdf',
    size: 1800000,
    mimeType: 'application/pdf',
    url: '/files/Kontrak_Uji_Final_Signed.pdf',
    uploadedAt: new Date().toISOString(),
  }
  newDoc.versions.push({
    version: 'FINAL',
    file: newDoc.finalDocument,
    notes: 'Dokumen final ditandatangani Direksi.',
    uploadedBy: 'Toto Rubianto',
    uploadedAt: new Date().toISOString(),
    isFinal: true,
    fileType: 'final' as any,
  })
  await saveDriveDocument(newDoc)

  retrievedDoc = await getDriveDocumentById(newDoc._id)
  assert(
    retrievedDoc?.stage === 5 && retrievedDoc?.stageStatus === 'completed' && !!retrievedDoc?.finalDocument,
    'Stage 5 (Pengarsipan Final) completed & finalDocument stored'
  )

  // -------------------------------------------------------------
  // TEST 3: Concurrent Document Submissions & Deletion Persistence
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Concurrent Document Operations & Deletion Persistence ---')
  const concurrentDocs = [1, 2, 3].map((idx) => ({
    ...newDoc,
    _id: `doc_conc_${Date.now()}_${idx}`,
    docNumber: `${testDocNumber}-C${idx}`,
    name: `Dokumen Uji Konkurensi #${idx}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  await Promise.all(concurrentDocs.map((d) => saveDriveDocument(d)))

  for (const cd of concurrentDocs) {
    const found = await getDriveDocumentById(cd._id)
    assert(!!found && found.docNumber === cd.docNumber, `Concurrent document ${cd.docNumber} saved without race loss`)
  }

  // Delete main test doc and concurrent test docs
  const deleteOk = await deleteDriveDocument(newDoc._id)
  assert(deleteOk, `Document ${testDocNumber} deleted from store`)
  await Promise.all(concurrentDocs.map((d) => deleteDriveDocument(d._id)))

  // Simulate cold start / store re-init
  await initAndSeedDriveStore()
  const checkDeleted = await getDriveDocumentById(newDoc._id)
  assert(checkDeleted === null, 'Deleted document does NOT exist in getDriveDocumentById after re-init')

  const allDocs = await getDriveDocuments()
  const foundInList = allDocs.some(
    (d) =>
      d._id === newDoc._id ||
      d.docNumber === testDocNumber ||
      concurrentDocs.some((cd) => cd._id === d._id)
  )
  assert(!foundInList, 'Deleted documents do NOT reappear in getDriveDocuments after re-init / refresh')

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
  const { getDeletedDocsFromGoogleDriveRegistry } = await import('../lib/gdrive')
  const gdriveDeleted = await getDeletedDocsFromGoogleDriveRegistry()
  assert(Array.isArray(gdriveDeleted), 'Google Drive deleted docs registry accessible as array')

  // -------------------------------------------------------------
  // TEST 6: User Avatar & Cover Binary Streaming
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: User Avatar & Cover Binary Streaming ---')
  const { getUserAvatarBufferFromGoogleDrive, getUserCoverBufferFromGoogleDrive } = await import('../lib/gdrive')
  const avatarRes = await getUserAvatarBufferFromGoogleDrive('usr_toto_admin_01')
  const coverRes = await getUserCoverBufferFromGoogleDrive('usr_toto_admin_01')
  assert(avatarRes === null || (!!avatarRes && avatarRes.buffer.length > 0), 'Avatar binary stream lookup completes cleanly')
  assert(coverRes === null || (!!coverRes && coverRes.buffer.length > 0), 'Cover photo binary stream lookup completes cleanly')

  // -------------------------------------------------------------
  // TEST 7: Strict User Document Isolation & Full Legal/Admin Control
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Strict User Document Isolation & Full Legal/Admin Control ---')
  const {
    canUserAccessDocument,
    canUserEditDocument,
    canUserDeleteDocument,
    canUserProcessWorkflow,
    canUploadLegalDraft,
    canUploadLegalApproval,
    canUploadBodSigned,
    canUploadFinalDocument,
  } = await import('../lib/roles')

  const sampleUploadedDoc = {
    _id: 'doc_matrix_test',
    docNumber: 'RIDE-2026-9999',
    name: 'Dokumen Pengujian Matriks Multi-Peran',
    division: 'Direktorat Operasional',
    confidentiality: 'Internal',
    createdBy: 'usr_pemohon_01',
    pic: 'Budi Pemohon',
    picEmail: 'budi@risetrack.id',
    stage: 0,
    stageStatus: 'active',
    rejected: false,
    revisionRequested: false,
    versions: [
      {
        version: 'V0',
        uploadedBy: 'Budi Pemohon',
        file: { originalName: 'draf.pdf' },
      },
    ],
  }

  const budiOwner = { role: 'User', userId: 'usr_pemohon_01', email: 'budi@risetrack.id', employeeName: 'Budi Pemohon' }
  const jokoOtherUser = { role: 'User', userId: 'usr_other_02', email: 'joko@risetrack.id', employeeName: 'Joko User' }
  const legalOfficer = { role: 'Legal Officer', userId: 'usr_legal_off', email: 'legal@risetrack.id', employeeName: 'Siti Legal' }
  const legalManagement = { role: 'Legal Management', userId: 'usr_legal_mgr', email: 'manager@risetrack.id', employeeName: 'Rudi Manager' }
  const sysAdmin = { role: 'System Administrator', userId: 'usr_sysadmin', email: 'admin@risetrack.id', employeeName: 'Admin RIDE' }
  const guestUser = { role: 'Guest', userId: 'usr_guest', email: 'guest@risetrack.id', employeeName: 'Tamu' }

  // 1. Strict Isolation Check: User can only access own document
  assert(canUserAccessDocument(budiOwner, sampleUploadedDoc), 'Document Owner (User Budi) can access own document')
  assert(!canUserAccessDocument(jokoOtherUser, sampleUploadedDoc), 'Other User (Joko) is strictly isolated and CANNOT access Budi document')
  assert(!canUserAccessDocument(guestUser, sampleUploadedDoc), 'Guest User is strictly isolated and CANNOT access Budi document')

  // 2. Legal & Admin Full Visibility
  assert(canUserAccessDocument(legalOfficer, sampleUploadedDoc), 'Legal Officer can access submission from any user')
  assert(canUserAccessDocument(legalManagement, sampleUploadedDoc), 'Legal Management can access submission from any user')
  assert(canUserAccessDocument(sysAdmin, sampleUploadedDoc), 'System Administrator can access submission from any user')

  // 3. Edit Authority (canUserEditDocument)
  assert(canUserEditDocument(legalOfficer, sampleUploadedDoc), 'Legal Officer is authorized to edit user document')
  assert(canUserEditDocument(legalManagement, sampleUploadedDoc), 'Legal Management is authorized to edit user document')
  assert(canUserEditDocument(sysAdmin, sampleUploadedDoc), 'System Administrator is authorized to edit user document')
  assert(canUserEditDocument(budiOwner, sampleUploadedDoc), 'Document Owner is authorized to edit own initial document')
  assert(!canUserEditDocument(jokoOtherUser, sampleUploadedDoc), 'Other User is NOT authorized to edit Budi document')

  // 4. Delete Authority (canUserDeleteDocument)
  assert(canUserDeleteDocument(sysAdmin, sampleUploadedDoc), 'System Administrator is authorized to delete document')
  assert(canUserDeleteDocument(legalManagement, sampleUploadedDoc), 'Legal Management is authorized to delete document')
  assert(canUserDeleteDocument(budiOwner, sampleUploadedDoc), 'Document Owner is authorized to delete initial submission')
  assert(!canUserDeleteDocument(jokoOtherUser, sampleUploadedDoc), 'Other User is NOT authorized to delete Budi document')

  // 5. Workflow Processing Authority (canUserProcessWorkflow)
  assert(canUserProcessWorkflow(legalOfficer, sampleUploadedDoc, 'approve'), 'Legal Officer can approve Stage 0-2 (Telaah & Draft)')
  assert(canUserProcessWorkflow(legalOfficer, sampleUploadedDoc, 'revision'), 'Legal Officer can request revision')
  assert(canUserProcessWorkflow(legalOfficer, sampleUploadedDoc, 'reject'), 'Legal Officer can reject document')
  assert(!canUserProcessWorkflow(legalOfficer, { ...sampleUploadedDoc, stage: 3 }, 'approve'), 'Legal Officer CANNOT approve Stage 3 (Reserved for Legal Management)')
  assert(canUserProcessWorkflow(legalManagement, { ...sampleUploadedDoc, stage: 3 }, 'approve'), 'Legal Management can approve Stage 3 (Legal Clearance)')
  assert(canUserProcessWorkflow(sysAdmin, sampleUploadedDoc, 'approve'), 'System Administrator can process any workflow stage')
  assert(!canUserProcessWorkflow(budiOwner, sampleUploadedDoc, 'approve'), 'Standard User CANNOT advance/approve workflow stage')
  assert(!canUserProcessWorkflow(jokoOtherUser, sampleUploadedDoc, 'approve'), 'Other User CANNOT advance/approve workflow stage')

  // 6. Upload Authority Matrix
  assert(canUploadLegalDraft('Legal Officer'), 'Legal Officer authorized to upload legal draft')
  assert(canUploadLegalDraft('Legal Management'), 'Legal Management authorized to upload legal draft')
  assert(canUploadLegalApproval('Legal Management'), 'Legal Management authorized to upload legal clearance')
  assert(canUploadBodSigned('Board of Directors'), 'Board of Directors authorized to upload BOD signed')
  assert(canUploadFinalDocument('Legal Management'), 'Legal Management authorized to upload final document')
  assert(canUploadFinalDocument('System Administrator'), 'System Administrator authorized to upload final document')

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
