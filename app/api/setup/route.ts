import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'DATABASE_URL environment variable is not set',
        hint: 'Please configure DATABASE_URL in Vercel environment variables'
      }, { status: 500 })
    }

    const client = await pool.connect()
  
    try {
      // Check if Users table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'Users'
        );
      `)
      
      if (!tableCheck.rows[0].exists) {
        await client.query(`
          CREATE TABLE "Users" (
            "Id" SERIAL PRIMARY KEY,
            "Email" VARCHAR(255) UNIQUE NOT NULL,
            "Password" VARCHAR(255) NOT NULL,
            "Name" VARCHAR(255) NOT NULL,
            "Role" VARCHAR(50) NOT NULL,
            "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `)
      }
      
      // Check if admin user exists
      const adminCheck = await client.query(
        'SELECT * FROM "Users" WHERE "Email" = $1',
        ['admin@life360omics.com']
      )
      
      if (adminCheck.rows.length > 0) {
        return NextResponse.json({ 
          message: 'Admin user already exists',
          user: {
            email: adminCheck.rows[0].Email,
            name: adminCheck.rows[0].Name,
            role: adminCheck.rows[0].Role
          }
        })
      }
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 10)
      
      await client.query(
        `INSERT INTO "Users" ("Email", "Password", "Name", "Role") 
         VALUES ($1, $2, $3, $4)`,
        ['admin@life360omics.com', hashedPassword, 'Admin User', 'ADMIN']
      )
      
      return NextResponse.json({ 
        message: 'Admin user created successfully',
        credentials: {
          email: 'admin@life360omics.com',
          password: 'Admin123!'
        }
      })
      
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
