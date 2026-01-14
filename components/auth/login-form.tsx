// components/auth/login-form.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
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
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
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
    setMode("google");
    
    try {
      // Dispose existing session ONLY when logging in (as per requirements)
      if (session) {
        await signOut({ redirect: false });
        // Wait to ensure session is cleared before new login
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Redirect to dashboard - middleware will redirect admins to /admin automatically
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true 
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setError("Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMode("email");

    try {
      // Dispose existing session ONLY when logging in (as per requirements)
      if (session) {
        await signOut({ redirect: false });
        // Wait to ensure session is cleared before new login
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // On failed credentials sign-in, use check-email to pick the right message
        // (avoids blocking valid sign-ins when check-email is stale/wrong)
        try {
          const checkUserResponse = await fetch(
            `/api/users/check-email?email=${encodeURIComponent(email)}`,
            { cache: "no-store" }
          );
          const checkUserData = await checkUserResponse.json();

          if (checkUserData?.success) {
            // Check for banned account
            if (checkUserData.isBanned) {
              try {
                const banResponse = await fetch(
                  `/api/users/ban-info?email=${encodeURIComponent(email)}`,
                  { cache: "no-store" }
                );
                const banData = await banResponse.json();
                setBanReason(
                  banData.success && banData.banReason
                    ? banData.banReason
                    : "Your account has been permanently banned for violating the GameOn policies."
                );
              } catch {
                setBanReason("Your account has been permanently banned for violating the GameOn policies.");
              }
              setShowBanModal(true);
              setError("");
              setIsLoading(false);
              return;
            }

            // Check if account was created with Google
            const isGoogleAccount = checkUserData.provider === 'google' || 
                                   (checkUserData.exists && !checkUserData.hasPassword);
            
            if (isGoogleAccount) {
              setError("An account with this email already exists and was created with Google. Please sign in using the 'Continue with Google' button above, or use a different email address.");
              setIsLoading(false);
              return;
            }

            // Check if account doesn't exist
            if (!checkUserData.exists) {
              setError("This account doesn't exist. Please check your email or sign up for a new account.");
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error checking account after failed sign-in:", err);
        }

        // Default: wrong password (or unable to disambiguate)
        setError("Incorrect password. Please try again.");
        setIsLoading(false);
      } else if (result?.ok) {
        // Login successful
        setIsLoading(false);
        
        // Redirect to dashboard - middleware will automatically redirect admins to /admin/dashboard
        // Use window.location for reliable redirect that ensures session is loaded
        window.location.href = "/dashboard";
      } else {
        // Unknown error - result is neither error nor ok
        setError("An error occurred during sign in. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in email sign in:', error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
      <CardHeader className="text-center space-y-3">
        <CardTitle className="text-3xl font-bold text-gray-900">Log In</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Sign in to your account to join pickup games near you
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
            className="w-full bg-green-600 hover:bg-green-700 text-base font-semibold"
          >
            {isLoading && mode === "email" ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-green-600 font-medium hover:underline">
            Sign up here
          </Link>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 sm:mt-8 px-4">
          By continuing, you agree to our{" "}
          <Link href="/privacy" className="text-green-600 hover:text-green-700 hover:underline font-medium">
            Privacy Policy
          </Link>
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