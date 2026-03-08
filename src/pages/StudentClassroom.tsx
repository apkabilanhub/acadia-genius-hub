import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  LogIn, Plus, FileText, CheckCircle2, Clock, ChevronRight,
  ArrowLeft, Code, Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  department: string | null;
  semester: string | null;
}

interface Submission {
  id: string;
  title: string;
  language: string;
  status: string;
  plagiarism_score: number | null;
  ai_grade: number | null;
  faculty_grade: number | null;
  created_at: string;
  classroom_id: string;
}

const languages = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "typescript", label: "TypeScript" },
  { value: "rust", label: "Rust" },
];

export default function StudentClassroom() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);

  // Submit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [sourceCode, setSourceCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    // Fetch classrooms the student joined
    const { data: memberships } = await supabase
      .from("classroom_members")
      .select("classroom_id")
      .eq("student_id", user.id);

    const classroomIds = (memberships || []).map((m: any) => m.classroom_id);

    if (classroomIds.length > 0) {
      const { data: classData } = await supabase
        .from("classrooms")
        .select("*")
        .in("id", classroomIds);
      setClassrooms(classData || []);

      const { data: subData } = await supabase
        .from("project_submissions")
        .select("id, title, language, status, plagiarism_score, ai_grade, faculty_grade, created_at, classroom_id")
        .eq("student_id", user.id)
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false });
      setSubmissions(subData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);

    // Find classroom by code
    const { data: classroom, error: findError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("join_code", joinCode.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (findError || !classroom) {
      toast.error("Invalid code", { description: "No active classroom found with this code." });
      setJoining(false);
      return;
    }

    const { error: joinError } = await supabase.from("classroom_members").insert({
      classroom_id: classroom.id,
      student_id: user.id,
    });

    if (joinError) {
      if (joinError.code === "23505") {
        toast.error("Already joined", { description: "You are already a member of this classroom." });
      } else {
        toast.error("Join failed", { description: joinError.message });
      }
    } else {
      toast.success("Joined classroom!");
      setJoinCode("");
      setJoinDialogOpen(false);
      fetchData();
    }
    setJoining(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClassroom || !title.trim() || !sourceCode.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("project_submissions").insert({
      classroom_id: selectedClassroom,
      student_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      language,
      source_code: sourceCode,
    });

    if (error) {
      toast.error("Submission failed", { description: error.message });
    } else {
      toast.success("Project submitted!", { description: "Your faculty will review it." });
      setTitle("");
      setDescription("");
      setSourceCode("");
      setSubmitDialogOpen(false);
      setSelectedClassroom(null);
      fetchData();
    }
    setSubmitting(false);
  };

  const scoreColor = (score: number | null, inverse = false) => {
    if (score === null) return "text-muted-foreground";
    const bad = inverse ? score > 30 : score < 50;
    if (bad) return inverse ? "text-destructive" : "text-warning";
    return "text-success";
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">My Classrooms</h1>
            <p className="text-sm text-muted-foreground mt-1">Join classrooms and submit your projects</p>
          </div>
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <LogIn className="mr-2 h-4 w-4" />
                Join Classroom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Classroom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="joincode">Enter Join Code</Label>
                  <Input
                    id="joincode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123"
                    className="mt-1 font-mono text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Get this code from your faculty</p>
                </div>
                <Button onClick={handleJoin} disabled={joining || joinCode.length < 6} className="w-full gradient-primary text-primary-foreground">
                  {joining ? "Joining..." : "Join Classroom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Code className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-foreground">No classrooms joined</h3>
            <p className="text-sm text-muted-foreground mt-1">Ask your faculty for the join code to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {classrooms.map((c) => {
              const classSubs = submissions.filter((s) => s.classroom_id === c.id);
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground">{c.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {c.department && <Badge variant="secondary" className="text-[10px]">{c.department}</Badge>}
                        {c.semester && <Badge variant="outline" className="text-[10px]">{c.semester}</Badge>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground"
                      onClick={() => {
                        setSelectedClassroom(c.id);
                        setSubmitDialogOpen(true);
                      }}
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      Submit Project
                    </Button>
                  </div>

                  {classSubs.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-sm text-muted-foreground">No submissions yet. Submit your project above.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {classSubs.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{sub.title}</p>
                            <p className="text-xs text-muted-foreground">{sub.language} • {new Date(sub.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {sub.plagiarism_score !== null && (
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground">Plagiarism</p>
                                <p className={cn("text-xs font-bold", scoreColor(sub.plagiarism_score, true))}>{sub.plagiarism_score}%</p>
                              </div>
                            )}
                            {sub.ai_grade !== null && (
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground">AI Grade</p>
                                <p className={cn("text-xs font-bold", scoreColor(sub.ai_grade))}>{sub.ai_grade}/100</p>
                              </div>
                            )}
                            {sub.faculty_grade !== null && (
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground">Faculty</p>
                                <p className="text-xs font-bold text-primary">{sub.faculty_grade}/100</p>
                              </div>
                            )}
                            <Badge
                              className={cn(
                                "text-[10px]",
                                sub.status === "graded" ? "bg-success/10 text-success" :
                                sub.status === "analyzed" ? "bg-primary/10 text-primary" :
                                "bg-warning/10 text-warning"
                              )}
                            >
                              {sub.status === "graded" ? "Graded" : sub.status === "analyzed" ? "Analyzed" : "Submitted"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit project dialog */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="ptitle">Project Title</Label>
                <Input id="ptitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Binary Search Tree Implementation" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="pdesc">Description (optional)</Label>
                <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your project..." rows={2} className="mt-1" />
              </div>
              <div>
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pcode">Source Code</Label>
                <Textarea
                  id="pcode"
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="Paste your source code here..."
                  rows={12}
                  className="mt-1 font-mono text-xs"
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                {submitting ? "Submitting..." : "Submit Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
