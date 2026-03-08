import { FileText, Clock, CheckCircle2, AlertCircle, Upload, Sparkles, TrendingUp, Bell } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

const studentProjects = mockProjects.filter((_, i) => i < 3);

export default function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, Aarav 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's an overview of your academic projects</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Projects" value={3} change="+1 this semester" changeType="positive" icon={FileText} />
          <StatCard label="Under Review" value={1} change="Awaiting evaluation" changeType="neutral" icon={Clock} />
          <StatCard label="Approved" value={1} change="1 project cleared" changeType="positive" icon={CheckCircle2} />
          <StatCard label="Avg. AI Score" value="85%" change="+5% from last" changeType="positive" icon={Sparkles} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent Projects</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/student/submit")}>
            <Upload className="mr-2 h-4 w-4" />
            New Submission
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {studentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} showScores />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate("/student/submit")}
            className="flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Submit Project</p>
              <p className="text-xs text-muted-foreground">Upload your work</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/student/recommendations")}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="rounded-lg bg-accent/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Recommendations</p>
              <p className="text-xs text-muted-foreground">Discover project ideas</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/student/notifications")}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="rounded-lg bg-warning/10 p-2">
              <Bell className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">3 unread messages</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
