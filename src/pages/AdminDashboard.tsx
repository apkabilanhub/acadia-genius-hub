import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FileText, Building2, CheckCircle2, Trophy, TrendingUp,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const CHART_COLORS = ["hsl(215,80%,48%)", "hsl(215,70%,38%)", "hsl(152,60%,40%)", "hsl(38,92%,50%)", "hsl(205,85%,50%)"];

interface DeptStat {
  name: string;
  projects: number;
  evaluated: number;
  avgScore: number;
}

interface TopProject {
  id: string;
  title: string;
  student_name: string;
  ai_grade: number;
  department: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [evaluationRate, setEvaluationRate] = useState(0);
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [topProjects, setTopProjects] = useState<TopProject[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
      // Total submissions
      const { count: projCount } = await supabase.from("project_submissions").select("*", { count: "exact", head: true });
      setTotalProjects(projCount || 0);

      // Count students & faculty
      const { data: roles } = await supabase.from("user_roles").select("role");
      const students = roles?.filter(r => r.role === "student").length || 0;
      const faculty = roles?.filter(r => r.role === "faculty").length || 0;
      setTotalStudents(students);
      setTotalFaculty(faculty);

      // All submissions for stats
      const { data: allSubs } = await supabase.from("project_submissions").select("id, title, student_id, classroom_id, ai_grade, faculty_grade, status, created_at");
      const subs = allSubs || [];

      const evaluated = subs.filter(s => s.faculty_grade != null).length;
      setEvaluationRate(subs.length > 0 ? Math.round((evaluated / subs.length) * 100) : 0);

      // Monthly data (last 7 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const monthlyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[key] = 0;
      }
      subs.forEach(s => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key in monthlyMap) monthlyMap[key]++;
      });
      setMonthlyData(Object.entries(monthlyMap).map(([k, v]) => ({
        month: months[parseInt(k.split("-")[1]) - 1],
        count: v,
      })));

      // Department stats from classrooms
      const { data: classrooms } = await supabase.from("classrooms").select("id, department");
      const classroomDeptMap: Record<string, string> = {};
      const deptMap: Record<string, { projects: number; evaluated: number; totalScore: number; scored: number }> = {};
      classrooms?.forEach(c => {
        classroomDeptMap[c.id] = c.department || "Other";
      });
      subs.forEach(s => {
        const dept = classroomDeptMap[s.classroom_id] || "Other";
        if (!deptMap[dept]) deptMap[dept] = { projects: 0, evaluated: 0, totalScore: 0, scored: 0 };
        deptMap[dept].projects++;
        if (s.faculty_grade != null) {
          deptMap[dept].evaluated++;
          deptMap[dept].totalScore += Number(s.faculty_grade);
          deptMap[dept].scored++;
        }
      });
      setDeptStats(Object.entries(deptMap).map(([name, d]) => ({
        name,
        projects: d.projects,
        evaluated: d.evaluated,
        avgScore: d.scored > 0 ? Math.round(d.totalScore / d.scored) : 0,
      })));

      // Top projects by AI grade
      const scored = subs.filter(s => s.ai_grade != null).sort((a, b) => (b.ai_grade || 0) - (a.ai_grade || 0)).slice(0, 5);
      if (scored.length > 0) {
        const studentIds = [...new Set(scored.map(s => s.student_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, department").in("user_id", studentIds);
        const profileMap: Record<string, { name: string; dept: string }> = {};
        profiles?.forEach(p => { profileMap[p.user_id] = { name: p.full_name, dept: p.department || "—" }; });

        setTopProjects(scored.map(s => ({
          id: s.id,
          title: s.title,
          student_name: profileMap[s.student_id]?.name || "Unknown",
          ai_grade: s.ai_grade || 0,
          department: profileMap[s.student_id]?.dept || "—",
        })));
      }

      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const pieData = deptStats.map(d => ({ name: d.name, value: d.projects }));

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System overview and analytics</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Projects" value={totalProjects} icon={FileText} />
          <StatCard label="Active Students" value={totalStudents} icon={Users} />
          <StatCard label="Faculty Members" value={totalFaculty} icon={Building2} />
          <StatCard label="Evaluation Rate" value={`${evaluationRate}%`} icon={CheckCircle2} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-semibold mb-4">Monthly Submissions</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-semibold mb-4">Projects by Department</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="hsl(var(--card))">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-20">No data yet</p>
            )}
          </div>
        </div>

        {/* Department Stats Table */}
        {deptStats.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-heading text-sm font-semibold">Department Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Department</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Projects</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Evaluated</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Completion</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {deptStats.map((dept) => (
                    <tr key={dept.name} className="border-b border-border last:border-none hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{dept.name}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{dept.projects}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{dept.evaluated}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge className={cn("text-[10px]", dept.projects > 0 && (dept.evaluated / dept.projects) > 0.8 ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                          {dept.projects > 0 ? Math.round((dept.evaluated / dept.projects) * 100) : 0}%
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-foreground">{dept.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {topProjects.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Top Projects by AI Score
            </h3>
            <div className="space-y-3">
              {topProjects.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
                  <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold",
                    i === 0 && "bg-warning/20 text-warning",
                    i === 1 && "bg-muted text-muted-foreground",
                    i === 2 && "bg-warning/10 text-warning",
                    i > 2 && "bg-muted text-muted-foreground"
                  )}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.student_name} • {p.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-lg font-bold text-primary">{p.ai_grade}</p>
                    <div className="flex items-center gap-1 text-xs text-success">
                      <TrendingUp className="h-3 w-3" />
                      <span>AI Score</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
