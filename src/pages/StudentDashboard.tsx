import { FileText, Clock, CheckCircle2, Upload, Sparkles, TrendingUp, Trophy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const studentProjects = mockProjects.filter((_, i) => i < 3);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Student";

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's an overview of your academic projects</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Projects" value={3} change="+1 this semester" changeType="positive" icon={FileText} />
          <StatCard label="Under Review" value={1} change="Awaiting evaluation" changeType="neutral" icon={Clock} />
          <StatCard label="Approved" value={1} change="1 project cleared" changeType="positive" icon={CheckCircle2} />
          <StatCard label="Avg. AI Score" value="84.5" change="+5% from last" changeType="positive" icon={Sparkles} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent Projects</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/student/scoreboard")}>
              <Trophy className="mr-2 h-4 w-4" />
              Scoreboard
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/student/submit")}>
              <Upload className="mr-2 h-4 w-4" />
              New Submission
            </Button>
          </div>
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
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30"
          >
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Submit Project</p>
              <p className="text-xs text-muted-foreground">Upload your work</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/student/scoreboard")}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30"
          >
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Scoreboard</p>
              <p className="text-xs text-muted-foreground">View all scores & grades</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/student/recommendations")}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30"
          >
            <div className="rounded-lg bg-primary/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Recommendations</p>
              <p className="text-xs text-muted-foreground">Discover project ideas</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
