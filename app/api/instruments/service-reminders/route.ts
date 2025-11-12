import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { sendServiceReminderEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Get instruments with upcoming service dates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT 
          "Id", "Name", "SerialNumber", "ServiceDate", "CalibrationDate"
        FROM "Instruments"
        WHERE "ServiceDate" IS NOT NULL
        ORDER BY "ServiceDate" ASC
      `)

      const now = new Date()
      const reminders = result.rows
        .map(row => {
          if (!row.ServiceDate) return null
          
          const serviceDate = new Date(row.ServiceDate)
          const monthsUntil = (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
          
          if (monthsUntil <= 3 && monthsUntil >= 0) {
            return {
              id: row.Id,
              name: row.Name,
              serialNumber: row.SerialNumber,
              serviceDate: row.ServiceDate,
              monthsUntil: Math.ceil(monthsUntil),
              calibrationDate: row.CalibrationDate,
            }
          }
          return null
        })
        .filter(Boolean)

      return NextResponse.json(reminders)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Service reminders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service reminders' },
      { status: 500 }
    )
  }
}

// Send service reminder emails
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    
    try {
      // Get admin emails for notifications
      const adminResult = await client.query(`
        SELECT "Email" FROM "Users" WHERE "Role" IN ('ADMIN', 'DIRECTOR')
      `)
      const adminEmails = adminResult.rows.map(row => row.Email)

      // Get instruments needing reminders
      const result = await client.query(`
        SELECT 
          "Id", "Name", "SerialNumber", "ServiceDate"
        FROM "Instruments"
        WHERE "ServiceDate" IS NOT NULL
        ORDER BY "ServiceDate" ASC
      `)

      const now = new Date()
      const sent = []

      for (const row of result.rows) {
        const serviceDate = new Date(row.ServiceDate)
        const monthsUntil = (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
        
        // Send reminders at 3, 2, and 1 months before
        if (monthsUntil <= 3 && monthsUntil > 0 && monthsUntil <= 1) {
          await sendServiceReminderEmail(
            adminEmails,
            row.Name,
            serviceDate,
            Math.ceil(monthsUntil)
          )
          sent.push({
            instrument: row.Name,
            monthsUntil: Math.ceil(monthsUntil),
          })
        }
      }

      return NextResponse.json({ sent, count: sent.length })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Send service reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to send service reminders' },
      { status: 500 }
    )
  }
}

