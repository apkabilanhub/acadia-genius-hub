import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, Loader2, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlagiarismReport {
  similarity_score: number;
  originality_score: number;
  risk_level: "low" | "moderate" | "high" | "critical";
  summary: string;
  flagged_areas: { section: string; concern: string; severity: "low" | "medium" | "high" }[];
  strengths: string[];
  recommendations: string[];
  similar_projects: { title: string; similarity: number; source: string }[];
}

interface PlagiarismCheckProps {
  title: string;
  abstract: string;
  techStack: string[];
  domain: string;
  methodology: string;
}

const riskColors = {
  low: "text-success border-success bg-success/10",
  moderate: "text-warning border-warning bg-warning/10",
  high: "text-destructive border-destructive bg-destructive/10",
  critical: "text-destructive border-destructive bg-destructive/10",
};

const severityIcons = {
  low: <CheckCircle2 className="h-4 w-4 text-success" />,
  medium: <AlertTriangle className="h-4 w-4 text-warning" />,
  high: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function PlagiarismCheck({ title, abstract, techStack, domain, methodology }: PlagiarismCheckProps) {
  const [report, setReport] = useState<PlagiarismReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  if (!report) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-semibold">Plagiarism & Originality Check</h3>
          </div>
          <Button onClick={runCheck} disabled={loading} size="sm" className="gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {loading ? "Analyzing..." : "Run AI Check"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Click "Run AI Check" to analyze this project for plagiarism, originality, and similarity with existing works using AI.
        </p>
        {loading && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanning project abstract and details...
            </div>
            <Progress value={45} className="h-1.5" />
          </div>
        )}
      </div>
    );
  }

  const scoreColor = report.similarity_score <= 15 ? "text-success" : report.similarity_score <= 35 ? "text-warning" : "text-destructive";
  const borderColor = report.similarity_score <= 15 ? "border-success" : report.similarity_score <= 35 ? "border-warning" : "border-destructive";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with re-run */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h3 className="font-heading text-sm font-semibold">Plagiarism Report</h3>
        </div>
        <Button onClick={runCheck} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
          Re-run Check
        </Button>
      </div>

      {/* Score Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Similarity</p>
          <div className={cn("mx-auto h-20 w-20 rounded-full border-4 flex items-center justify-center", borderColor)}>
            <span className={cn("font-heading text-2xl font-bold", scoreColor)}>{report.similarity_score}%</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Originality</p>
          <p className="font-heading text-3xl font-bold text-success">{report.originality_score}%</p>
          <Progress value={report.originality_score} className="mt-2 h-1.5" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
          <Badge className={cn("text-sm px-3 py-1 capitalize", riskColors[report.risk_level])}>
            {report.risk_level}
          </Badge>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
      </div>

      {/* Flagged Areas */}
      {report.flagged_areas.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flagged Areas</h4>
          <div className="space-y-2">
            {report.flagged_areas.map((area, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                {severityIcons[area.severity]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{area.section}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{area.concern}</p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">{area.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original Strengths</h4>
          {report.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Similar Projects Found */}
      {report.similar_projects.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">Similar Works Found</h4>
          {report.similar_projects.map((sp, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{sp.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{sp.source}</span>
                <Badge variant="outline" className={cn("text-[10px]", sp.similarity > 30 ? "text-destructive" : "text-muted-foreground")}>
                  {sp.similarity}% match
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-2">
          <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-primary">Recommendations</h4>
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs text-primary font-bold mt-0.5">{i + 1}.</span>
              <p className="text-sm text-muted-foreground">{r}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
