import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BarChart3, FileText, Plus, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Report {
  id: string;
  project_id: string;
  progress_status: string;
  completion_rate: number;
  summary: string | null;
  generated_by: string;
  created_at: string;
  project_title?: string;
  generator_name?: string;
}

const statusColors: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  delayed: "bg-destructive/10 text-destructive",
};

export default function ReportsPage({ role }: { role: "student" | "faculty" }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({ project_id: "", progress_status: "in_progress", completion_rate: 50, summary: "" });

  const fetchReports = async () => {
    if (!user) return;
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const projectIds = [...new Set(data.map(r => r.project_id))];
      const generatorIds = [...new Set(data.map(r => r.generated_by))];

      const [{ data: projs }, { data: profiles }] = await Promise.all([
        supabase.from("project_submissions").select("id, title").in("id", projectIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", generatorIds),
      ]);

      const projMap: Record<string, string> = {};
      projs?.forEach(p => { projMap[p.id] = p.title; });
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.full_name; });

      setReports(data.map(r => ({
        ...r,
        project_title: projMap[r.project_id] || "Unknown",
        generator_name: nameMap[r.generated_by] || "Unknown",
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    if (user) {
      supabase.from("project_submissions").select("id, title").eq("student_id", user.id).then(({ data }) => {
        if (data) setProjects(data);
      });
    }
  }, [user]);

  const handleCreate = async () => {
    if (!user || !form.project_id) return;
    const { error } = await supabase.from("reports").insert({
      project_id: form.project_id,
      progress_status: form.progress_status,
      completion_rate: form.completion_rate,
      summary: form.summary || null,
      generated_by: user.id,
    });
    if (error) { toast.error("Failed to create report"); return; }
    toast.success("Progress report submitted!");
    setDialogOpen(false);
    setForm({ project_id: "", progress_status: "in_progress", completion_rate: 50, summary: "" });
    fetchReports();
  };

  const avgCompletion = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.completion_rate, 0) / reports.length) : 0;

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Progress Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track and generate project progress reports</p>
          </div>
          {role === "student" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" /> New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Submit Progress Report</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.progress_status} onValueChange={v => setForm(f => ({ ...f, progress_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div>
                    <p className="text-sm mb-2">Completion: <span className="font-bold text-primary">{form.completion_rate}%</span></p>
                    <Slider value={[form.completion_rate]} max={100} step={5} onValueChange={v => setForm(f => ({ ...f, completion_rate: v[0] }))} />
                  </div>
                  <Textarea placeholder="Summary of progress..." value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={4} />
                  <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Submit Report</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{avgCompletion}%</p>
            <p className="text-xs text-muted-foreground">Avg Completion</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <CheckCircle2 className="h-6 w-6 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{reports.filter(r => r.progress_status === "completed").length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold">No reports yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Submit progress reports to track your project milestones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-elegant">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{report.project_title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">By {report.generator_name} • {new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={cn("text-[10px]", statusColors[report.progress_status] || statusColors.in_progress)}>
                    {report.progress_status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-bold text-primary">{report.completion_rate}%</span>
                  </div>
                  <Progress value={report.completion_rate} className="h-2" />
                </div>
                {report.summary && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{report.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
