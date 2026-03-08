import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Sparkles, ShieldCheck, FileText, BarChart3, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, Code, BookOpen,
  ArrowLeft, Brain,
} from "lucide-react";
import { mockProjects, getStatusColor, getStatusLabel } from "@/lib/mock-data";
import type { Project } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const studentProjects = mockProjects.filter((_, i) => i < 3);

// Simulated score data per project
const projectScores: Record<string, {
  plagiarismScore: number;
  aiCodeCopyScore: number;
  codeOriginalityScore: number;
  methodologyScore: number;
  evaluationScore: number;
  aiGrade: number;
  facultyGrade: number | null;
  overallGrade: string;
  riskLevel: "low" | "moderate" | "high";
  breakdown: { criteria: string; score: number; max: number }[];
}> = {
  "PRJ-001": {
    plagiarismScore: 8,
    aiCodeCopyScore: 12,
    codeOriginalityScore: 92,
    methodologyScore: 88,
    evaluationScore: 87,
    aiGrade: 87,
    facultyGrade: 90,
    overallGrade: "A",
    riskLevel: "low",
    breakdown: [
      { criteria: "Innovation & Originality", score: 18, max: 20 },
      { criteria: "Technical Complexity", score: 22, max: 25 },
      { criteria: "Documentation Quality", score: 12, max: 15 },
      { criteria: "Implementation Quality", score: 21, max: 25 },
      { criteria: "Real-World Impact", score: 14, max: 15 },
    ],
  },
  "PRJ-002": {
    plagiarismScore: 15,
    aiCodeCopyScore: 22,
    codeOriginalityScore: 78,
    methodologyScore: 75,
    evaluationScore: 82,
    aiGrade: 82,
    facultyGrade: null,
    overallGrade: "B+",
    riskLevel: "moderate",
    breakdown: [
      { criteria: "Innovation & Originality", score: 16, max: 20 },
      { criteria: "Technical Complexity", score: 19, max: 25 },
      { criteria: "Documentation Quality", score: 11, max: 15 },
      { criteria: "Implementation Quality", score: 20, max: 25 },
      { criteria: "Real-World Impact", score: 12, max: 15 },
    ],
  },
  "PRJ-003": {
    plagiarismScore: 5,
    aiCodeCopyScore: 8,
    codeOriginalityScore: 95,
    methodologyScore: 90,
    evaluationScore: 0,
    aiGrade: 0,
    facultyGrade: null,
    overallGrade: "Pending",
    riskLevel: "low",
    breakdown: [
      { criteria: "Innovation & Originality", score: 0, max: 20 },
      { criteria: "Technical Complexity", score: 0, max: 25 },
      { criteria: "Documentation Quality", score: 0, max: 15 },
      { criteria: "Implementation Quality", score: 0, max: 25 },
      { criteria: "Real-World Impact", score: 0, max: 15 },
    ],
  },
};

const gradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-success";
  if (grade.startsWith("B")) return "text-primary";
  if (grade.startsWith("C")) return "text-warning";
  if (grade === "Pending") return "text-muted-foreground";
  return "text-destructive";
};

const riskBadge = {
  low: "bg-success/10 text-success border-success/20",
  moderate: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

function ScoreRing({ value, max = 100, size = 64, strokeWidth = 5, color = "text-primary" }: { value: number; max?: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", color)}
        />
      </svg>
      <span className={cn("absolute font-heading text-sm font-bold", color)}>{value}%</span>
    </div>
  );
}

export default function StudentScoreboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const project = studentProjects.find((p) => p.id === selectedProject);
  const scores = selectedProject ? projectScores[selectedProject] : null;

  if (selectedProject && project && scores) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => setSelectedProject(null)} className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Scoreboard
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{project.title}</span>
          </div>

          {/* Project header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{project.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>{project.department}</span>
                <Badge className={cn("text-[10px]", getStatusColor(project.status))}>{getStatusLabel(project.status)}</Badge>
                <Badge variant="outline" className={cn("text-[10px] capitalize", riskBadge[scores.riskLevel])}>
                  {scores.riskLevel} risk
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Overall Grade</p>
              <p className={cn("font-heading text-4xl font-bold", gradeColor(scores.overallGrade))}>{scores.overallGrade}</p>
            </div>
          </div>

          {/* Score cards row */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Plagiarism</p>
              <ScoreRing
                value={scores.plagiarismScore}
                color={scores.plagiarismScore <= 15 ? "text-success" : scores.plagiarismScore <= 35 ? "text-warning" : "text-destructive"}
              />
              <p className="text-[10px] text-muted-foreground">similarity found</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">AI Code Copy</p>
              <ScoreRing
                value={scores.aiCodeCopyScore}
                color={scores.aiCodeCopyScore <= 20 ? "text-success" : scores.aiCodeCopyScore <= 40 ? "text-warning" : "text-destructive"}
              />
              <p className="text-[10px] text-muted-foreground">AI-generated</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Code Original.</p>
              <ScoreRing value={scores.codeOriginalityScore} color="text-primary" />
              <p className="text-[10px] text-muted-foreground">unique code</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">AI Score</p>
              <ScoreRing value={scores.aiGrade} color="text-primary" />
              <p className="text-[10px] text-muted-foreground">auto-grade</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Faculty Score</p>
              {scores.facultyGrade ? (
                <>
                  <ScoreRing value={scores.facultyGrade} color="text-success" />
                  <p className="text-[10px] text-muted-foreground">evaluated</p>
                </>
              ) : (
                <>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">awaiting review</p>
                </>
              )}
            </div>
          </div>

          {/* Detailed breakdown */}
          <Tabs defaultValue="breakdown">
            <TabsList>
              <TabsTrigger value="breakdown" className="text-xs">
                <BarChart3 className="mr-1.5 h-3 w-3" />Evaluation Breakdown
              </TabsTrigger>
              <TabsTrigger value="integrity" className="text-xs">
                <ShieldCheck className="mr-1.5 h-3 w-3" />Integrity Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-sm font-semibold">Rubric Scores</h4>
                  <span className="font-heading text-lg font-bold text-primary">
                    {scores.breakdown.reduce((s, b) => s + b.score, 0)}/{scores.breakdown.reduce((s, b) => s + b.max, 0)}
                  </span>
                </div>
                {scores.breakdown.map((b) => (
                  <div key={b.criteria} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{b.criteria}</span>
                      <span className="text-muted-foreground font-mono text-xs">{b.score}/{b.max}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${b.max > 0 ? (b.score / b.max) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Score comparison */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-primary" />
                    <h4 className="font-heading text-sm font-semibold">AI Assessment</h4>
                  </div>
                  <p className="font-heading text-3xl font-bold text-primary">{scores.aiGrade}/100</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on automated analysis of project content, code quality, and innovation.</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <h4 className="font-heading text-sm font-semibold">Faculty Evaluation</h4>
                  </div>
                  {scores.facultyGrade ? (
                    <>
                      <p className="font-heading text-3xl font-bold text-success">{scores.facultyGrade}/100</p>
                      <p className="text-xs text-muted-foreground mt-1">Evaluated by {project.guideName} based on rubric criteria.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-heading text-xl font-bold text-muted-foreground">Awaiting</p>
                      <p className="text-xs text-muted-foreground mt-1">Your project is pending faculty evaluation.</p>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrity" className="mt-4 space-y-4">
              {/* Integrity summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Plagiarism</p>
                  <p className={cn(
                    "font-heading text-2xl font-bold",
                    scores.plagiarismScore <= 15 ? "text-success" : scores.plagiarismScore <= 35 ? "text-warning" : "text-destructive"
                  )}>
                    {scores.plagiarismScore}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {scores.plagiarismScore <= 15 ? "Acceptable" : scores.plagiarismScore <= 35 ? "Needs attention" : "High similarity"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
                  <Code className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI-Generated Code</p>
                  <p className={cn(
                    "font-heading text-2xl font-bold",
                    scores.aiCodeCopyScore <= 20 ? "text-success" : scores.aiCodeCopyScore <= 40 ? "text-warning" : "text-destructive"
                  )}>
                    {scores.aiCodeCopyScore}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {scores.aiCodeCopyScore <= 20 ? "Acceptable" : scores.aiCodeCopyScore <= 40 ? "Review needed" : "Excessive AI use"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Methodology</p>
                  <p className="font-heading text-2xl font-bold text-primary">{scores.methodologyScore}%</p>
                  <p className="text-[10px] text-muted-foreground">Original approach</p>
                </div>
              </div>

              <div className={cn(
                "rounded-xl border p-5",
                scores.riskLevel === "low" ? "border-success/20 bg-success/[0.02]" : "border-warning/20 bg-warning/[0.02]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {scores.riskLevel === "low" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <h4 className="font-heading text-sm font-semibold">
                    {scores.riskLevel === "low" ? "Good Standing" : "Review Recommended"}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {scores.riskLevel === "low"
                    ? "Your project demonstrates strong originality with minimal similarity to existing works. The code and methodology show genuine effort and understanding."
                    : "Some sections of your project show moderate similarity to existing works. Consider revising flagged areas and adding more original analysis to strengthen your submission."}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // Scoreboard overview
  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Project Scoreboard</h1>
          <p className="text-sm text-muted-foreground mt-1">View detailed scores, plagiarism reports, and evaluation results for all your projects</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-primary/10 p-2"><Trophy className="h-4 w-4 text-primary" /></div>
              <p className="text-sm font-medium text-foreground">Best Grade</p>
            </div>
            <p className="font-heading text-3xl font-bold text-success">A</p>
            <p className="text-xs text-muted-foreground mt-1">AI-Powered Smart Traffic Management</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-primary/10 p-2"><ShieldCheck className="h-4 w-4 text-primary" /></div>
              <p className="text-sm font-medium text-foreground">Avg Plagiarism</p>
            </div>
            <p className="font-heading text-3xl font-bold text-success">9.3%</p>
            <p className="text-xs text-muted-foreground mt-1">Across all projects — excellent</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-primary/10 p-2"><Sparkles className="h-4 w-4 text-primary" /></div>
              <p className="text-sm font-medium text-foreground">Avg AI Score</p>
            </div>
            <p className="font-heading text-3xl font-bold text-primary">84.5</p>
            <p className="text-xs text-muted-foreground mt-1">Auto-graded average</p>
          </div>
        </div>

        {/* Project score table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plagiarism</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Code %</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Score</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Faculty</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {studentProjects.map((p) => {
                  const s = projectScores[p.id];
                  if (!s) return null;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-none hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground text-sm leading-tight">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.id} • {p.department}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "font-heading font-bold text-sm",
                          s.plagiarismScore <= 15 ? "text-success" : s.plagiarismScore <= 35 ? "text-warning" : "text-destructive"
                        )}>
                          {s.plagiarismScore}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "font-heading font-bold text-sm",
                          s.aiCodeCopyScore <= 20 ? "text-success" : s.aiCodeCopyScore <= 40 ? "text-warning" : "text-destructive"
                        )}>
                          {s.aiCodeCopyScore}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-heading font-bold text-sm text-primary">{s.aiGrade || "—"}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-heading font-bold text-sm text-foreground">{s.facultyGrade || "—"}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn("font-heading font-bold text-lg", gradeColor(s.overallGrade))}>
                          {s.overallGrade}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={cn("text-[10px]", getStatusColor(p.status))}>{getStatusLabel(p.status)}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedProject(p.id)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
