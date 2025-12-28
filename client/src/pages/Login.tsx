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

type AuthMode = "signin" | "signup" | "verify";

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const getTitle = () => {
    switch (mode) {
      case "signup":
        return "Create Account";
      case "verify":
        return "Verify Your Email";
      default:
        return "Welcome Back";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "signup":
        return "Enter your details to create a new account";
      case "verify":
        return "Enter the 6-digit code sent to your email";
      default:
        return "Sign in to access your IPTV subscription";
    }
  };
  
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Tv className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">IPTV Premium</h1>
            <p className="text-muted-foreground mt-2">Your gateway to unlimited entertainment</p>
          </div>
          
          {/* Auth Card */}
          <Card className="card-hover border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{getTitle()}</CardTitle>
              <CardDescription>{getDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                  {message}
                </div>
              )}
              
              {mode === "signin" && renderSignInForm()}
              {mode === "signup" && renderSignUpForm()}
              {mode === "verify" && renderVerifyForm()}
            </CardContent>
          </Card>
          
          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Fast Streaming</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Secure Access</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Global Content</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} IPTV Premium. All rights reserved.</p>
      </footer>
    </div>
  );
}
