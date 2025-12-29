import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_ENDPOINTS } from "@/const";
import { Tv, Shield, Zap, Globe, Loader2, ArrowLeft } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthMode = "signin" | "signup" | "verify" | "forgot-password" | "reset-password";

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(AUTH_ENDPOINTS.signIn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setMode("verify");
          setMessage("Please verify your email to continue.");
        } else {
          setError(data.error || "Sign in failed");
        }
        return;
      }

      // Success - reload to get authenticated state
      window.location.href = "/";
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(AUTH_ENDPOINTS.signUp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sign up failed");
        return;
      }

      // Success - switch to verification mode
      setMode("verify");
      setMessage(data.message || "Verification code sent to your email");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(AUTH_ENDPOINTS.verifyOTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      // Success - switch to sign in mode
      setMode("signin");
      setMessage("Email verified! Please sign in.");
      setOtp("");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(AUTH_ENDPOINTS.forgotPasswordOTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset code");
        return;
      }

      setMode("reset-password");
      setMessage(data.message || "Reset code sent to your email");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit reset code");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(AUTH_ENDPOINTS.resetPasswordOTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setMode("signin");
      setMessage("Password reset successfully! Please sign in.");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setResetEmail("");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(AUTH_ENDPOINTS.resendOTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        return;
      }

      setMessage(data.message || "Verification code sent");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSignInForm = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <Button 
        type="submit"
        className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
      
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setMode("forgot-password");
            setError("");
            setMessage("");
            setResetEmail("");
          }}
          className="text-sm text-primary hover:underline"
          disabled={loading}
        >
          Forgot your password?
        </button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            New to IPTV Premium?
          </span>
        </div>
      </div>
      
      <Button 
        type="button"
        variant="outline" 
        className="w-full h-12 text-base"
        onClick={() => {
          setMode("signup");
          setError("");
          setMessage("");
        }}
        disabled={loading}
      >
        Create an Account
      </Button>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
      </div>
      <Button 
        type="submit"
        className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
      
      <Button 
        type="button"
        variant="ghost" 
        className="w-full"
        onClick={() => {
          setMode("signin");
          setError("");
          setMessage("");
        }}
        disabled={loading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sign In
      </Button>
    </form>
  );

  const renderVerifyForm = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          We sent a verification code to
        </p>
        <p className="font-medium">{email}</p>
      </div>
      
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      <Button 
        type="submit"
        className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
        disabled={loading || otp.length !== 6}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Email"
        )}
      </Button>
      
      <div className="text-center">
        <Button 
          type="button"
          variant="link" 
          className="text-sm"
          onClick={handleResendOTP}
          disabled={loading}
        >
          Didn't receive the code? Resend
        </Button>
      </div>
      
      <Button 
        type="button"
        variant="ghost" 
        className="w-full"
        onClick={() => {
          setMode("signin");
          setError("");
          setMessage("");
          setOtp("");
        }}
        disabled={loading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sign In
      </Button>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email Address</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="you@example.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <Button 
        type="submit"
        className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
        disabled={loading || !resetEmail}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Reset Code"
        )}
      </Button>
      
      <Button 
        type="button"
        variant="ghost" 
        className="w-full"
        onClick={() => {
          setMode("signin");
          setError("");
          setMessage("");
          setResetEmail("");
        }}
        disabled={loading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sign In
      </Button>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Enter the reset code sent to
        </p>
        <p className="font-medium">{resetEmail}</p>
      </div>
      
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
      </div>
      
      <Button 
        type="submit"
        className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity"
        disabled={loading || otp.length !== 6 || !password || !confirmPassword}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
      
      <Button 
        type="button"
        variant="ghost" 
        className="w-full"
        onClick={() => {
          setMode("forgot-password");
          setError("");
          setMessage("");
          setOtp("");
          setPassword("");
          setConfirmPassword("");
        }}
        disabled={loading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </form>
  );

  const getTitle = () => {
    switch (mode) {
      case "signup":
        return "Create Account";
      case "verify":
        return "Verify Email";
      case "forgot-password":
        return "Reset Password";
      case "reset-password":
        return "Set New Password";
      default:
        return "Sign In";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "signup":
        return "Create your IPTV Premium account";
      case "verify":
        return "Enter the code we sent to your email";
      case "forgot-password":
        return "Enter your email to receive a reset code";
      case "reset-password":
        return "Enter the reset code and your new password";
      default:
        return "Welcome back to IPTV Premium";
    }
  };

  const renderForm = () => {
    switch (mode) {
      case "signup":
        return renderSignUpForm();
      case "verify":
        return renderVerifyForm();
      case "forgot-password":
        return renderForgotPasswordForm();
      case "reset-password":
        return renderResetPasswordForm();
      default:
        return renderSignInForm();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      {/* Main Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/50 rounded-lg">
              <Tv className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          {renderForm()}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-8 text-center">
        © {new Date().getFullYear()} IPTV Premium. All rights reserved.
      </p>
    </div>
  );
}
