import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, BarChart3, Trophy, Building2, CheckCircle2,
  Clock, TrendingUp, Sparkles, ArrowUpRight,
} from "lucide-react";
import { mockProjects, departmentStats, monthlySubmissions } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["hsl(215,80%,48%)", "hsl(215,70%,38%)", "hsl(152,60%,40%)", "hsl(38,92%,50%)", "hsl(205,85%,50%)"];

const topProjects = [...mockProjects]
  .filter((p) => p.innovationScore)
  .sort((a, b) => (b.innovationScore || 0) - (a.innovationScore || 0))
  .slice(0, 5);

const pieData = departmentStats.map((d) => ({ name: d.name, value: d.projects }));

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System overview and analytics</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Projects" value={145} change="+12 this week" changeType="positive" icon={FileText} />
          <StatCard label="Active Students" value={382} change="+28 new" changeType="positive" icon={Users} />
          <StatCard label="Faculty Members" value={45} icon={Building2} />
          <StatCard label="Evaluation Rate" value="78%" change="+5% from last month" changeType="positive" icon={CheckCircle2} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-semibold mb-4">Monthly Submissions</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySubmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-semibold mb-4">Projects by Department</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="hsl(var(--card))">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
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
          </div>
        </div>

        {/* Department Stats Table */}
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
                {departmentStats.map((dept) => (
                  <tr key={dept.name} className="border-b border-border last:border-none hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{dept.name}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{dept.projects}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{dept.evaluated}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge className={cn(
                        "text-[10px]",
                        (dept.evaluated / dept.projects) > 0.8 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      )}>
                        {Math.round((dept.evaluated / dept.projects) * 100)}%
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">{dept.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Top Projects by Innovation Score
            </h3>
          </div>
          <div className="space-y-3">
            {topProjects.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold",
                  i === 0 && "bg-warning/20 text-warning",
                  i === 1 && "bg-muted text-muted-foreground",
                  i === 2 && "bg-warning/10 text-warning",
                  i > 2 && "bg-muted text-muted-foreground"
                )}>
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.studentName} • {p.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-bold text-primary">{p.innovationScore}%</p>
                  <div className="flex items-center gap-1 text-xs text-success">
                    <TrendingUp className="h-3 w-3" />
                    <span>AI: {p.aiGrade}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
