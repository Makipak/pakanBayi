import NextAuth from "next-auth";
import { encode as defaultEncode } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

// "Ingat saya" dicentang -> login bertahan 30 hari; tidak dicentang -> habis dalam 12 jam.
const INGAT_SAYA_DETIK = 60 * 60 * 24 * 30;
const TANPA_INGAT_SAYA_DETIK = 60 * 60 * 12;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: INGAT_SAYA_DETIK },
  jwt: {
    // Umur token ditentukan per-login lewat flag `remember` di dalam token.
    encode: async (params) =>
      defaultEncode({
        ...params,
        maxAge: params.token?.remember === false ? TANPA_INGAT_SAYA_DETIK : params.maxAge,
      }),
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        remember: { label: "Ingat saya", type: "text" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.nama,
          username: user.username,
          role: user.role,
          // Default true (ingat saya) kalau field tidak dikirim.
          remember: credentials?.remember !== "false",
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.username = (user as { username: string }).username;
        token.remember = (user as { remember?: boolean }).remember !== false;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
