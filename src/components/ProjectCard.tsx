import { FileText, Clock, Users, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/mock-data";
import { getStatusColor, getStatusLabel } from "@/lib/mock-data";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  showScores?: boolean;
}

export default function ProjectCard({ project, onClick, showScores }: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-elegant",
        onClick && "cursor-pointer hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">{project.id}</span>
            <Badge className={cn("text-[10px] px-2 py-0.5 font-medium border-none", getStatusColor(project.status))}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          <h3 className="font-heading font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.abstract}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {project.teamMembers.length} members
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {project.files.length} files
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          v{project.versions}
        </span>
        {showScores && project.innovationScore && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <Sparkles className="h-3 w-3" />
            Innovation: {project.innovationScore}%
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.techStack.slice(0, 4).map((tech) => (
          <span key={tech} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            {tech}
          </span>
        ))}
        {project.techStack.length > 4 && (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            +{project.techStack.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}
