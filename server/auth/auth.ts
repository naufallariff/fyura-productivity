import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/config/env";
import { upsertUserByEmail } from "@/lib/db/users";
import { isAllowedEmail } from "./allowlist";
import { ensureDefaultHabits } from "@/lib/services/daily";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: THIRTY_DAYS_SECONDS },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // Gate 1: only verified Google accounts on the allowlist may sign in.
    async signIn({ profile }) {
      const p = profile as { email?: unknown; email_verified?: unknown } | undefined;
      if (!p || p.email_verified !== true || typeof p.email !== "string") return false;
      return isAllowedEmail(p.email, env.ALLOWED_EMAILS);
    },

    // Runs on every request, but profile is only present at sign-in.
    // We resolve the database user id once and keep it in the token.
    async jwt({ token, profile }) {
      const p = profile as { email?: unknown; name?: unknown } | undefined;
      if (p && typeof p.email === "string") {
        const userId = await upsertUserByEmail(p.email, typeof p.name === "string" ? p.name : null);
        token.uid = userId;
        await ensureDefaultHabits(userId);
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = typeof token.uid === "string" ? token.uid : "";
      return session;
    },
  },
});
