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
