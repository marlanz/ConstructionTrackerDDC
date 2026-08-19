import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";
import { headers } from "next/headers";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is missing.");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

const getBaseURL = () => {
  if (
    process.env.BETTER_AUTH_URL &&
    process.env.BETTER_AUTH_URL.startsWith("https")
  ) {
    return process.env.BETTER_AUTH_URL;
  }
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "http://localhost:3000";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

const resolvedBaseURL = getBaseURL();
const resolvedTrustedOrigins = ["http://localhost:3000"];

if (process.env.VERCEL_URL) {
  resolvedTrustedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.BETTER_AUTH_URL) {
  resolvedTrustedOrigins.push(process.env.BETTER_AUTH_URL);
}

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  baseURL: resolvedBaseURL,
  trustedOrigins: resolvedTrustedOrigins,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "SUPERVISOR",
        input: false, // Prevents setting own role via generic updateUser flow
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },
  plugins: [nextCookies()],
});

/**
 * Server-side helper to get the currently authenticated user with role.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}
