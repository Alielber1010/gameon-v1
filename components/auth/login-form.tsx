// components/auth/login-form.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"google" | "email">("google");
  const [error, setError] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");

  // Check for error in URL params (from OAuth redirects and ban redirects)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const emailParam = searchParams.get("email");
    
    if (errorParam === "OAuthAccountNotLinked") {
      setError("An account with this email already exists. Please sign in with your email and password, or use a different Google account.");
    } else if (errorParam === "OAuthSignin" || errorParam === "OAuthCallback" || errorParam === "OAuthCreateAccount") {
      setError("There was a problem signing in with Google. Please try again.");
    } else if (errorParam === "AccountBanned" || errorParam === "AccessDenied") {
      // For AccessDenied, it might be a ban - check if we have email
      // For AccountBanned, definitely show ban modal
      const shouldCheckBan = errorParam === "AccountBanned" || emailParam;
      
      if (shouldCheckBan && emailParam) {
        // Fetch ban reason if we have email
        fetch(`/api/users/ban-info?email=${encodeURIComponent(emailParam)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.banReason) {
              setBanReason(data.banReason);
            } else {
              setBanReason("Your account has been permanently banned for violating the GameOn policies.");
            }
            setShowBanModal(true);
          })
          .catch(() => {
            setBanReason("Your account has been permanently banned for violating the GameOn policies.");
            setShowBanModal(true);
          });
      } else {
        // No email provided, show generic message
        setBanReason("Your account has been permanently banned for violating the GameOn policies.");
        setShowBanModal(true);
      }
    } else if (errorParam === "AccessDenied") {
      // Check if it might be a ban issue
      if (emailParam) {
        fetch(`/api/users/ban-info?email=${encodeURIComponent(emailParam)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.banReason) {
              setBanReason(data.banReason);
              setShowBanModal(true);
            }
          })
          .catch(() => {
            // Not a ban issue, ignore
          });
      }
    } else if (errorParam) {
      setError("An error occurred during sign in. Please try again.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    // Redirect to dashboard - middleware will redirect admins to /admin automatically
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // Always check if user is banned when there's an error
      // This handles both AccountBanned and CredentialsSignin errors
      if (email) {
        try {
          const banResponse = await fetch(`/api/users/ban-info?email=${encodeURIComponent(email)}`);
          const banData = await banResponse.json();
          if (banData.success && banData.banReason) {
            // User is banned, show ban modal
            setBanReason(banData.banReason);
            setShowBanModal(true);
            setError("");
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error checking ban status:', err);
        }
      }
      
      // Not banned or couldn't check, show invalid credentials error
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
    } else if (result?.ok) {
      // Fetch session to check role and redirect accordingly
      try {
        const session = await fetch("/api/auth/session").then(res => res.json());
        if (session?.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        // Fallback to dashboard if session check fails
        router.push("/dashboard");
      }
    }
  };

  return (
    <>
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
      <CardHeader className="text-center space-y-3">
        <CardTitle className="text-3xl font-bold text-gray-900">Welcome to GameOn</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Sign in to join pickup games near you
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Google Button - Always Primary */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          size="lg"
          variant="outline"
          className="w-full h-14 text-lg font-semibold border-2 hover:border-green-600 hover:bg-green-50 flex items-center justify-center gap-4 shadow-md"
        >
          {isLoading && mode === "google" ? (
            <>Signing in...</>
          ) : (
            <>
              <FcGoogle className="w-7 h-7" />
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">or</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                className="pl-10 pr-10"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading && mode === "email" ? "Signing in..." : "Sign in with Email"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/signup" className="text-green-600 font-medium hover:underline">
            Sign up
          </a>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </CardContent>
    </Card>

    {/* Ban Notice Modal */}
    <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            Account Banned
          </DialogTitle>
          <DialogDescription className="text-base">
            Your account has been permanently suspended.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-800">Account Suspended</h3>
                  <p className="text-sm text-red-700 whitespace-pre-line">
                    {banReason || "Your account has been permanently banned for violating the GameOn policies."}
                  </p>
                </div>
              </div>
            </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Need Help?</h4>
              <p className="text-sm text-gray-700">
                If you believe this ban was issued in error or have questions about your account status, 
                please contact our support team:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <a 
                  href="mailto:gamon9966@gmail.com" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  gamon9966@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button 
              onClick={() => setShowBanModal(false)}
              className="w-full"
            >
              I Understand
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}