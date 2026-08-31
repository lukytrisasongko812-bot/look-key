import { initAndSeedDriveStore } from './drive-store'

export async function connectToDatabase() {
  await initAndSeedDriveStore()
  return { connected: true, engine: 'Google Drive File Engine' }
}
