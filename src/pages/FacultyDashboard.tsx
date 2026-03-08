import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import PlagiarismCheck from "@/components/PlagiarismCheck";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCheck, Clock, CheckCircle2, FileText, BrainCircuit, MessageSquare,
  Download, Sparkles, AlertTriangle, ThumbsUp, ThumbsDown, ChevronRight,
} from "lucide-react";
import { defaultEvaluationCriteria, vivaQuestions } from "@/lib/mock-data";
import type { EvaluationCriteria } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  source_code: string;
  language: string;
  status: string;
  ai_grade: number | null;
  faculty_grade: number | null;
  plagiarism_score: number | null;
  ai_code_copy_score: number | null;
  faculty_comment: string | null;
  created_at: string;
  student_id: string;
  classroom_id: string;
  student_name?: string;
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

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(defaultEvaluationCriteria);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get faculty's classrooms
      const { data: classrooms } = await supabase
        .from("classrooms")
        .select("id")
        .eq("faculty_id", user.id);

      if (!classrooms || classrooms.length === 0) {
        setLoading(false);
        return;
      }

      const classroomIds = classrooms.map(c => c.id);

      // Get all submissions for those classrooms
      const { data: subs } = await supabase
        .from("project_submissions")
        .select("*")
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false });

      if (subs && subs.length > 0) {
        // Get student names
        const studentIds = [...new Set(subs.map(s => s.student_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach(p => { nameMap[p.user_id] = p.full_name; });

        setSubmissions(subs.map(s => ({ ...s, student_name: nameMap[s.student_id] || "Unknown" })));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const selected = submissions.find(s => s.id === selectedId);
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const updateScore = (index: number, score: number) => {
    setCriteria(prev => prev.map((c, i) => (i === index ? { ...c, score } : c)));
  };

  const handleSubmitEvaluation = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("project_submissions")
      .update({
        faculty_grade: totalScore,
        faculty_comment: comment,
        status: "approved",
      })
      .eq("id", selected.id);

    if (error) {
      toast.error("Failed to submit evaluation");
    } else {
      toast.success("Evaluation submitted!");
      setSubmissions(prev => prev.map(s => s.id === selected.id ? { ...s, faculty_grade: totalScore, faculty_comment: comment, status: "approved" } : s));
      setSelectedId(null);
      setCriteria(defaultEvaluationCriteria);
      setComment("");
    }
  };

  const pendingCount = submissions.filter(s => s.status === "submitted" || s.status === "under_review").length;
  const evaluatedCount = submissions.filter(s => s.faculty_grade != null).length;
  const avgScore = evaluatedCount > 0
    ? Math.round(submissions.filter(s => s.faculty_grade != null).reduce((sum, s) => sum + (s.faculty_grade || 0), 0) / evaluatedCount)
    : 0;

  if (selectedId && selected) {
    return (
      <DashboardLayout role="faculty">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => { setSelectedId(null); setCriteria(defaultEvaluationCriteria); setComment(""); }} className="hover:text-foreground transition-colors">
              Assigned Projects
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{selected.title}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{selected.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>By {selected.student_name}</span>
                <span>•</span>
                <span>{selected.language}</span>
                <Badge className={cn("text-[10px]", getStatusColor(selected.status))}>{getStatusLabel(selected.status)}</Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
              <TabsTrigger value="viva">Viva Questions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description || "No description provided."}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-semibold mb-2">Source Code</h3>
                <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-auto max-h-64 font-mono">{selected.source_code}</pre>
              </div>
            </TabsContent>

            <TabsContent value="ai-analysis" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">AI Grade</p>
                  <p className="font-heading text-3xl font-bold text-primary">{selected.ai_grade ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Plagiarism Score</p>
                  <p className="font-heading text-3xl font-bold text-foreground">{selected.plagiarism_score != null ? `${selected.plagiarism_score}%` : "—"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">AI-Copy Score</p>
                  <p className="font-heading text-3xl font-bold text-foreground">{selected.ai_code_copy_score != null ? `${selected.ai_code_copy_score}%` : "—"}</p>
                </div>
              </div>

              <PlagiarismCheck
                title={selected.title}
                abstract={selected.description || ""}
                techStack={[selected.language]}
                domain={selected.language}
                methodology=""
              />
            </TabsContent>

            <TabsContent value="evaluate" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold">Rubric-Based Evaluation</h3>
                  <span className="font-heading text-lg font-bold text-primary">{totalScore}/{maxScore}</span>
                </div>
                {criteria.map((c, i) => (
                  <div key={c.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-foreground">{c.score}/{c.maxScore}</span>
                    </div>
                    <Slider value={[c.score]} max={c.maxScore} step={1} onValueChange={(val) => updateScore(i, val[0])} className="w-full" />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Faculty Comments
                </h3>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add evaluation comments..." rows={4} />
              </div>

              <div className="flex gap-3">
                <Button className="gradient-primary text-primary-foreground" onClick={handleSubmitEvaluation}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Submit Evaluation
                </Button>
                <Button variant="outline" onClick={async () => {
                  await supabase.from("project_submissions").update({ status: "revision_requested", faculty_comment: comment }).eq("id", selected.id);
                  toast.info("Revision request sent");
                  setSubmissions(prev => prev.map(s => s.id === selected.id ? { ...s, status: "revision_requested" } : s));
                }}>
                  Request Revision
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="viva" className="mt-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-sm font-semibold text-foreground">AI-Generated Viva Questions</h3>
                </div>
                <div className="space-y-3">
                  {vivaQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-card p-3 border border-border">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{q.question}</p>
                        <Badge className={cn("mt-1 text-[10px]",
                          q.difficulty === "Easy" && "bg-success/10 text-success",
                          q.difficulty === "Medium" && "bg-warning/10 text-warning",
                          q.difficulty === "Hard" && "bg-destructive/10 text-destructive"
                        )}>{q.difficulty}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and evaluate assigned academic projects</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Submissions" value={loading ? "…" : submissions.length} icon={ClipboardCheck} />
          <StatCard label="Pending Review" value={loading ? "…" : pendingCount} change={`${pendingCount} awaiting`} changeType="neutral" icon={Clock} />
          <StatCard label="Evaluated" value={loading ? "…" : evaluatedCount} change={submissions.length > 0 ? `${Math.round((evaluatedCount / submissions.length) * 100)}% complete` : ""} changeType="positive" icon={CheckCircle2} />
          <StatCard label="Avg. Score Given" value={loading ? "…" : avgScore} icon={FileText} />
        </div>

        <h2 className="font-heading text-lg font-semibold">Student Submissions</h2>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-foreground">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create a classroom and share the join code with students</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="rounded-xl border border-border bg-card p-5 text-left space-y-3 transition-all hover:shadow-elegant hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">By {s.student_name} • {s.language}</p>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", getStatusColor(s.status))}>{getStatusLabel(s.status)}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {s.ai_grade != null && <span>AI: <span className="text-foreground font-medium">{s.ai_grade}</span></span>}
                  {s.faculty_grade != null && <span>Faculty: <span className="text-foreground font-medium">{s.faculty_grade}</span></span>}
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
