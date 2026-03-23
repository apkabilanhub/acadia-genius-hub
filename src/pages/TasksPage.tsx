import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Clock, AlertTriangle, Plus, Target, Calendar, User, Zap,
  ListTodo, ArrowUpRight, Sparkles, GripVertical, LayoutGrid, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: string;
  priority: string | null;
  classroom_id: string;
  assigned_to: string;
  assigned_by: string;
  created_at: string;
  assignee_name?: string;
  classroom_name?: string;
  subtasks?: Subtask[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "To Do", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-info/10 text-info border-info/20", icon: Zap },
  testing: { label: "Testing", color: "bg-accent/10 text-accent border-accent/20", icon: Target },
  completed: { label: "Done", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  must: { label: "Must", color: "bg-destructive text-destructive-foreground" },
  should: { label: "Should", color: "bg-accent text-accent-foreground" },
  could: { label: "Could", color: "bg-success text-success-foreground" },
};

const boardColumns = [
  { key: "pending", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "testing", label: "Testing" },
  { key: "completed", label: "Done" },
];

export default function TasksPage({ role }: { role: "student" | "faculty" }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", classroom_id: "", assigned_to: "", priority: "should", subtasks: "" });

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map(t => t.assigned_to))];
      const classroomIds = [...new Set(data.map(t => t.classroom_id))];
      const taskIds = data.map(t => t.id);

      const [{ data: profiles }, { data: cls }, { data: subtasks }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds.length ? userIds : ["_"]),
        supabase.from("classrooms").select("id, name").in("id", classroomIds.length ? classroomIds : ["_"]),
        supabase.from("task_subtasks").select("*").in("task_id", taskIds.length ? taskIds : ["_"]),
      ]);

      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.full_name; });
      const clsMap: Record<string, string> = {};
      cls?.forEach(c => { clsMap[c.id] = c.name; });
      const subtaskMap: Record<string, Subtask[]> = {};
      subtasks?.forEach(s => {
        if (!subtaskMap[s.task_id]) subtaskMap[s.task_id] = [];
        subtaskMap[s.task_id].push({ id: s.id, title: s.title, is_completed: s.is_completed ?? false });
      });

      setTasks(data.map(t => ({
        ...t,
        assignee_name: nameMap[t.assigned_to] || "Unknown",
        classroom_name: clsMap[t.classroom_id] || "Unknown",
        subtasks: subtaskMap[t.id] || [],
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
    const { data } = await supabase.from("classroom_members").select("student_id").eq("classroom_id", classroomId);
    if (data) {
      const ids = data.map(d => d.student_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids.length ? ids : ["_"]);
      setStudents(profiles?.map(p => ({ id: p.user_id, name: p.full_name })) || []);
    }
  };

  const handleCreate = async () => {
    if (!user || !form.title || !form.classroom_id || !form.assigned_to) return;
    const { data: taskData, error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      deadline: form.deadline || null,
      classroom_id: form.classroom_id,
      assigned_to: form.assigned_to,
      assigned_by: user.id,
      priority: form.priority,
    }).select().single();
    if (error) { toast.error("Failed to create task"); return; }

    // Create subtasks
    const subtaskLines = form.subtasks.split("\n").filter(l => l.trim());
    if (subtaskLines.length > 0 && taskData) {
      await supabase.from("task_subtasks").insert(
        subtaskLines.map(title => ({ task_id: taskData.id, title: title.trim() }))
      );
    }

    await supabase.from("notifications").insert({
      message: `New task assigned: "${form.title}"`,
      type: "task",
      user_id: form.assigned_to,
      link: role === "student" ? "/student/tasks" : "/faculty/tasks",
    });

    toast.success("Task created & assigned!");
    setDialogOpen(false);
    setForm({ title: "", description: "", deadline: "", classroom_id: "", assigned_to: "", priority: "should", subtasks: "" });
    fetchTasks();
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", taskId);
    toast.success(`Task marked as ${newStatus.replace(/_/g, " ")}`);
    fetchTasks();
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    await supabase.from("task_subtasks").update({ is_completed: completed }).eq("id", subtaskId);
    setTasks(prev => prev.map(t => ({
      ...t,
      subtasks: t.subtasks?.map(s => s.id === subtaskId ? { ...s, is_completed: completed } : s),
    })));
  };

  const pending = tasks.filter(t => t.status === "pending" || t.status === "overdue").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const testing = tasks.filter(t => t.status === "testing").length;
  const completed = tasks.filter(t => t.status === "completed").length;

  const TaskCard = ({ task }: { task: Task }) => {
    const cfg = statusConfig[task.status] || statusConfig.pending;
    const Icon = cfg.icon;
    const pri = priorityConfig[task.priority || "should"] || priorityConfig.should;
    const completedSubs = task.subtasks?.filter(s => s.is_completed).length || 0;
    const totalSubs = task.subtasks?.length || 0;

    return (
      <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-elegant hover:border-primary/20 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-[10px] px-1.5 py-0", pri.color)}>{pri.label}</Badge>
          <Badge className={cn("text-[10px] border", cfg.color)}>{cfg.label}</Badge>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">{task.title}</h3>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>}
        </div>

        {/* Subtasks */}
        {totalSubs > 0 && (
          <div className="space-y-1.5">
            {task.subtasks?.map(sub => (
              <label key={sub.id} className="flex items-center gap-2 text-xs cursor-pointer group">
                <Checkbox
                  checked={sub.is_completed}
                  onCheckedChange={(checked) => toggleSubtask(sub.id, !!checked)}
                  className="h-3.5 w-3.5"
                />
                <span className={cn("transition-colors", sub.is_completed && "line-through text-muted-foreground")}>
                  {sub.title}
                </span>
              </label>
            ))}
            <p className="text-[10px] text-muted-foreground mt-1">✓ {completedSubs} / {totalSubs}</p>
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignee_name}</span>
          {task.deadline && (
            <span className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded",
              task.status === "overdue" ? "bg-destructive text-destructive-foreground" : "bg-muted"
            )}>
              <Calendar className="h-3 w-3" />
              {new Date(task.deadline).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
            </span>
          )}
        </div>

        {/* Status actions */}
        {task.status !== "completed" && (
          <div className="flex gap-1.5 pt-1">
            {task.status === "pending" && (
              <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, "in_progress")} className="text-[10px] h-7 px-2">
                Start
              </Button>
            )}
            {task.status === "in_progress" && (
              <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, "testing")} className="text-[10px] h-7 px-2">
                Move to Testing
              </Button>
            )}
            {(task.status === "testing" || task.status === "in_progress") && (
              <Button size="sm" onClick={() => updateTaskStatus(task.id, "completed")} className="text-[10px] h-7 px-2 gradient-primary text-primary-foreground">
                Complete
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

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
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setViewMode("board")} className={cn("p-2 transition-colors", viewMode === "board" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("p-2 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
                <List className="h-4 w-4" />
              </button>
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
                    <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="must">🔴 Must</SelectItem>
                        <SelectItem value="should">🟡 Should</SelectItem>
                        <SelectItem value="could">🟢 Could</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Textarea
                      placeholder="Subtasks (one per line)&#10;e.g. Upload documents securely&#10;Download documents when required"
                      value={form.subtasks}
                      onChange={e => setForm(f => ({ ...f, subtasks: e.target.value }))}
                      rows={3}
                    />
                    <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "To Do", count: pending, icon: ListTodo, color: "text-warning bg-warning/10" },
            { label: "In Progress", count: inProgress, icon: Zap, color: "text-info bg-info/10" },
            { label: "Testing", count: testing, icon: Target, color: "text-accent bg-accent/10" },
            { label: "Done", count: completed, icon: CheckCircle2, color: "text-success bg-success/10" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.count}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "faculty" ? "Create and assign tasks to your students" : "No tasks have been assigned to you yet"}
            </p>
          </div>
        ) : viewMode === "board" ? (
          /* Kanban Board View */
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {boardColumns.map(col => {
              const colTasks = tasks.filter(t =>
                col.key === "pending" ? (t.status === "pending" || t.status === "overdue") : t.status === col.key
              );
              return (
                <div key={col.key} className="rounded-xl border border-border bg-muted/30 p-3 space-y-3 min-h-[300px]">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-heading text-sm font-semibold text-foreground">{col.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{colTasks.length}</Badge>
                  </div>
                  <button className="w-full flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border p-2 transition-colors">
                    <Plus className="h-3 w-3" /> Add task
                  </button>
                  <div className="space-y-3">
                    {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
