"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (signUpError) {
          setError(signUpError.message || "Failed to sign up");
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message || "Invalid credentials");
          setLoading(false);
          return;
        }
      }

      router.push("/projects");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/projects",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-900 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
            <HardHat className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "Create an Account" : "Sign In to ConstructionTracker"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your details to get started"
              : "Enter your email and password to access your projects"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Processing..."
              ) : isSignUp ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              Google
            </Button>
          </CardContent>

          <CardFooter className="justify-center border-t border-zinc-100 dark:border-zinc-800/50 py-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs text-zinc-600 hover:text-zinc-900 underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
