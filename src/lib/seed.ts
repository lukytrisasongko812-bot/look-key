import { initAndSeedDriveStore, getDriveDocuments, getDriveUsers } from './drive-store'

export async function seedDatabase(force = false) {
  if (force && globalThis.__rideDriveStore) {
    globalThis.__rideDriveStore.isInitialized = false
  }
  await initAndSeedDriveStore()
  const docs = await getDriveDocuments()
  const users = await getDriveUsers()
  return {
    success: true,
    message: 'Google Drive File Store initialized successfully.',
    documentsCount: docs.length,
    usersCount: users.length,
  }
}
