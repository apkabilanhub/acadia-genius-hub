import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail, ShieldAlert, CheckCircle2, GraduationCap, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith("@srmist.edu.in")) {
      toast({ title: "Access Denied", description: "Only @srmist.edu.in emails allowed.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
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
            AI-powered academic project evaluation platform exclusively for SRM Institute of Science & Technology.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-xs text-primary-foreground/80 backdrop-blur-sm border border-primary-foreground/10">
            <Lock className="h-3 w-3" />
            Restricted to @srmist.edu.in accounts only
          </div>
        </div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your SRMIST email to receive a password reset link
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Check Your Email</p>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px]">
                    We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {isEmailBlocked && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
                  <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Access Restricted</p>
                    <p className="text-xs text-destructive/80 mt-0.5">
                      Only <strong>@srmist.edu.in</strong> email addresses can reset passwords on this platform.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full h-11 gradient-primary text-primary-foreground font-medium"
                  disabled={submitting || isEmailBlocked}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>

              <Button variant="ghost" className="w-full" asChild>
                <Link to="/auth">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
