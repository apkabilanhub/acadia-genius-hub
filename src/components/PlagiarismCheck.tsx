import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, ShieldAlert, Loader2, AlertTriangle, CheckCircle2, XCircle,
  ExternalLink, FileSearch, BarChart3, Lightbulb, RefreshCw, Fingerprint,
  BookOpen, Code, Cpu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface PlagiarismCheckProps {
  title: string;
  abstract: string;
  techStack: string[];
  domain: string;
  methodology: string;
}

const riskConfig = {
  low: { color: "text-success border-success/30 bg-success/5", icon: CheckCircle2, label: "Low Risk" },
  moderate: { color: "text-warning border-warning/30 bg-warning/5", icon: AlertTriangle, label: "Moderate Risk" },
  high: { color: "text-destructive border-destructive/30 bg-destructive/5", icon: ShieldAlert, label: "High Risk" },
  critical: { color: "text-destructive border-destructive/30 bg-destructive/5", icon: XCircle, label: "Critical" },
};

const severityBadge = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

const loadingSteps = [
  "Analyzing project abstract...",
  "Comparing with existing works...",
  "Checking code originality...",
  "Evaluating methodology uniqueness...",
  "Generating detailed report...",
];

export default function PlagiarismCheck({ title, abstract, techStack, domain, methodology }: PlagiarismCheckProps) {
  const [report, setReport] = useState<PlagiarismReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const runCheck = async () => {
    setLoading(true);
    setLoadingStep(0);

    // Animate through loading steps
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const { data, error } = await supabase.functions.invoke("plagiarism-check", {
        body: { title, abstract, techStack, domain, methodology },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReport(data);
      toast.success("Plagiarism analysis complete");
    } catch (err: any) {
      toast.error(err.message || "Failed to run plagiarism check");
    }
    clearInterval(interval);
    setLoading(false);
  };

  // Pre-check state
  if (!report) {
    return (
      <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02] p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Fingerprint className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">AI Plagiarism & Originality Check</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Advanced AI analysis to detect similarities, evaluate originality of code & methodology, and compare with existing academic works.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {[
            { icon: FileSearch, label: "Content Scan" },
            { icon: Code, label: "Code Analysis" },
            { icon: BookOpen, label: "Source Match" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg bg-card border border-border p-3">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button onClick={runCheck} disabled={loading} size="lg" className="gradient-primary text-primary-foreground shadow-glow">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {loading ? "Analyzing..." : "Run AI Plagiarism Check"}
          </Button>
        </div>

        {loading && (
          <div className="space-y-3 max-w-sm mx-auto animate-fade-in">
            <Progress value={((loadingStep + 1) / loadingSteps.length) * 100} className="h-2" />
            <div className="space-y-1">
              {loadingSteps.map((step, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-2 text-xs transition-all duration-300",
                  i < loadingStep ? "text-success" : i === loadingStep ? "text-primary font-medium" : "text-muted-foreground/40"
                )}>
                  {i < loadingStep ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : i === loadingStep ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-muted" />
                  )}
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const RiskIcon = riskConfig[report.risk_level].icon;
  const simColor = report.similarity_score <= 15 ? "text-success" : report.similarity_score <= 35 ? "text-warning" : "text-destructive";
  const simBorder = report.similarity_score <= 15 ? "border-success" : report.similarity_score <= 35 ? "border-warning" : "border-destructive";
  const simBg = report.similarity_score <= 15 ? "bg-success/5" : report.similarity_score <= 35 ? "bg-warning/5" : "bg-destructive/5";

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Plagiarism Analysis Report</h3>
            <p className="text-xs text-muted-foreground">AI-powered originality assessment</p>
          </div>
        </div>
        <Button onClick={runCheck} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={cn("mr-2 h-3 w-3", loading && "animate-spin")} />
          Re-analyze
        </Button>
      </div>

      {/* Score Overview - 4 cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Similarity */}
        <div className={cn("rounded-xl border p-4 text-center", simBorder, simBg)}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Similarity</p>
          <div className={cn("mx-auto h-16 w-16 rounded-full border-[3px] flex items-center justify-center", simBorder)}>
            <span className={cn("font-heading text-xl font-bold", simColor)}>{report.similarity_score}%</span>
          </div>
        </div>

        {/* Originality */}
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Originality</p>
          <p className="font-heading text-2xl font-bold text-success">{report.originality_score}%</p>
          <Progress value={report.originality_score} className="mt-2 h-1.5" />
        </div>

        {/* Code Originality */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Code Original.</p>
          <p className="font-heading text-2xl font-bold text-primary">{report.code_originality_score}%</p>
          <Progress value={report.code_originality_score} className="mt-2 h-1.5" />
        </div>

        {/* Risk Level */}
        <div className={cn("rounded-xl border p-4 flex flex-col items-center justify-center gap-2", riskConfig[report.risk_level].color)}>
          <RiskIcon className="h-6 w-6" />
          <Badge className={cn("text-xs capitalize", riskConfig[report.risk_level].color)}>
            {riskConfig[report.risk_level].label}
          </Badge>
        </div>
      </div>

      {/* Detailed tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview" className="text-xs"><BarChart3 className="mr-1.5 h-3 w-3" />Overview</TabsTrigger>
          <TabsTrigger value="flagged" className="text-xs"><AlertTriangle className="mr-1.5 h-3 w-3" />Flagged</TabsTrigger>
          <TabsTrigger value="similar" className="text-xs"><FileSearch className="mr-1.5 h-3 w-3" />Matches</TabsTrigger>
          <TabsTrigger value="improve" className="text-xs"><Lightbulb className="mr-1.5 h-3 w-3" />Improve</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
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
          {/* Methodology Score */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" /> Methodology Originality
              </h4>
              <span className="font-heading text-lg font-bold text-primary">{report.methodology_originality_score}%</span>
            </div>
            <Progress value={report.methodology_originality_score} className="h-2" />
          </div>
          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div className="rounded-xl border border-success/20 bg-success/[0.03] p-5 space-y-2">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-success">Strengths</h4>
              {report.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          )}
          {/* Weaknesses */}
          {report.weaknesses && report.weaknesses.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/[0.03] p-5 space-y-2">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-warning">Areas of Concern</h4>
              {report.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{w}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Flagged Areas */}
        <TabsContent value="flagged" className="mt-4 space-y-3">
          {report.flagged_areas.length === 0 ? (
            <div className="rounded-xl border border-success/20 bg-success/5 p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No Major Flags</p>
              <p className="text-xs text-muted-foreground mt-1">The project passed all plagiarism checks</p>
            </div>
          ) : (
            report.flagged_areas.map((area, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {area.severity === "high" ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : area.severity === "medium" ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    <span className="text-sm font-semibold text-foreground">{area.section}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] capitalize", severityBadge[area.severity])}>
                    {area.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{area.concern}</p>
                {area.matched_source && (
                  <div className="flex items-center gap-1.5 pl-6">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Matched: {area.matched_source}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Similar Projects */}
        <TabsContent value="similar" className="mt-4 space-y-3">
          {report.similar_projects.length === 0 ? (
            <div className="rounded-xl border border-success/20 bg-success/5 p-8 text-center">
              <ShieldCheck className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No Similar Works Found</p>
              <p className="text-xs text-muted-foreground mt-1">This project appears to be unique</p>
            </div>
          ) : (
            report.similar_projects.map((sp, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sp.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{sp.source}</span>
                      {sp.overlap_type && (
                        <Badge variant="outline" className="text-[10px]">{sp.overlap_type}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3">
                    <span className={cn(
                      "font-heading text-lg font-bold",
                      sp.similarity > 50 ? "text-destructive" : sp.similarity > 25 ? "text-warning" : "text-success"
                    )}>
                      {sp.similarity}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">match</span>
                  </div>
                </div>
                <Progress
                  value={sp.similarity}
                  className="mt-2 h-1"
                />
              </div>
            ))
          )}
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="improve" className="mt-4 space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 space-y-3">
            <h4 className="font-heading text-sm font-semibold text-primary flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Recommendations to Improve Originality
            </h4>
            <div className="space-y-3">
              {report.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-card border border-border p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
