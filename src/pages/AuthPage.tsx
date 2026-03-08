import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Eye, EyeOff, Loader2, ShieldAlert, CheckCircle2, GraduationCap, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/mock-data";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, user, role: userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const emailValidation = useMemo(() => {
    if (!email) return { status: "empty" as const, message: "" };
    if (email.includes("@") && !email.toLowerCase().endsWith("@srmist.edu.in")) {
      return { status: "invalid" as const, message: "Only @srmist.edu.in emails are allowed" };
    }
    if (email.toLowerCase().endsWith("@srmist.edu.in")) {
      return { status: "valid" as const, message: "SRMIST email verified" };
    }
    return { status: "typing" as const, message: "" };
  }, [email]);

  const isEmailBlocked = emailValidation.status === "invalid";

  // Redirect if already logged in
  if (user && userRole) {
    const path = userRole === "student" ? "/student" : userRole === "faculty" ? "/faculty" : "/admin";
    navigate(path, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.toLowerCase().endsWith("@srmist.edu.in")) {
      toast({ title: "Access Denied", description: "Only @srmist.edu.in email addresses can access this platform.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName, role);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Welcome to ProjectHub! Please verify your email." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden gradient-primary items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.3),transparent_70%)]" />
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-primary-foreground leading-tight">
            ProjectHub
          </h2>
          <p className="text-sm text-primary-foreground/70 leading-relaxed">
            AI-powered academic project evaluation platform exclusively for SRM Institute of Science & Technology students and faculty.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-xs text-primary-foreground/80 backdrop-blur-sm border border-primary-foreground/10">
            <Lock className="h-3 w-3" />
            Restricted to @srmist.edu.in accounts only
          </div>
        </div>
        {/* Decorative shapes */}
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isSignUp ? "Join ProjectHub" : "Sign in to ProjectHub"}
            </p>
          </div>

          {/* Email restriction banner */}
          {isEmailBlocked && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Access Restricted</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  This platform is exclusively for SRMIST members. Please use your <strong>@srmist.edu.in</strong> email address.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Aarav Patel"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SRM Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@srmist.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={cn(
                    "h-11 pr-10 transition-colors",
                    isEmailBlocked && "border-destructive focus-visible:ring-destructive",
                    emailValidation.status === "valid" && "border-success focus-visible:ring-success"
                  )}
                />
                {emailValidation.status === "valid" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-fade-in" />
                )}
                {isEmailBlocked && (
                  <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive animate-fade-in" />
                )}
              </div>
              {emailValidation.message && (
                <p className={cn(
                  "text-[11px] font-medium animate-fade-in",
                  isEmailBlocked ? "text-destructive" : "text-success"
                )}>
                  {emailValidation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gradient-primary text-primary-foreground font-medium"
              disabled={submitting || isEmailBlocked}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or continue with</span></div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
                extraParams: { hd: "srmist.edu.in" },
              });
              if (error) {
                toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
              }
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google (@srmist.edu.in)
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <p className="text-center text-[11px] text-muted-foreground/60">
            By signing in, you agree to SRMIST's academic integrity policies.
          </p>
        </div>
      </div>
    </div>
  );
}
