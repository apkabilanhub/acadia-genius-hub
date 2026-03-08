import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import PlagiarismCheck from "@/components/PlagiarismCheck";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCheck, Clock, CheckCircle2, FileText, BrainCircuit, MessageSquare,
  Download, Sparkles, AlertTriangle, ThumbsUp, ThumbsDown, ChevronRight,
} from "lucide-react";
import { mockProjects, defaultEvaluationCriteria, vivaQuestions, getStatusColor, getStatusLabel } from "@/lib/mock-data";
import type { EvaluationCriteria } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const assignedProjects = mockProjects.filter((_, i) => i < 4);

export default function FacultyDashboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(defaultEvaluationCriteria);
  const [comment, setComment] = useState("");

  const project = assignedProjects.find((p) => p.id === selectedProject);
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const updateScore = (index: number, score: number) => {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, score } : c)));
  };

  if (selectedProject && project) {
    return (
      <DashboardLayout role="faculty">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => setSelectedProject(null)} className="hover:text-foreground transition-colors">
              Assigned Projects
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{project.id}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{project.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>By {project.studentName}</span>
                <span>•</span>
                <span>{project.department}</span>
                <Badge className={cn("text-[10px]", getStatusColor(project.status))}>{getStatusLabel(project.status)}</Badge>
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
                <h3 className="font-heading text-sm font-semibold mb-2">Abstract</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{project.abstract}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="font-heading text-sm font-semibold">Project Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Domain</span><span className="text-foreground">{project.domain}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Methodology</span><span className="text-foreground">{project.methodology}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Guide</span><span className="text-foreground">{project.guideName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Versions</span><span className="text-foreground">v{project.versions}</span></div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="font-heading text-sm font-semibold">Uploaded Files</h3>
                  <div className="space-y-2">
                    {project.files.map((file) => (
                      <div key={file.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2"><Download className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-semibold mb-2">Technology Stack</h3>
                <div className="flex flex-wrap gap-2">{project.techStack.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}</div>
              </div>
            </TabsContent>

            <TabsContent value="ai-analysis" className="mt-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-sm font-semibold text-foreground">AI-Generated Summary</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This project implements a {project.domain.toLowerCase()} solution using {project.techStack.slice(0, 3).join(", ")}. 
                  The approach demonstrates strong technical implementation with a well-structured architecture. 
                  Key strengths include innovative problem-solving and practical real-world application. 
                  Areas for improvement include more comprehensive testing and better documentation of edge cases.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Innovation Score</p>
                  <p className="font-heading text-3xl font-bold text-primary">{project.innovationScore || 78}%</p>
                  <Badge className="mt-2 bg-success/10 text-success text-[10px]">Above Average</Badge>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Difficulty Score</p>
                  <p className="font-heading text-3xl font-bold text-foreground">{project.difficultyScore || 72}%</p>
                  <Badge className="mt-2 bg-info/10 text-info text-[10px]">Moderate-High</Badge>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">AI Auto-Grade</p>
                  <p className="font-heading text-3xl font-bold text-foreground">{project.aiGrade || 75}/100</p>
                  <Badge className="mt-2 bg-warning/10 text-warning text-[10px]">Suggested Range: 70-85</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-heading text-sm font-semibold">AI Insights</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <ThumbsUp className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">Strong use of modern tech stack with well-integrated components</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ThumbsUp className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">Novel approach to problem domain with clear practical application</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">Documentation could include more detailed architecture diagrams</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ThumbsDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">Limited test coverage — recommend adding integration tests</p>
                  </div>
                </div>
              </div>

              <PlagiarismCheck
                title={project.title}
                abstract={project.abstract}
                techStack={project.techStack}
                domain={project.domain}
                methodology={project.methodology}
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
                    <Slider
                      value={[c.score]}
                      max={c.maxScore}
                      step={1}
                      onValueChange={(val) => updateScore(i, val[0])}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Faculty Comments
                </h3>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add evaluation comments, suggestions for improvement..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Evaluation submitted!")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit Evaluation
                </Button>
                <Button variant="outline" onClick={() => toast.info("Revision request sent to student.")}>
                  Request Revision
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="viva" className="mt-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-sm font-semibold text-foreground">AI-Generated Viva Questions</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Generated based on project report analysis and domain knowledge</p>
                <div className="space-y-3">
                  {vivaQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-card p-3 border border-border">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{q.question}</p>
                        <Badge
                          className={cn(
                            "mt-1 text-[10px]",
                            q.difficulty === "Easy" && "bg-success/10 text-success",
                            q.difficulty === "Medium" && "bg-warning/10 text-warning",
                            q.difficulty === "Hard" && "bg-destructive/10 text-destructive"
                          )}
                        >
                          {q.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4">
                  <Sparkles className="mr-2 h-3 w-3" />
                  Generate More Questions
                </Button>
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
          <StatCard label="Assigned Projects" value={4} icon={ClipboardCheck} />
          <StatCard label="Pending Review" value={2} change="2 awaiting" changeType="neutral" icon={Clock} />
          <StatCard label="Evaluated" value={2} change="50% complete" changeType="positive" icon={CheckCircle2} />
          <StatCard label="Avg. Score Given" value="86" icon={FileText} />
        </div>

        <h2 className="font-heading text-lg font-semibold">Assigned Projects</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {assignedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project.id)} showScores />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
