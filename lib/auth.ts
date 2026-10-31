import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const googleId = process.env.AUTH_GOOGLE_ID?.replace(/^["']|["']$/g, "").trim() || "";
const googleSecret = process.env.AUTH_GOOGLE_SECRET?.replace(/^["']|["']$/g, "").trim() || "";
const isGoogleConfigured = Boolean(googleId) && Boolean(googleSecret);
const isDev = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(isGoogleConfigured
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
            authorization: {
              params: {
                scope: "openid email profile",
                prompt: "select_account",
              },
            },
          }),
        ]
      : isDev
      ? [
          Credentials({
            id: "dev-login",
            name: "Local Dev Sign-In",
            credentials: {},
            async authorize() {
              return {
                id: "google-sub-local-developer-12345",
                name: "Rajan (Dev Mode)",
                email: "developer@example.invalid",
                image: "https://api.dicebear.com/7.x/bottts/svg?seed=standupflow",
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile && profile.sub) {
        token.sub = profile.sub;
      } else if (user && user.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
