import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { pool } from './db'
import bcrypt from 'bcryptjs'

// Fix for NextAuth types
declare module 'next-auth' {
  interface User {
    role: string
    id: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        console.log('Login attempt:', credentials.email)

        // Hardcoded login for demo - bypass database
        if (credentials.email === 'admin@life360omics.com' && credentials.password === 'Admin123!') {
          console.log('Hardcoded login successful')
          return {
            id: '1',
            email: 'admin@life360omics.com',
            name: 'Admin User',
            role: 'ADMIN',
          }
        }

        console.log('Hardcoded login failed, trying database')

        // Fallback to database authentication
        try {
          const client = await pool.connect()
          try {
            const result = await client.query(
              'SELECT "Id", "Email", "Password", "Name", "Role" FROM "Users" WHERE "Email" = $1',
              [credentials.email]
            )

            if (result.rows.length === 0) {
              console.log('User not found in database')
              return null
            }

            const user = result.rows[0]
            
            // Verify password
            const passwordMatch = await bcrypt.compare(credentials.password, user.Password)
            
            if (!passwordMatch) {
              console.log('Password mismatch')
              return null
            }

            console.log('Database login successful')
            return {
              id: user.Id,
              email: user.Email,
              name: user.Name,
              role: user.Role,
            }
          } finally {
            client.release()
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
