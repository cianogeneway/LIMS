import { pool } from '../lib/db'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
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
      console.log('Creating Users table...')
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
      console.log('Users table created.')
    }
    
    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT * FROM "Users" WHERE "Email" = $1',
      ['admin@life360omics.com']
    )
    
    if (adminCheck.rows.length > 0) {
      console.log('Admin user already exists.')
      return
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10)
    
    await client.query(
      `INSERT INTO "Users" ("Email", "Password", "Name", "Role") 
       VALUES ($1, $2, $3, $4)`,
      ['admin@life360omics.com', hashedPassword, 'Admin User', 'ADMIN']
    )
    
    console.log('✅ Admin user created successfully!')
    console.log('Email: admin@life360omics.com')
    console.log('Password: Admin123!')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createAdminUser()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
