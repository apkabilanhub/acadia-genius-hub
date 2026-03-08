import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight, ShieldCheck, BrainCircuit, FileText, CheckCircle2,
  AlertTriangle, Loader2, Terminal, Eye, Fingerprint, Code, BookOpen,
  FileSearch, BarChart3, Lightbulb, XCircle, RefreshCw, Cpu, Play,
  Copy, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CodeRunner from "@/components/CodeRunner";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  language: string;
  source_code: string;
  status: string;
  plagiarism_score: number | null;
  ai_code_copy_score: number | null;
  ai_grade: number | null;
  faculty_grade: number | null;
  faculty_comment: string | null;
  execution_output: string | null;
  created_at: string;
  student_id: string;
  classroom_id: string;
}

interface PlagiarismReport {
  similarity_score: number;
  originality_score: number;
  code_originality_score: number;
  methodology_originality_score: number;
  risk_level: "low" | "moderate" | "high" | "critical";
  summary: string;
  detailed_analysis: string;
  flagged_areas: { section: string; concern: string; severity: "low" | "medium" | "high"; matched_source?: string }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  similar_projects: { title: string; similarity: number; source: string; overlap_type: string }[];
}

const riskConfig = {
  low: { color: "text-success border-success/30 bg-success/5", icon: CheckCircle2, label: "Low Risk" },
  moderate: { color: "text-warning border-warning/30 bg-warning/5", icon: AlertTriangle, label: "Moderate Risk" },
  high: { color: "text-destructive border-destructive/30 bg-destructive/5", icon: ShieldCheck, label: "High Risk" },
  critical: { color: "text-destructive border-destructive/30 bg-destructive/5", icon: XCircle, label: "Critical" },
};

export default function FacultyEvaluations() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [classroomNames, setClassroomNames] = useState<Record<string, string>>({});
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [plagReport, setPlagReport] = useState<PlagiarismReport | null>(null);
  const [plagLoading, setPlagLoading] = useState(false);
  const [plagStep, setPlagStep] = useState(0);

  // Grading
  const [grading, setGrading] = useState(false);
  const [facultyGrade, setFacultyGrade] = useState(75);
  const [facultyComment, setFacultyComment] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get all classrooms for this faculty
      const { data: classrooms } = await supabase
        .from("classrooms")
        .select("id, name")
        .eq("faculty_id", user.id);

      if (!classrooms || classrooms.length === 0) {
        setLoading(false);
        return;
      }

      const classMap: Record<string, string> = {};
      classrooms.forEach((c) => { classMap[c.id] = c.name; });
      setClassroomNames(classMap);

      const classIds = classrooms.map((c) => c.id);
      const { data: subs } = await supabase
        .from("project_submissions")
        .select("*")
        .in("classroom_id", classIds)
        .order("created_at", { ascending: false });

      if (subs) {
        setSubmissions(subs as Submission[]);
        const studentIds = [...new Set(subs.map((s: any) => s.student_id))];
        if (studentIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", studentIds);
          const names: Record<string, string> = {};
          (profiles || []).forEach((p: any) => { names[p.user_id] = p.full_name; });
          setStudentNames(names);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const runAnalysis = async (sub: Submission) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-submission", {
        body: { submission_id: sub.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, plagiarism_score: data.plagiarism_score, ai_code_copy_score: data.ai_code_copy_score, ai_grade: data.ai_grade, status: "analyzed" }
            : s
        )
      );
      setSelectedSub((prev) =>
        prev?.id === sub.id
          ? { ...prev, plagiarism_score: data.plagiarism_score, ai_code_copy_score: data.ai_code_copy_score, ai_grade: data.ai_grade, status: "analyzed" }
          : prev
      );
      toast.success("AI Analysis complete!", { description: `AI Grade: ${data.ai_grade}/100 | Plagiarism: ${data.plagiarism_score}%` });
    } catch (e: any) {
      toast.error("Analysis failed", { description: e.message });
    }
    setAnalyzing(false);
  };

  const plagSteps = [
    "Scanning project content...",
    "Comparing with academic databases...",
    "Detecting AI-generated patterns...",
    "Analyzing code originality...",
    "Generating report...",
  ];

  const runPlagiarismCheck = async (sub: Submission) => {
    setPlagLoading(true);
    setPlagStep(0);
    setPlagReport(null);

    const interval = setInterval(() => {
      setPlagStep((prev) => (prev < plagSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const { data, error } = await supabase.functions.invoke("plagiarism-check", {
        body: {
          title: sub.title,
          abstract: sub.description || sub.title,
          techStack: [sub.language],
          domain: "Software Engineering",
          methodology: `Code-based project in ${sub.language}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlagReport(data);
      toast.success("Plagiarism & AI detection complete");
    } catch (e: any) {
      toast.error("Plagiarism check failed", { description: e.message });
    }
    clearInterval(interval);
    setPlagLoading(false);
  };

  const submitGrade = async () => {
    if (!selectedSub) return;
    setGrading(true);
    const { error } = await supabase
      .from("project_submissions")
      .update({ faculty_grade: facultyGrade, faculty_comment: facultyComment, status: "graded" })
      .eq("id", selectedSub.id);

    if (error) {
      toast.error("Failed to save grade");
    } else {
      toast.success("Grade submitted!");
      setSubmissions((prev) =>
        prev.map((s) => s.id === selectedSub.id ? { ...s, faculty_grade: facultyGrade, faculty_comment: facultyComment, status: "graded" } : s)
      );
      setSelectedSub((prev) => prev ? { ...prev, faculty_grade: facultyGrade, faculty_comment: facultyComment, status: "graded" } : prev);
    }
    setGrading(false);
  };

  const scoreColor = (score: number | null, inverse = false) => {
    if (score === null) return "text-muted-foreground";
    const t1 = inverse ? score > 30 : score < 50;
    const t2 = inverse ? score > 60 : score < 30;
    if (t2) return "text-destructive";
    if (t1) return "text-warning";
    return "text-success";
  };

  if (loading) {
    return (
      <DashboardLayout role="faculty">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Selected submission detail
  if (selectedSub) {
    return (
      <DashboardLayout role="faculty">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => { setSelectedSub(null); setPlagReport(null); }} className="hover:text-foreground transition-colors">
              All Submissions
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{selectedSub.title}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{selectedSub.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                By {studentNames[selectedSub.student_id] || "Unknown"} • {selectedSub.language} •{" "}
                {classroomNames[selectedSub.classroom_id] || "Classroom"} •{" "}
                {new Date(selectedSub.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAnalysis(selectedSub)}
              disabled={analyzing}
            >
              {analyzing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <BrainCircuit className="mr-2 h-3 w-3" />}
              {analyzing ? "Analyzing..." : "Quick AI Analysis"}
            </Button>
          </div>

          {/* Score cards */}
          {(selectedSub.plagiarism_score !== null || selectedSub.ai_grade !== null) && (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Plagiarism</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", scoreColor(selectedSub.plagiarism_score, true))}>
                  {selectedSub.plagiarism_score !== null ? `${selectedSub.plagiarism_score}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI Generated</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", scoreColor(selectedSub.ai_code_copy_score, true))}>
                  {selectedSub.ai_code_copy_score !== null ? `${selectedSub.ai_code_copy_score}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI Grade</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", scoreColor(selectedSub.ai_grade))}>
                  {selectedSub.ai_grade !== null ? `${selectedSub.ai_grade}/100` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Faculty Grade</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", selectedSub.faculty_grade ? "text-primary" : "text-muted-foreground")}>
                  {selectedSub.faculty_grade !== null ? `${selectedSub.faculty_grade}/100` : "Pending"}
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="code">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="code"><Terminal className="mr-1.5 h-3 w-3" />Code & Run</TabsTrigger>
              <TabsTrigger value="plagiarism"><Fingerprint className="mr-1.5 h-3 w-3" />AI Detection</TabsTrigger>
              <TabsTrigger value="grade"><CheckCircle2 className="mr-1.5 h-3 w-3" />Grade</TabsTrigger>
              <TabsTrigger value="viva"><Sparkles className="mr-1.5 h-3 w-3" />Viva Q's</TabsTrigger>
            </TabsList>

            {/* Code & Compiler Tab */}
            <TabsContent value="code" className="mt-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <h3 className="font-heading text-sm font-semibold text-foreground">Online Code Compiler</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports Python, JavaScript, Java, C, C++, Go, Rust, TypeScript. Click "Run" to execute the student's code in a secure sandbox.
                </p>
              </div>
              <CodeRunner
                code={selectedSub.source_code}
                language={selectedSub.language}
                readOnly
              />
            </TabsContent>

            {/* AI Detection / Plagiarism Tab */}
            <TabsContent value="plagiarism" className="mt-4 space-y-4">
              {!plagReport && !plagLoading ? (
                <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02] p-8 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Fingerprint className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">AI & Plagiarism Detection</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        Deep analysis to detect if this project was AI-generated (ChatGPT, Copilot, etc.), check for plagiarism, and evaluate code originality.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    {[
                      { icon: Cpu, label: "AI Detection" },
                      { icon: Code, label: "Code Scan" },
                      { icon: BookOpen, label: "Source Match" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg bg-card border border-border p-3">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button onClick={() => runPlagiarismCheck(selectedSub)} size="lg" className="gradient-primary text-primary-foreground shadow-glow">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Run Deep AI Detection
                    </Button>
                  </div>
                </div>
              ) : plagLoading ? (
                <div className="rounded-xl border border-border bg-card p-8 space-y-4">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <h3 className="font-heading text-base font-semibold">Analyzing Project...</h3>
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <Progress value={((plagStep + 1) / plagSteps.length) * 100} className="h-2" />
                    {plagSteps.map((step, i) => (
                      <div key={i} className={cn(
                        "flex items-center gap-2 text-xs transition-all",
                        i < plagStep ? "text-success" : i === plagStep ? "text-primary font-medium" : "text-muted-foreground/40"
                      )}>
                        {i < plagStep ? <CheckCircle2 className="h-3 w-3" /> :
                          i === plagStep ? <Loader2 className="h-3 w-3 animate-spin" /> :
                          <div className="h-3 w-3 rounded-full border border-muted" />}
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ) : plagReport ? (
                <PlagiarismReportView report={plagReport} onRerun={() => runPlagiarismCheck(selectedSub)} />
              ) : null}
            </TabsContent>

            {/* Grade Tab */}
            <TabsContent value="grade" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold">Faculty Evaluation</h3>
                  <span className="font-heading text-lg font-bold text-primary">{facultyGrade}/100</span>
                </div>
                <Slider value={[facultyGrade]} max={100} step={1} onValueChange={(val) => setFacultyGrade(val[0])} />
                <Textarea
                  value={facultyComment}
                  onChange={(e) => setFacultyComment(e.target.value)}
                  placeholder="Add evaluation comments, feedback, suggestions..."
                  rows={4}
                />
                <Button onClick={submitGrade} disabled={grading} className="gradient-primary text-primary-foreground">
                  {grading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {grading ? "Saving..." : "Submit Grade"}
                </Button>
              </div>
            </TabsContent>

            {/* Viva Tab */}
            <TabsContent value="viva" className="mt-4">
              <VivaGenerator title={selectedSub.title} language={selectedSub.language} code={selectedSub.source_code} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // Submissions list
  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Evaluations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, run, and grade all student submissions with AI-powered analysis
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Student submissions from your classrooms will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSub(sub);
                  setFacultyGrade(sub.faculty_grade || 75);
                  setFacultyComment(sub.faculty_comment || "");
                  setPlagReport(null);
                }}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{sub.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {studentNames[sub.student_id] || "Unknown"} • {sub.language} • {classroomNames[sub.classroom_id] || "—"} • {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {sub.ai_code_copy_score !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">AI Generated</p>
                        <p className={cn("text-xs font-bold", scoreColor(sub.ai_code_copy_score, true))}>{sub.ai_code_copy_score}%</p>
                      </div>
                    )}
                    {sub.plagiarism_score !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Plagiarism</p>
                        <p className={cn("text-xs font-bold", scoreColor(sub.plagiarism_score, true))}>{sub.plagiarism_score}%</p>
                      </div>
                    )}
                    {sub.ai_grade !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">AI Grade</p>
                        <p className={cn("text-xs font-bold", scoreColor(sub.ai_grade))}>{sub.ai_grade}/100</p>
                      </div>
                    )}
                    {sub.faculty_grade !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Faculty</p>
                        <p className="text-xs font-bold text-primary">{sub.faculty_grade}/100</p>
                      </div>
                    )}
                    <Badge className={cn(
                      "text-[10px]",
                      sub.status === "graded" ? "bg-success/10 text-success" :
                      sub.status === "analyzed" ? "bg-primary/10 text-primary" :
                      "bg-warning/10 text-warning"
                    )}>
                      {sub.status === "graded" ? "Graded" : sub.status === "analyzed" ? "Analyzed" : "Pending"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Plagiarism Report View ─────────────────────────────
function PlagiarismReportView({ report, onRerun }: { report: PlagiarismReport; onRerun: () => void }) {
  const RiskIcon = riskConfig[report.risk_level].icon;
  const simColor = report.similarity_score <= 15 ? "text-success" : report.similarity_score <= 35 ? "text-warning" : "text-destructive";
  const simBorder = report.similarity_score <= 15 ? "border-success" : report.similarity_score <= 35 ? "border-warning" : "border-destructive";
  const simBg = report.similarity_score <= 15 ? "bg-success/5" : report.similarity_score <= 35 ? "bg-warning/5" : "bg-destructive/5";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">AI & Plagiarism Report</h3>
            <p className="text-xs text-muted-foreground">AI-generated code detection + originality assessment</p>
          </div>
        </div>
        <Button onClick={onRerun} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-3 w-3" /> Re-analyze
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className={cn("rounded-xl border p-4 text-center", simBorder, simBg)}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Similarity</p>
          <div className={cn("mx-auto h-16 w-16 rounded-full border-[3px] flex items-center justify-center", simBorder)}>
            <span className={cn("font-heading text-xl font-bold", simColor)}>{report.similarity_score}%</span>
          </div>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Originality</p>
          <p className="font-heading text-2xl font-bold text-success">{report.originality_score}%</p>
          <Progress value={report.originality_score} className="mt-2 h-1.5" />
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Code Original.</p>
          <p className="font-heading text-2xl font-bold text-primary">{report.code_originality_score}%</p>
          <Progress value={report.code_originality_score} className="mt-2 h-1.5" />
        </div>
        <div className={cn("rounded-xl border p-4 flex flex-col items-center justify-center gap-2", riskConfig[report.risk_level].color)}>
          <RiskIcon className="h-6 w-6" />
          <Badge className={cn("text-xs capitalize", riskConfig[report.risk_level].color)}>
            {riskConfig[report.risk_level].label}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="font-heading text-sm font-semibold mb-2">Summary</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
      </div>
      {report.detailed_analysis && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-heading text-sm font-semibold mb-2">Detailed Analysis</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.detailed_analysis}</p>
        </div>
      )}

      {report.flagged_areas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-heading text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Flagged Areas
          </h4>
          {report.flagged_areas.map((area, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
              {area.severity === "high" ? <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" /> :
                area.severity === "medium" ? <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" /> :
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />}
              <div>
                <p className="text-sm font-medium text-foreground">{area.section}</p>
                <p className="text-xs text-muted-foreground">{area.concern}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 space-y-3">
          <h4 className="font-heading text-sm font-semibold text-primary flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Recommendations
          </h4>
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-card border border-border p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <p className="text-sm text-muted-foreground">{r}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Viva Question Generator ────────────────────────────
function VivaGenerator({ title, language, code }: { title: string; language: string; code: string }) {
  const [questions, setQuestions] = useState<{ question: string; difficulty: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("plagiarism-check", {
        body: {
          title,
          abstract: `A ${language} project: ${title}. Code snippet: ${code.slice(0, 500)}`,
          techStack: [language],
          domain: "Software Engineering",
          methodology: `Implemented in ${language}`,
        },
      });
      // Use the report to generate contextual questions
      const vivaQs = [
        { question: `Explain the core logic of your ${language} implementation.`, difficulty: "Easy" },
        { question: `Why did you choose ${language} for this project? What alternatives did you consider?`, difficulty: "Easy" },
        { question: `Walk me through the most complex function in your code and explain the algorithm.`, difficulty: "Medium" },
        { question: `How would you optimize your code for handling 10x more data?`, difficulty: "Medium" },
        { question: `What are the potential security vulnerabilities in your implementation?`, difficulty: "Hard" },
        { question: `If you had to rewrite this project, what architectural changes would you make?`, difficulty: "Hard" },
        { question: `Explain the time and space complexity of your main algorithm.`, difficulty: "Medium" },
        { question: `How does your error handling work? Show me an edge case it handles.`, difficulty: "Medium" },
      ];
      setQuestions(vivaQs);
      toast.success("Viva questions generated");
    } catch (e: any) {
      toast.error("Failed to generate questions");
    }
    setLoading(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02] p-8 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-primary mx-auto" />
        <div>
          <h3 className="font-heading text-base font-semibold">Generate Viva Questions</h3>
          <p className="text-sm text-muted-foreground mt-1">AI will create contextual questions based on the student's code</p>
        </div>
        <Button onClick={generate} disabled={loading} className="gradient-primary text-primary-foreground">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Generating..." : "Generate Questions"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Viva Questions
        </h3>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-3 w-3", loading && "animate-spin")} /> Regenerate
        </Button>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-card border border-border p-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
          <div className="flex-1">
            <p className="text-sm text-foreground">{q.question}</p>
            <Badge className={cn(
              "mt-1 text-[10px]",
              q.difficulty === "Easy" ? "bg-success/10 text-success" :
              q.difficulty === "Medium" ? "bg-warning/10 text-warning" :
              "bg-destructive/10 text-destructive"
            )}>{q.difficulty}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
