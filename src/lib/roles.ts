import { UserRole } from '@/context/AppContext'

/**
 * Normalizes any role string (including legacy aliases) into one of the 6 official corporate roles:
 * - 'Guest'
 * - 'User'
 * - 'Legal Officer'
 * - 'Legal Management'
 * - 'Board of Directors'
 * - 'System Administrator'
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'User'
  const normalized = role.trim().toLowerCase()

  if (normalized === 'guest') {
    return 'Guest'
  }
  if (normalized === 'user' || normalized === 'requester' || normalized === 'pemohon') {
    return 'User'
  }
  if (
    normalized === 'legal officer' ||
    normalized === 'reviewer' ||
    normalized === 'peninjau' ||
    normalized === 'legal & compliance reviewer'
  ) {
    return 'Legal Officer'
  }
  if (
    normalized === 'legal management' ||
    normalized === 'legal manager' ||
    normalized === 'document controller' ||
    normalized === 'controller' ||
    normalized === 'pengendali dokumen'
  ) {
    return 'Legal Management'
  }
  if (
    normalized === 'board of directors' ||
    normalized === 'bod' ||
    normalized === 'director / bod' ||
    normalized === 'director' ||
    normalized === 'direksi' ||
    normalized === 'approver' ||
    normalized === 'penyetuju' ||
    normalized === 'executive approver'
  ) {
    return 'Board of Directors'
  }
  if (
    normalized === 'system administrator' ||
    normalized === 'administrator' ||
    normalized === 'sysadmin' ||
    normalized === 'admin'
  ) {
    return 'System Administrator'
  }

  return (role as UserRole) || 'User'
}

export function isSystemAdmin(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'System Administrator'
}

export function isBoardOfDirectors(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Board of Directors' || norm === 'System Administrator'
}

export function isLegalManagement(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Management' || norm === 'System Administrator'
}

export function isLegalOfficer(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Officer' || norm === 'Legal Management' || norm === 'System Administrator'
}

export function isStandardUser(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'User'
}

export function isGuest(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Guest'
}

/**
 * Matriks kewenangan hanya dapat diakses oleh Legal Management ke atas:
 * - Legal Management
 * - Board of Directors
 * - System Administrator
 */
export function canAccessAuthorityMatrix(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Management' || norm === 'Board of Directors' || norm === 'System Administrator'
}

/**
 * Kewenangan mengunggah draf hasil telaah / kajian legal / draf perbaikan:
 * - Legal Officer
 * - Legal Management
 * - System Administrator
 */
export function canUploadLegalDraft(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Officer' || norm === 'Legal Management' || norm === 'System Administrator'
}

/**
 * Kewenangan mengunggah lembar persetujuan legal / legal clearance / BA persetujuan:
 * - Legal Management
 * - System Administrator
 */
export function canUploadLegalApproval(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Management' || norm === 'System Administrator'
}

/**
 * Kewenangan mengunggah dokumen bertanda tangan Direksi (BOD Signed):
 * - Board of Directors
 * - System Administrator
 */
export function canUploadBodSigned(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Board of Directors' || norm === 'System Administrator'
}

/**
 * Kewenangan mengunggah dokumen final resmi (FINAL):
 * - Legal Management
 * - Board of Directors
 * - System Administrator
 */
export function canUploadFinalDocument(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Management' || norm === 'Board of Directors' || norm === 'System Administrator'
}

/**
 * Kewenangan meminta revisi draf dokumen ke pemohon:
 * - Legal Officer
 * - Legal Management
 * - Board of Directors
 * - System Administrator
 */
export function canRequestRevision(role?: string | null): boolean {
  const norm = normalizeRole(role)
  return norm === 'Legal Officer' || norm === 'Legal Management' || norm === 'Board of Directors' || norm === 'System Administrator'
}

/**
 * Kewenangan memverifikasi atau menyetujui tahapan workflow:
 */
export function canApproveCurrentStage(role?: string | null, stage = 0): boolean {
  const norm = normalizeRole(role)
  if (norm === 'System Administrator') return true
  if (stage <= 2) {
    return norm === 'Legal Officer' || norm === 'Legal Management'
  }
  if (stage === 3) {
    return norm === 'Legal Management'
  }
  if (stage === 4) {
    return norm === 'Board of Directors'
  }
  if (stage >= 5) {
    return norm === 'Legal Management'
  }
  return false
}

export interface UserIdentity {
  userId?: string
  id?: string
  _id?: string
  email?: string
  employeeName?: string
  division?: string
  role?: string | null
}

/**
 * Check if the user is the original creator, PIC, or assignee of the document.
 */
export function isDocumentOwnerOrPic(
  user: UserIdentity | null | undefined,
  doc: {
    createdBy?: string
    picEmail?: string
    pic?: string
    [key: string]: any
  } | null | undefined
): boolean {
  if (!user || !doc) return false

  const uEmail = (user.email || '').toLowerCase().trim()
  const uId = (user.userId || user.id || user._id || '').trim()
  const uName = (user.employeeName || '').toLowerCase().trim()

  const dCreatedBy = (doc.createdBy || '').trim()
  const dPicEmail = (doc.picEmail || '').toLowerCase().trim()
  const dPicName = (doc.pic || '').toLowerCase().trim()

  // 1. Match by Creator User ID
  if (uId && dCreatedBy && (uId === dCreatedBy || uId.toLowerCase() === dCreatedBy.toLowerCase() || dCreatedBy.includes(uId) || uId.includes(dCreatedBy))) {
    return true
  }

  // 2. Match by Creator Email
  if (uEmail && dCreatedBy && (uEmail === dCreatedBy.toLowerCase() || dCreatedBy.toLowerCase().includes(uEmail) || uEmail.includes(dCreatedBy.toLowerCase()))) {
    return true
  }

  // 3. Match by PIC Email
  if (uEmail && dPicEmail && (uEmail === dPicEmail || dPicEmail.includes(uEmail) || uEmail.includes(dPicEmail))) {
    return true
  }

  // 4. Match by Employee Name (exact or substring match)
  if (uName && dPicName && (uName === dPicName || dPicName.includes(uName) || uName.includes(dPicName))) {
    return true
  }

  // 5. Match if user's email is present inside PIC field
  if (uEmail && (dPicName.includes(uEmail) || dPicEmail.includes(uEmail))) {
    return true
  }

  // 6. Match if user is recorded as contributor in any document version
  if (doc.versions && Array.isArray(doc.versions)) {
    const isVersionContributor = doc.versions.some((v: any) => {
      const upBy = (v.uploadedBy || '').toLowerCase().trim()
      return (uName && upBy && (upBy === uName || upBy.includes(uName) || uName.includes(upBy))) ||
             (uEmail && upBy && upBy.includes(uEmail))
    })
    if (isVersionContributor) return true
  }

  return false
}

/**
 * Check if the user has authority to access (view/download/track) the document:
 * 1. System Administrator: Global access across all documents.
 * 2. Legal Officer & Legal Management: Full access to view and process all submissions from all users.
 * 3. Board of Directors: Executive access to review and approve corporate documents.
 * 4. User & Guest: STRICT ISOLATION. Setiap user hanya dapat melihat dokumen yang diajukannya sendiri (Owner / PIC / Contributor).
 *    User TIDAK BISA melihat pengajuan dokumen milik pengguna lain.
 */
export function canUserAccessDocument(
  user: UserIdentity | null | undefined,
  doc: {
    createdBy?: string
    picEmail?: string
    pic?: string
    stage?: number
    stageStatus?: string
    revisionRequested?: boolean
    priority?: string
    confidentiality?: string
    finalDocument?: any
    contractEnd?: string | null
    division?: string
    [key: string]: any
  } | null | undefined
): boolean {
  if (!user || !doc) return false

  const role = normalizeRole(user.role)

  // 1. System Administrator has full global access
  if (role === 'System Administrator') return true

  // 2. Legal Officer, Legal Management, and Board of Directors have full visibility to view all submissions
  if (role === 'Legal Officer' || role === 'Legal Management' || role === 'Board of Directors') {
    return true
  }

  // 3. User & Guest: STRICT ISOLATION
  // Masing-masing user HANYA dapat melihat pengajuan dokumen miliknya sendiri
  return isDocumentOwnerOrPic(user, doc)
}

/**
 * Check if the user has authority to edit document metadata:
 * - System Administrator, Legal Management, Legal Officer: Can view and edit submissions from users.
 * - User: Can only edit their OWN document (isDocumentOwnerOrPic) while it is not yet finalized/archived (stage < 5 and not rejected).
 * - Guest: Cannot edit.
 */
export function canUserEditDocument(
  user: UserIdentity | null | undefined,
  doc: any
): boolean {
  if (!user || !doc) return false
  const role = normalizeRole(user.role)

  if (role === 'System Administrator' || role === 'Legal Management' || role === 'Legal Officer') {
    return true
  }

  if (role === 'User') {
    const isOwner = isDocumentOwnerOrPic(user, doc)
    const isCompleted = (doc.stage ?? 0) >= 5 || doc.stageStatus === 'completed'
    return isOwner && !isCompleted && !doc.rejected
  }

  return false
}

/**
 * Check if the user has authority to delete the document:
 * - System Administrator & Legal Management: Authorized to manage/delete documents.
 * - User: Can only delete their OWN document if it is still at initial submission (stage 0) and not yet processed.
 * - Other: Cannot delete.
 */
export function canUserDeleteDocument(
  user: UserIdentity | null | undefined,
  doc: any
): boolean {
  if (!user || !doc) return false
  const role = normalizeRole(user.role)

  if (role === 'System Administrator' || role === 'Legal Management') {
    return true
  }

  if (role === 'User') {
    const isOwner = isDocumentOwnerOrPic(user, doc)
    return isOwner && ((doc.stage ?? 0) === 0) && !doc.rejected
  }

  return false
}

/**
 * Check if the user has authority to process workflow transitions:
 * - System Administrator & Legal Management: Full workflow processing across all stages.
 * - Legal Officer: Authorized to process stages 0-2 (Telaah & Drafting), request revision, or reject.
 * - Board of Directors: Authorized to approve stage 4 (BOD Signed), request revision, or reject.
 * - User & Guest: Cannot process stage transitions.
 */
export function canUserProcessWorkflow(
  user: UserIdentity | null | undefined,
  doc: any,
  action: string
): boolean {
  if (!user || !doc) return false
  const role = normalizeRole(user.role)

  if (role === 'System Administrator' || role === 'Legal Management') {
    return true
  }

  if (role === 'Legal Officer') {
    if (['revision', 'reject', 'resolve_revision'].includes(action)) return true
    if (['approve', 'advance'].includes(action) && (doc.stage ?? 0) <= 2) return true
    return false
  }

  if (role === 'Board of Directors') {
    if (['approve', 'advance'].includes(action) && (doc.stage ?? 0) === 4) return true
    if (['revision', 'reject'].includes(action)) return true
    return false
  }

  // User (Pemohon): Pada Tahap 2 (Cek Draf & Revisi), pemohon dapat mengembalikan draf ke Divisi Legal untuk Paraf Legal Manager
  if (role === 'User' && isDocumentOwnerOrPic(user, doc)) {
    if (['approve', 'advance', 'resolve_revision'].includes(action) && (doc.stage ?? 0) === 2) {
      return true
    }
  }

  return false
}
