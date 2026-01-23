"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/package/ui/button";
import { Input } from "@/package/ui/input";
import { Label } from "@/package/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/package/ui/card";
import { useAuth } from "@/package/auth";

export function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmSignUp, resendVerificationCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await confirmSignUp({ email, code });
      setSuccess("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const authError = err as { message?: string };
      setError(
        authError.message || "Failed to verify email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      await resendVerificationCode(email);
      setSuccess("A new verification code has been sent to your email.");
    } catch (err) {
      const authError = err as { message?: string };
      setError(authError.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification code to your email address. Enter it
          below to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={isSubmitting}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify email"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Didn't receive the code? Resend"}
          </button>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          <Link href="/login" className="font-medium underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
