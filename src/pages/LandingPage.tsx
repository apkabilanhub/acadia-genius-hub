import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, ClipboardCheck, Building2, Sparkles, BarChart3,
  FileText, BrainCircuit, Shield, ArrowRight, ChevronRight, Zap,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI-Powered Evaluation",
    description: "Automated grading, plagiarism detection, innovation scoring, and intelligent viva question generation.",
  },
  {
    icon: FileText,
    title: "Structured Submissions",
    description: "Drag-and-drop uploads with version control, status tracking, and multi-file support.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time dashboards with department performance, evaluation rates, and AI innovation rankings.",
  },
  {
    icon: Sparkles,
    title: "Smart Recommendations",
    description: "AI suggests project ideas based on department, tech trends, and student interests.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure authentication with Student, Faculty, and Admin roles with personalized dashboards.",
  },
  {
    icon: Zap,
    title: "Real-Time Notifications",
    description: "Stay updated on submission status, evaluation progress, and revision requests.",
  },
];

const roles = [
  {
    icon: GraduationCap,
    title: "Student",
    description: "Submit projects, track status, get AI recommendations",
    path: "/student",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ClipboardCheck,
    title: "Faculty",
    description: "Evaluate projects, AI analysis, rubric grading",
    path: "/faculty",
    color: "bg-success/10 text-success",
  },
  {
    icon: Building2,
    title: "Admin",
    description: "Manage users, departments, analytics",
    path: "/admin",
    color: "bg-warning/10 text-warning",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <BrainCircuit className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">ProjectHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#roles">Dashboards</a>
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground shadow-glow" asChild>
              <Link to="/student">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(234_89%_64%/0.08),transparent_60%)]" />
        <div className="container mx-auto px-6 py-24 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3 w-3" />
            AI-Powered Project Evaluation for SRM Students
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-[1.1]">
            Evaluate Academic Projects with{" "}
            <span className="gradient-primary bg-clip-text text-transparent">AI Intelligence</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-base text-muted-foreground leading-relaxed">
            A comprehensive SaaS platform for universities to manage project submissions, 
            automate evaluations with AI, and gain deep insights into academic performance.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow" asChild>
              <Link to="/student">
                Explore as Student
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/faculty">
                Faculty Portal
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Dashboard Preview Cards */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto" id="roles">
            {roles.map((role) => (
              <Link
                key={role.title}
                to={role.path}
                className="group rounded-xl border border-border bg-card p-5 text-left transition-all hover:shadow-elegant hover:border-primary/30"
              >
                <div className={`inline-flex rounded-lg p-2.5 ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-heading text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {role.title} Portal
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Everything You Need to Manage Academic Projects
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
              From submission to evaluation — powered by advanced AI capabilities
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-elegant">
                <div className="inline-flex rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-heading text-sm font-semibold text-card-foreground">{feature.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="rounded-2xl gradient-primary p-12 max-w-3xl mx-auto shadow-glow">
            <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
              Ready to Transform Academic Evaluation?
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/80 max-w-md mx-auto">
              Join universities already using SRM Project Management to streamline project management and evaluation.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/admin">Admin Demo</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/student">Student Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
              <BrainCircuit className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">SRM Project Management</span>
          </div>
          <p>© 2026 SRM Project Management. AI-Powered Academic Project Management.</p>
        </div>
      </footer>
    </div>
  );
}
