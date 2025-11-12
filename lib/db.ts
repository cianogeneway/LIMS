import { Pool } from 'pg'

// Parse connection string from environment or use defaults
const getPool = () => {
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require'
  
  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })
}

export const pool = getPool()

