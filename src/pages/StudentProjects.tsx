import DashboardLayout from "@/components/DashboardLayout";
import ProjectCard from "@/components/ProjectCard";
import { mockProjects } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const studentProjects = mockProjects.filter((_, i) => i < 3);

export default function StudentProjects() {
  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">My Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage all your submitted projects</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-10 h-9 bg-muted/50 border-none text-sm" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {studentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} showScores />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
