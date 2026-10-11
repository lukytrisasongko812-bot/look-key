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
  if (uId && dCreatedBy && (uId === dCreatedBy || uId.toLowerCase() === dCreatedBy.toLowerCase())) {
    return true
  }

  // 2. Match by Creator Email
  if (uEmail && dCreatedBy && uEmail === dCreatedBy.toLowerCase()) {
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

  return false
}

/**
 * Check if the user has authority to access (view/download/track) the document based on their role and ownership matrix:
 * 1. System Administrator: Global access to all documents across the corporate database.
 * 2. Document Owner / PIC: Full access to their own submitted documents regardless of role.
 * 3. Board of Directors: Access to their own documents + documents in executive approval stage (stage >= 2 or Urgent/Critical priority or stageStatus completed).
 * 4. Legal Management: Access to their own documents + documents across all active pipeline stages (stage >= 0, final document, contract expiry).
 * 5. Legal Officer: Access to their own documents + documents in review/revision/drafting queue (stage 0 to 3, revision requested, or legal division).
 * 6. User: Strictly only their own documents (where they are creator or PIC).
 * 7. Guest: Strictly only their own documents or non-confidential public internal documents.
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

  // 2. Document Owner / PIC always has access to their own document across all roles
  const isOwner = isDocumentOwnerOrPic(user, doc)
  if (isOwner) return true

  // 3. Legal Officer, Legal Management, and Board of Directors have full tracking visibility across all stages
  if (role === 'Legal Officer' || role === 'Legal Management' || role === 'Board of Directors') {
    return true
  }

  // 4. User role: Access their own documents, or documents within their same division
  if (role === 'User') {
    if (doc.division && user.division && doc.division.toLowerCase() === user.division.toLowerCase()) {
      return true
    }
    return false
  }

  // 5. Guest is confined to their own documents or non-confidential public internal documents
  if (role === 'Guest') {
    return Boolean(doc.confidentiality === 'Internal' && (doc.stage ?? 0) >= 4)
  }

  return false
}
