import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import clientPromise from "@/lib/db/mongodb";

const client = await clientPromise;
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
    return "https://construction-tracker-ddc.vercel.app";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

const resolvedBaseURL = getBaseURL();
const resolvedTrustedOrigins = [
  "http://localhost:3000",
  "https://construction-tracker-ddc.vercel.app",
];

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
 * Deduplicated per-request via React cache().
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
});
