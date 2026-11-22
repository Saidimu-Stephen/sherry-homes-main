/** @format */

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import User from "@/app/models/users";
import bcrypt from "bcryptjs";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRETE || "";

const hasGoogleCredentials = Boolean(googleClientId && googleClientSecret);

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId || "unconfigured-client-id",
      clientSecret: googleClientSecret || "unconfigured-client-secret",
    }),
  ],
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    "your_secret_key",
  pages: {
    signIn: "/login",
    error: "/auth/google",
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google") {
        if (!hasGoogleCredentials) {
          return "/auth/google?error=OAuthNotConfigured";
        }
        try {
          const email = (user?.email || "").trim().toLowerCase();
          if (email) {
            const parts = (user?.name || "Google Guest").trim().split(/\s+/);
            const firstName = parts[0] || "Guest";
            const lastName = parts.slice(1).join(" ") || "User";
            const connected = await connectDB();
            if (!connected) {
              const store = getStore();
              const existing = store.users.find(
                (u) => u.email.toLowerCase() === email
              );
              if (existing) {
                if (user?.image && !existing.avatar) existing.avatar = user.image;
              } else {
                store.users.push({
                  _id: `usr-google-${Date.now()}`,
                  firstName,
                  lastName,
                  username: email.split("@")[0] + "_" + Date.now().toString().slice(-4),
                  email,
                  phoneNumber: "+254 700 000 000",
                  gender: "female",
                  role: "guest",
                  avatar: user?.image || "/images/avatars/guest-amina.jpg",
                  password: await bcrypt.hash(`google-${Date.now()}`, 8),
                  date: new Date().toISOString(),
                });
              }
            } else {
              const existing = await User.findOne({ email });
              if (existing) {
                if (user?.image && !existing.avatar) {
                  existing.avatar = user.image;
                  await existing.save();
                }
              } else {
                await User.create({
                  firstName,
                  lastName,
                  username: `${email.split("@")[0].slice(0, 12)}_${Date.now()
                    .toString()
                    .slice(-4)}`,
                  email,
                  phoneNumber: "+254 700 000 000",
                  gender: "female",
                  role: "guest",
                  avatar: user?.image || "/images/avatars/guest-amina.jpg",
                  password: await bcrypt.hash(`google-${Date.now()}`, 8),
                });
              }
            }
          }
        } catch (err) {
          console.error("Google user profile sync warning:", err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
