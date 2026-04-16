/**
 * Seed a superadmin user.
 *
 * Usage:
 *   npx tsx scripts/seed-superadmin.ts <email>
 *
 * The email must already exist in the Better Auth `user` table
 * (i.e. the person must have registered or been created).
 *
 * This script also migrates any existing "superuser" role rows
 * in the `users` table to "manager". Run this (or the same UPDATE in SQL)
 * before `drizzle-kit push` if push fails with enum errors on existing DBs.
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import pg from "pg"

const email = process.argv[2]

if (!email) {
  console.error("Usage: npx tsx scripts/seed-superadmin.ts <email>")
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set — check .env.local")
  process.exit(1)
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    // 1. Migrate existing "superuser" rows to "manager"
    const migrated = await client.query(
      `UPDATE users SET role = 'manager' WHERE role = 'superuser'`
    )
    if ((migrated.rowCount ?? 0) > 0) {
      console.log(`Migrated ${migrated.rowCount} superuser(s) → manager`)
    }

    // 2. Ensure platform_admins table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_admins (
        user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // 3. Look up the auth user by email
    const { rows } = await client.query(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
      [email]
    )

    if (rows.length === 0) {
      console.error(`No user found with email: ${email}`)
      console.error("The user must register first, then run this script.")
      process.exit(1)
    }

    const userId = rows[0].id

    // 4. Upsert into platform_admins
    await client.query(
      `INSERT INTO platform_admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    )

    console.log(`✓ ${email} (${userId}) is now a superadmin`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
