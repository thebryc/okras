import NextAuth from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { Resend } from "resend"
import prisma from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

// Org structure with team colors and supervisor mapping
const BRYC_ORG = {
  "josh@thebryc.org": { name: "Josh Howard", supervisor: null, color: "#000000", isChief: true },
  "rhonda@thebryc.org": { name: "Rhonda Irwin-Ikechukwu", supervisor: "josh@thebryc.org", color: "#00adad" },
  "chasity@thebryc.org": { name: "Chasity Kelley", supervisor: "josh@thebryc.org", color: "#ed125f" },
  "jakia@thebryc.org": { name: "Jakia Steele", supervisor: "josh@thebryc.org", color: "#00adad" },
  "myeisha@thebryc.org": { name: "Myeisha Anderson", supervisor: "josh@thebryc.org", color: "#00775f" },
  "forrest@thebryc.org": { name: "Forrest Middlebrook", supervisor: "josh@thebryc.org", color: "#eb2627" },
  "marcus@thebryc.org": { name: "Marcus Washington", supervisor: "josh@thebryc.org", color: "#094d9e" },
  "alexis@thebryc.org": { name: "Alexis Washington", supervisor: "josh@thebryc.org", color: "#393086" },

  // Rhonda's directs
  "tavidee@thebryc.org": { name: "Tavidee Hoskins", supervisor: "rhonda@thebryc.org", color: "#00adad" },
  "kirsten@thebryc.org": { name: "Kirsten Raby", supervisor: "rhonda@thebryc.org", color: "#00adad" },
  "richard@thebryc.org": { name: "Richard Ross", supervisor: "rhonda@thebryc.org", color: "#00adad" },

  // Chasity's directs
  "aareena@thebryc.org": { name: "Aareena Dhillon", supervisor: "chasity@thebryc.org", color: "#ed125f" },
  "kendrick@thebryc.org": { name: "Kendrick Henson", supervisor: "chasity@thebryc.org", color: "#ed125f" },
  "lauren@thebryc.org": { name: "Lauren Bradley", supervisor: "chasity@thebryc.org", color: "#ed125f" },
  "angela@thebryc.org": { name: "Angela Manangan", supervisor: "chasity@thebryc.org", color: "#ed125f" },

  // Jakia's directs
  "rachel@thebryc.org": { name: "Rachel Stevens", supervisor: "jakia@thebryc.org", color: "#00adad" },
  "tim@thebryc.org": { name: "Tim Williams", supervisor: "jakia@thebryc.org", color: "#00adad" },
  "catherine@thebryc.org": { name: "Catherine Buck", supervisor: "jakia@thebryc.org", color: "#00adad" },
}

// Cross-team access rules
const CROSS_TEAM_ACCESS = [
  { user: "chasity@thebryc.org", target: "catherine@thebryc.org", type: "edit" },
  { user: "rhonda@thebryc.org", target: "jakia@thebryc.org", type: "view" },
]

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        try {
          await resend.emails.send({
            from: "noreply@resend.dev", // Use Resend's default sender
            to: email,
            subject: "Sign in to BRYC OKR Tracker",
            html: `
              <h2>Sign in to BRYC OKR Tracker</h2>
              <p>Click the link below to sign in:</p>
              <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #000000; color: white; text-decoration: none; border-radius: 5px;">
                Sign in
              </a>
              <p>Or copy and paste this link: ${url}</p>
              <p>This link expires in 24 hours.</p>
            `,
          })
        } catch (error) {
          console.error("Error sending email:", error)
          throw new Error("Failed to send sign in email")
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, email }) {
      // Only allow @thebryc.org emails
      if (!user.email?.endsWith("@thebryc.org")) {
        return false
      }
      return true
    },
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const emailLower = user.email.toLowerCase()
        const orgInfo = BRYC_ORG[emailLower]

        if (orgInfo) {
          let supervisorId = null
          if (orgInfo.supervisor) {
            const supervisor = await prisma.user.findUnique({
              where: { email: orgInfo.supervisor },
            })
            supervisorId = supervisor?.id
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: orgInfo.name,
              teamColor: orgInfo.color,
              supervisorId,
              isChief: orgInfo.isChief || false,
            },
          })

          // Set up cross-team access
          for (const access of CROSS_TEAM_ACCESS) {
            if (access.user === emailLower) {
              const targetUser = await prisma.user.findUnique({
                where: { email: access.target },
              })
              if (targetUser) {
                await prisma.crossTeamAccess.upsert({
                  where: {
                    userId_targetUserId_accessType: {
                      userId: user.id,
                      targetUserId: targetUser.id,
                      accessType: access.type,
                    },
                  },
                  create: {
                    userId: user.id,
                    targetUserId: targetUser.id,
                    accessType: access.type,
                  },
                  update: {},
                })
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in signIn event:", error)
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}

export default NextAuth(authOptions)
