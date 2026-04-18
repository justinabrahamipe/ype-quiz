import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./db";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "mahanaimype@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existing) {
        const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
        const role = isSuperAdmin ? "admin" : "user";
        const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
        const openSignup = settings?.openSignup ?? false;
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            role,
            isApproved: isSuperAdmin || openSignup,
          },
        });
      } else {
        // Update image and name on each sign-in
        await prisma.user.update({
          where: { email: user.email },
          data: {
            image: user.image ?? existing.image,
            name: existing.name || user.name || null,
          },
        });
      }

      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isQualified = dbUser.isQualified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
