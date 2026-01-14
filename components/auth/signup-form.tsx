//C:\gameon-v1\components\auth\signup-form.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { HiEye, HiEyeOff } from "react-icons/hi"; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SignUpForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [fieldError, setFieldError] = useState({ email: "", password: "" });
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // Track password input values in state
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');

  // Clear existing session when user navigates to signup page
  useEffect(() => {
    // If user is already logged in, sign them out to allow new signup
    if (session) {
      signOut({ redirect: false }).catch(console.error);
    }
  }, [session]); // Run when session changes


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldError({ email: "", password: "" });
    setGeneralError("");

    try {
      // Sign out any existing session first to ensure clean state
      if (session) {
        await signOut({ redirect: false });
        // Small delay to ensure session is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const form = e.target as HTMLFormElement;
      const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
      const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
      const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
      // Use state values instead of accessing form elements directly for password checks
      const password = passwordValue;
      const confirm = confirmPasswordValue;

      if (password !== confirm) {
        setFieldError({ ...fieldError, password: "Passwords do not match" });
        setIsLoading(false);
        return;
      }

      // Check if account already exists (including Google accounts)
      try {
        const checkUserResponse = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
        const checkUserData = await checkUserResponse.json();
        
        if (checkUserData.exists) {
          // Check if account was created with Google (provider is 'google' OR has no password)
          const isGoogleAccount = checkUserData.provider === 'google' || !checkUserData.hasPassword;
          if (isGoogleAccount) {
            setFieldError({ 
              ...fieldError, 
              email: "An account with this email already exists. It was created with Google. Please sign in using the 'Continue with Google' button or use a different email address." 
            });
          } else {
            setFieldError({ 
              ...fieldError, 
              email: "An account with this email already exists. Please sign in instead." 
            });
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking email:', err);
        // Continue with signup if check fails
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("email") || data.error?.toLowerCase().includes("account")) {
          setFieldError({ ...fieldError, email: data.error });
        } else {
          setGeneralError(data.error || "An unexpected error occurred during signup.");
        }
        setIsLoading(false);
        return;
      }

      // Wait a moment for user to be created
      await new Promise(resolve => setTimeout(resolve, 200));

      const signInResult = await signIn("credentials", { 
        email, 
        password, 
        redirect: false
      });

      if (signInResult?.error) {
        setGeneralError("Sign up successful, but automatic sign in failed. Please sign in manually.");
        setIsLoading(false);
      } else if (signInResult?.ok) {
        // Wait a moment for session to be created
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch session to check role and redirect accordingly
        try {
          const sessionResponse = await fetch("/api/auth/session");
          const sessionData = await sessionResponse.json();
          if (sessionData?.user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error('Error fetching session:', error);
          // Fallback to dashboard if session check fails
          router.push("/dashboard");
        }
      } else {
        setGeneralError("Sign up successful, but automatic sign in failed. Please sign in manually.");
        setIsLoading(false);
      }

    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Sign out any existing session first to ensure clean state
      if (session) {
        await signOut({ redirect: false });
        // Small delay to ensure session is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
      {/* ... (CardHeader and Google Sign In remain the same) ... */}
      <CardHeader className="text-center space-y-3">
        <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
        <CardDescription className="text-base text-gray-600">
          Join your local sports community
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          size="lg"
          variant="outline"
          className="w-full h-14 text-lg font-semibold border-2 hover:border-green-600 hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-4 shadow-md"
        >
          {isGoogleLoading ? (
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

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-500 uppercase">
            <span className="bg-white px-2">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              name="firstName"
              placeholder="First Name"
              required
              className="border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all rounded-md min-h-[44px] sm:min-h-0"
            />
            <Input
              name="lastName"
              placeholder="Last Name"
              required
              className="border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all rounded-md min-h-[44px] sm:min-h-0"
            />
          </div>

          <div className="relative">
            <Input
              name="email"
              type="email"
              placeholder="Email Address"
              required
              className={`border ${fieldError.email ? "border-red-500" : "border-gray-300"} focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all rounded-md min-h-[44px] sm:min-h-0`}
            />
            {fieldError.email && <p className="text-red-500 text-sm mt-1">{fieldError.email}</p>}
          </div>

          {/* --- Updated Password Input --- */}
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              // Ensure ample padding on the right for the icon
              className={`border ${fieldError.password ? "border-red-500" : "border-gray-300"} focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all rounded-md pr-10 min-h-[44px] sm:min-h-0`}
            />
            {/* Conditionally render the icon only if there is a value */}
            {passwordValue && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-green-600 w-5 h-5" // Added size classes
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* Ensure only one component is returned by the condition */}
                {showPassword ? <HiEyeOff /> : <HiEye/>}
              </span>
            )}
            {fieldError.password && <p className="text-red-500 text-sm mt-1">{fieldError.password}</p>}
          </div>

          {/* --- Updated Confirm Password Input --- */}
          <div className="relative">
            <Input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              required
              value={confirmPasswordValue} // Control value with state
              onChange={(e) => setConfirmPasswordValue(e.target.value)} // Update state on change
              className="border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all rounded-md pr-10 min-h-[44px] sm:min-h-0"
            />
            {/* Conditionally render the icon only if there is a value */}
            {confirmPasswordValue && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-green-600"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <HiEyeOff /> : <HiEye />}
              </span>
            )}
          </div>
          
          {/* ... (Rest of the form remains the same) ... */}
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 transition-colors rounded-md shadow-md"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          {generalError && <p className="text-center text-sm text-red-500 mt-2">{generalError}</p>}
        </form>

        <p className="text-center text-xs text-gray-500 mt-4 px-4">
          By continuing, you agree to our{" "}
          <Link href="/privacy" className="text-green-600 hover:text-green-700 hover:underline font-medium">
            Privacy Policy
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
