import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, File, Film, Archive, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  icon: React.ElementType;
}

const fileCategories = [
  { label: "Project Report (PDF)", accept: ".pdf", icon: FileText, required: true },
  { label: "Presentation (PPT)", accept: ".pptx,.ppt", icon: File, required: false },
  { label: "Source Code (ZIP)", accept: ".zip,.rar", icon: Archive, required: true },
  { label: "Demo Video (Optional)", accept: ".mp4,.avi,.mov", icon: Film, required: false },
];

const techOptions = ["Python", "React", "Node.js", "TensorFlow", "PyTorch", "MongoDB", "PostgreSQL", "Docker", "AWS", "Firebase", "Flutter", "Kotlin", "Swift", "OpenCV", "Solidity", "Arduino", "Unity", "C#", "Java", "Go"];

export default function StudentSubmit() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([""]);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = files.map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      icon: f.name.endsWith(".pdf") ? FileText : f.name.endsWith(".zip") ? Archive : f.name.endsWith(".pptx") ? File : Film,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (name: string) => setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  const toggleTech = (tech: string) =>
    setSelectedTech((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Project submitted successfully!", { description: "Your project is now under review." });
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Submit New Project</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill in your project details and upload required files</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-base font-semibold">Project Information</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="title">Project Title</Label>
                <Input id="title" placeholder="e.g., AI-Powered Smart Traffic Management System" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="abstract">Abstract</Label>
                <Textarea id="abstract" placeholder="Describe your project in 150-300 words..." rows={4} className="mt-1" />
                <div className="flex items-center justify-end mt-1">
                  <Button type="button" variant="ghost" size="sm" className="text-xs text-primary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate with AI
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" placeholder="e.g., Artificial Intelligence" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="methodology">Methodology</Label>
                  <Input id="methodology" placeholder="e.g., Agile, Waterfall" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="guide">Faculty Guide</Label>
                <Input id="guide" placeholder="e.g., Dr. Ananya Krishnan" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="font-heading text-base font-semibold">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              {techOptions.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedTech.includes(tech)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
            {selectedTech.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedTech.length} technologies selected</p>
            )}
          </div>

          {/* Team */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="font-heading text-base font-semibold">Team Members</h2>
            {teamMembers.map((member, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={member}
                  onChange={(e) => {
                    const updated = [...teamMembers];
                    updated[i] = e.target.value;
                    setTeamMembers(updated);
                  }}
                  placeholder={`Team member ${i + 1}`}
                />
                {teamMembers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setTeamMembers(teamMembers.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTeamMembers([...teamMembers, ""])}
            >
              + Add Member
            </Button>
          </div>

          {/* File Upload */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-base font-semibold">File Uploads</h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
              }`}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, PPT, ZIP, MP4 supported</p>
              <Button type="button" variant="outline" size="sm" className="mt-3">
                Browse Files
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <file.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(file.name)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {fileCategories.map((cat) => (
                <div key={cat.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <cat.icon className="h-3 w-3" />
                  <span>{cat.label}</span>
                  {cat.required && <Badge variant="outline" className="text-[9px] px-1.5 py-0">Required</Badge>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="gradient-primary text-primary-foreground shadow-glow">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Project
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
