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
          return null
        }

        // Query user from database
        const client = await pool.connect()
        try {
          const result = await client.query(
            'SELECT "Id", "Email", "Password", "Name", "Role" FROM "Users" WHERE "Email" = $1',
            [credentials.email]
          )

          if (result.rows.length === 0) {
            return null
          }

          const user = result.rows[0]
          
          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.Password)
          
          if (!passwordMatch) {
            return null
          }

          return {
            id: user.Id,
            email: user.Email,
            name: user.Name,
            role: user.Role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        } finally {
          client.release()
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
