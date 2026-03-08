import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle2, Upload, Sparkles, TrendingUp, Trophy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  language: string;
  status: string;
  ai_grade: number | null;
  faculty_grade: number | null;
  plagiarism_score: number | null;
  created_at: string;
  classroom_id: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "submitted": return "bg-info/10 text-info";
    case "under_review": return "bg-warning/10 text-warning";
    case "revision_requested": return "bg-destructive/10 text-destructive";
    case "approved": return "bg-success/10 text-success";
    case "rejected": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Student";
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      setSubmissions(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const total = submissions.length;
  const underReview = submissions.filter(s => s.status === "under_review" || s.status === "submitted").length;
  const approved = submissions.filter(s => s.status === "approved").length;
  const avgAiScore = submissions.filter(s => s.ai_grade != null).length > 0
    ? (submissions.filter(s => s.ai_grade != null).reduce((sum, s) => sum + (s.ai_grade || 0), 0) / submissions.filter(s => s.ai_grade != null).length).toFixed(1)
    : "—";

  const recentSubmissions = submissions.slice(0, 4);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's an overview of your academic projects</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Projects" value={loading ? "…" : total} change={`${total} submitted`} changeType="neutral" icon={FileText} />
          <StatCard label="Under Review" value={loading ? "…" : underReview} change="Awaiting evaluation" changeType="neutral" icon={Clock} />
          <StatCard label="Approved" value={loading ? "…" : approved} change={`${approved} cleared`} changeType="positive" icon={CheckCircle2} />
          <StatCard label="Avg. AI Score" value={loading ? "…" : avgAiScore} icon={Sparkles} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent Projects</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/student/scoreboard")}>
              <Trophy className="mr-2 h-4 w-4" />
              Scoreboard
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/student/submit")}>
              <Upload className="mr-2 h-4 w-4" />
              New Submission
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-foreground">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Submit your first project to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentSubmissions.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-5 space-y-3 transition-all hover:shadow-elegant hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{s.title}</h3>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>}
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", getStatusColor(s.status))}>{getStatusLabel(s.status)}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Language: <span className="text-foreground font-medium">{s.language}</span></span>
                  <span>Submitted: <span className="text-foreground font-medium">{new Date(s.created_at).toLocaleDateString()}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  {s.ai_grade != null && (
                    <div className="flex items-center gap-1 text-xs">
                      <Sparkles className="h-3 w-3 text-accent" />
                      <span className="font-medium text-foreground">AI: {s.ai_grade}</span>
                    </div>
                  )}
                  {s.faculty_grade != null && (
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="font-medium text-foreground">Faculty: {s.faculty_grade}</span>
                    </div>
                  )}
                  {s.plagiarism_score != null && (
                    <div className="flex items-center gap-1 text-xs">
                      <FileText className="h-3 w-3 text-warning" />
                      <span className="font-medium text-foreground">Originality: {(100 - s.plagiarism_score).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <button onClick={() => navigate("/student/submit")} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30">
            <div className="rounded-lg bg-primary/10 p-2.5"><Upload className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">Submit Project</p>
              <p className="text-xs text-muted-foreground">Upload your work</p>
            </div>
          </button>
          <button onClick={() => navigate("/student/scoreboard")} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30">
            <div className="rounded-lg bg-primary/10 p-2.5"><Trophy className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">Scoreboard</p>
              <p className="text-xs text-muted-foreground">View all scores & grades</p>
            </div>
          </button>
          <button onClick={() => navigate("/student/recommendations")} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30">
            <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Recommendations</p>
              <p className="text-xs text-muted-foreground">Discover project ideas</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
