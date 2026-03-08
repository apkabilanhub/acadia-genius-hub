import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Users, Copy, FileText, Clock, CheckCircle2, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  department: string | null;
  semester: string | null;
  is_active: boolean;
  created_at: string;
}

export default function FacultyClassrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  const fetchClassrooms = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .eq("faculty_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setClassrooms(data || []);

    // Fetch member counts
    for (const c of data || []) {
      const { count } = await supabase
        .from("classroom_members")
        .select("*", { count: "exact", head: true })
        .eq("classroom_id", c.id);
      setMemberCounts((prev) => ({ ...prev, [c.id]: count || 0 }));

      const { count: subCount } = await supabase
        .from("project_submissions")
        .select("*", { count: "exact", head: true })
        .eq("classroom_id", c.id);
      setSubmissionCounts((prev) => ({ ...prev, [c.id]: subCount || 0 }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreating(true);

    const joinCode = generateCode();
    const { error } = await supabase.from("classrooms").insert({
      name: name.trim(),
      description: description.trim() || null,
      join_code: joinCode,
      faculty_id: user.id,
      department: department.trim() || null,
      semester: semester.trim() || null,
    });

    if (error) {
      toast.error("Failed to create classroom", { description: error.message });
    } else {
      toast.success("Classroom created!", { description: `Join code: ${joinCode}` });
      setName("");
      setDescription("");
      setDepartment("");
      setSemester("");
      setDialogOpen(false);
      fetchClassrooms();
    }
    setCreating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Join code copied!");
  };

  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">My Classrooms</h1>
            <p className="text-sm text-muted-foreground mt-1">Create classrooms and share the join code with students</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Create Classroom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Classroom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="cname">Classroom Name</Label>
                  <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., CS3201 - Software Engineering Lab" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="cdesc">Description</Label>
                  <Textarea id="cdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} className="mt-1" />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <Label htmlFor="cdept">Department</Label>
                    <Input id="cdept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., CSE" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="csem">Semester</Label>
                    <Input id="csem" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g., Spring 2026" className="mt-1" />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={creating}>
                  {creating ? "Creating..." : "Create Classroom"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-foreground">No classrooms yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first classroom and share the code with students</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/faculty/classroom/${c.id}`)}
                className="rounded-xl border border-border bg-card p-5 text-left transition-all hover:shadow-elegant hover:border-primary/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{c.name}</h3>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  {c.department && <Badge variant="secondary" className="text-[10px]">{c.department}</Badge>}
                  {c.semester && <Badge variant="outline" className="text-[10px]">{c.semester}</Badge>}
                  <Badge className={cn("text-[10px]", c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {c.is_active ? "Active" : "Archived"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); copyCode(c.join_code); }}>
                    <Copy className="h-3 w-3" />
                    <span className="font-mono font-bold text-foreground">{c.join_code}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{memberCounts[c.id] || 0} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{submissionCounts[c.id] || 0} submissions</span>
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
