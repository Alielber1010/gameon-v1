// components/auth/login-form.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      setIsLoading(false);
      // NextAuth will handle errors and redirect back with ?error=
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
      <CardHeader className="text-center space-y-3">
        <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Sign in to find and join pickup games near you
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 hover:border-green-600 hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-4 shadow-md"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <FcGoogle className="w-7 h-7" />
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500 mt-8">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-green-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-green-600">
              Privacy Policy
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}