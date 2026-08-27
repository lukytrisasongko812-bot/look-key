import { seedDatabase } from '../lib/seed'

async function main() {
  console.log('Connecting to local MongoDB and seeding RISE data...')
  try {
    const result = await seedDatabase(true)
    console.log('Seeding result:', result.message)
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

main()
