import { betterAuth } from "better-auth"

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  socialProviders: {
    cognito: {
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      domain: process.env.COGNITO_DOMAIN!, // e.g., "spalf-spa.auth.us-east-1.amazoncognito.com"
      region: process.env.COGNITO_REGION || "us-east-1",
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  advanced: {
    cookiePrefix: "spalf",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
})

export type Session = typeof auth.$Infer.Session
