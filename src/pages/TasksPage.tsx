import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, AlertTriangle, Plus, Target, Calendar, User, Zap,
  ListTodo, ArrowUpRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: string;
  classroom_id: string;
  assigned_to: string;
  assigned_by: string;
  created_at: string;
  assignee_name?: string;
  classroom_name?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-info/10 text-info border-info/20", icon: Zap },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

export default function TasksPage({ role }: { role: "student" | "faculty" }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", classroom_id: "", assigned_to: "" });

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map(t => t.assigned_to))];
      const classroomIds = [...new Set(data.map(t => t.classroom_id))];

      const [{ data: profiles }, { data: cls }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds.length ? userIds : ["_"]),
        supabase.from("classrooms").select("id, name").in("id", classroomIds.length ? classroomIds : ["_"]),
      ]);

      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.full_name; });
      const clsMap: Record<string, string> = {};
      cls?.forEach(c => { clsMap[c.id] = c.name; });

      setTasks(data.map(t => ({
        ...t,
        assignee_name: nameMap[t.assigned_to] || "Unknown",
        classroom_name: clsMap[t.classroom_id] || "Unknown",
        status: t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed" ? "overdue" : t.status,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    if (role === "faculty" && user) {
      supabase.from("classrooms").select("id, name").eq("faculty_id", user.id).then(({ data }) => {
        if (data) setClassrooms(data);
      });
    }
  }, [user]);

  const loadStudents = async (classroomId: string) => {
    const { data } = await supabase
      .from("classroom_members")
      .select("student_id")
      .eq("classroom_id", classroomId);
    if (data) {
      const ids = data.map(d => d.student_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids.length ? ids : ["_"]);
      setStudents(profiles?.map(p => ({ id: p.user_id, name: p.full_name })) || []);
    }
  };

  const handleCreate = async () => {
    if (!user || !form.title || !form.classroom_id || !form.assigned_to) return;
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      deadline: form.deadline || null,
      classroom_id: form.classroom_id,
      assigned_to: form.assigned_to,
      assigned_by: user.id,
    });
    if (error) { toast.error("Failed to create task"); return; }

    // Send notification
    await supabase.from("notifications").insert({
      message: `New task assigned: "${form.title}"`,
      type: "task",
      user_id: form.assigned_to,
      link: role === "student" ? "/student/tasks" : "/faculty/tasks",
    });

    toast.success("Task created & assigned!");
    setDialogOpen(false);
    setForm({ title: "", description: "", deadline: "", classroom_id: "", assigned_to: "" });
    fetchTasks();
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", taskId);
    toast.success(`Task marked as ${newStatus}`);
    fetchTasks();
  };

  const pending = tasks.filter(t => t.status === "pending" || t.status === "overdue").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const completed = tasks.filter(t => t.status === "completed").length;

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" /> Task Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "faculty" ? "Assign and track tasks for your students" : "View and manage your assigned tasks"}
            </p>
          </div>
          {role === "faculty" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" /> Assign Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Create New Task
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input placeholder="Task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                  <Input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  <Select value={form.classroom_id} onValueChange={v => { setForm(f => ({ ...f, classroom_id: v, assigned_to: "" })); loadStudents(v); }}>
                    <SelectTrigger><SelectValue placeholder="Select classroom" /></SelectTrigger>
                    <SelectContent>
                      {classrooms.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                    <SelectTrigger><SelectValue placeholder="Assign to student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center"><ListTodo className="h-6 w-6 text-warning" /></div>
            <div><p className="text-2xl font-bold text-foreground">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center"><Zap className="h-6 w-6 text-info" /></div>
            <div><p className="text-2xl font-bold text-foreground">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-success" /></div>
            <div><p className="text-2xl font-bold text-foreground">{completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "faculty" ? "Create and assign tasks to your students" : "No tasks have been assigned to you yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const cfg = statusConfig[task.status] || statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <div key={task.id} className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-elegant hover:border-primary/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 shrink-0" />
                        <h3 className="font-heading text-sm font-semibold text-foreground truncate">{task.title}</h3>
                        <Badge className={cn("text-[10px] border", cfg.color)}>{cfg.label}</Badge>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 ml-6">{task.description}</p>}
                      <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignee_name}</span>
                        <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{task.classroom_name}</span>
                        {task.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {task.status !== "completed" && (
                        <>
                          {task.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, "in_progress")} className="text-xs">
                              Start
                            </Button>
                          )}
                          <Button size="sm" onClick={() => updateTaskStatus(task.id, "completed")} className="text-xs gradient-primary text-primary-foreground">
                            Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
