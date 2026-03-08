import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Copy, Users, Play, ShieldCheck, BrainCircuit, FileText,
  CheckCircle2, AlertTriangle, Loader2, Terminal, ChevronRight, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CodeRunner from "@/components/CodeRunner";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  language: string;
  source_code: string;
  status: string;
  plagiarism_score: number | null;
  ai_code_copy_score: number | null;
  ai_grade: number | null;
  faculty_grade: number | null;
  faculty_comment: string | null;
  execution_output: string | null;
  created_at: string;
  student_id: string;
  profiles?: { full_name: string } | null;
}

interface Classroom {
  id: string;
  name: string;
  join_code: string;
  department: string | null;
  semester: string | null;
}

interface MemberProfile {
  student_id: string;
  profiles: { full_name: string } | null;
}

export default function FacultyClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [grading, setGrading] = useState(false);
  const [facultyGrade, setFacultyGrade] = useState(75);
  const [facultyComment, setFacultyComment] = useState("");
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const [classRes, subRes, memRes] = await Promise.all([
        supabase.from("classrooms").select("id, name, join_code, department, semester").eq("id", id).single(),
        supabase.from("project_submissions").select("*").eq("classroom_id", id).order("created_at", { ascending: false }),
        supabase.from("classroom_members").select("student_id").eq("classroom_id", id),
      ]);
      if (classRes.data) setClassroom(classRes.data);
      if (subRes.data) setSubmissions(subRes.data as Submission[]);

      // Fetch student names
      const studentIds = [
        ...new Set([
          ...(memRes.data || []).map((m: any) => m.student_id),
          ...(subRes.data || []).map((s: any) => s.student_id),
        ]),
      ];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);
        const names: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { names[p.user_id] = p.full_name; });
        setStudentNames(names);
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const copyCode = () => {
    if (classroom) {
      navigator.clipboard.writeText(classroom.join_code);
      toast.success("Join code copied!");
    }
  };

  const runAnalysis = async (sub: Submission) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-submission", {
        body: { submission_id: sub.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, plagiarism_score: data.plagiarism_score, ai_code_copy_score: data.ai_code_copy_score, ai_grade: data.ai_grade, status: "analyzed" }
            : s
        )
      );
      if (selectedSub?.id === sub.id) {
        setSelectedSub((prev) =>
          prev ? { ...prev, plagiarism_score: data.plagiarism_score, ai_code_copy_score: data.ai_code_copy_score, ai_grade: data.ai_grade, status: "analyzed" } : prev
        );
      }
      toast.success("Analysis complete!", { description: `Plagiarism: ${data.plagiarism_score}% | AI Grade: ${data.ai_grade}/100` });
    } catch (e: any) {
      toast.error("Analysis failed", { description: e.message });
    }
    setAnalyzing(false);
  };

  const submitGrade = async () => {
    if (!selectedSub) return;
    setGrading(true);
    const { error } = await supabase
      .from("project_submissions")
      .update({ faculty_grade: facultyGrade, faculty_comment: facultyComment, status: "graded" })
      .eq("id", selectedSub.id);

    if (error) {
      toast.error("Failed to save grade");
    } else {
      toast.success("Grade submitted!");
      setSubmissions((prev) =>
        prev.map((s) => s.id === selectedSub.id ? { ...s, faculty_grade: facultyGrade, faculty_comment: facultyComment, status: "graded" } : s)
      );
      setSelectedSub((prev) => prev ? { ...prev, faculty_grade: facultyGrade, faculty_comment: facultyComment, status: "graded" } : prev);
    }
    setGrading(false);
  };

  const scoreColor = (score: number | null, inverse = false) => {
    if (score === null) return "text-muted-foreground";
    const threshold = inverse ? score > 30 : score < 50;
    const threshold2 = inverse ? score > 60 : score < 30;
    if (threshold2) return "text-destructive";
    if (threshold) return "text-warning";
    return "text-success";
  };

  if (loading) {
    return (
      <DashboardLayout role="faculty">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classroom) {
    return (
      <DashboardLayout role="faculty">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Classroom not found</p>
          <Button variant="outline" className="mt-3" onClick={() => navigate("/faculty/classrooms")}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Submission detail view
  if (selectedSub) {
    return (
      <DashboardLayout role="faculty">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate("/faculty/classrooms")} className="hover:text-foreground transition-colors">Classrooms</button>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => setSelectedSub(null)} className="hover:text-foreground transition-colors">{classroom.name}</button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{selectedSub.title}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{selectedSub.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                By {studentNames[selectedSub.student_id] || "Unknown"} • {selectedSub.language} •{" "}
                {new Date(selectedSub.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAnalysis(selectedSub)}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-2 h-3 w-3" />}
                {analyzing ? "Analyzing..." : "Run AI Analysis"}
              </Button>
            </div>
          </div>

          {/* Score cards */}
          {(selectedSub.plagiarism_score !== null || selectedSub.ai_grade !== null) && (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Plagiarism</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", scoreColor(selectedSub.plagiarism_score, true))}>
                  {selectedSub.plagiarism_score !== null ? `${selectedSub.plagiarism_score}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI Code Copy</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", scoreColor(selectedSub.ai_code_copy_score, true))}>
                  {selectedSub.ai_code_copy_score !== null ? `${selectedSub.ai_code_copy_score}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">AI Grade</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", scoreColor(selectedSub.ai_grade))}>
                  {selectedSub.ai_grade !== null ? `${selectedSub.ai_grade}/100` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Faculty Grade</p>
                <p className={cn("font-heading text-2xl font-bold mt-1", selectedSub.faculty_grade ? "text-primary" : "text-muted-foreground")}>
                  {selectedSub.faculty_grade !== null ? `${selectedSub.faculty_grade}/100` : "Pending"}
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="code">
            <TabsList>
              <TabsTrigger value="code"><Terminal className="mr-1.5 h-3 w-3" />Code & Run</TabsTrigger>
              <TabsTrigger value="grade"><CheckCircle2 className="mr-1.5 h-3 w-3" />Grade</TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="mt-4">
              <CodeRunner
                code={selectedSub.source_code}
                language={selectedSub.language}
                readOnly
              />
            </TabsContent>

            <TabsContent value="grade" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold">Faculty Evaluation</h3>
                  <span className="font-heading text-lg font-bold text-primary">{facultyGrade}/100</span>
                </div>
                <Slider
                  value={[facultyGrade]}
                  max={100}
                  step={1}
                  onValueChange={(val) => setFacultyGrade(val[0])}
                />
                <Textarea
                  value={facultyComment}
                  onChange={(e) => setFacultyComment(e.target.value)}
                  placeholder="Add evaluation comments..."
                  rows={3}
                />
                <Button onClick={submitGrade} disabled={grading} className="gradient-primary text-primary-foreground">
                  {grading ? "Saving..." : "Submit Grade"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // Submissions list
  return (
    <DashboardLayout role="faculty">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/faculty/classrooms")} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Classrooms
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{classroom.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{classroom.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              {classroom.department && <Badge variant="secondary" className="text-[10px]">{classroom.department}</Badge>}
              {classroom.semester && <Badge variant="outline" className="text-[10px]">{classroom.semester}</Badge>}
            </div>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs text-muted-foreground">Join Code:</span>
            <span className="font-mono font-bold text-foreground">{classroom.join_code}</span>
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Students will submit their projects here after joining the classroom</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSub(sub);
                  setFacultyGrade(sub.faculty_grade || 75);
                  setFacultyComment(sub.faculty_comment || "");
                }}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-elegant hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{sub.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      By {studentNames[sub.student_id] || "Unknown"} • {sub.language} • {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
                      {sub.status === "graded" ? "Graded" : sub.status === "analyzed" ? "Analyzed" : "Pending"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
