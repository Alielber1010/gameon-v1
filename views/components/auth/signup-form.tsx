"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setIsLoading(false);
      return;
    }

    // Auto-login after signup
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
      <CardHeader className="text-center space-y-3">
        <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Join your local sports community
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSignup} className="space-y-4">
          <Input name="name" placeholder="Full Name" required />
          <Input name="email" type="email" placeholder="Email Address" required />
          <Input name="password" type="password" placeholder="Password" required />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
