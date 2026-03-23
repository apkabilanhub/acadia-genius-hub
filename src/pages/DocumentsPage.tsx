import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload, Download, Trash2, File, Image, FileCode, FileArchive, Sparkles, FolderOpen, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Doc {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: string | null;
  upload_date: string;
  project_id: string | null;
  classroom_id: string | null;
  uploaded_by: string;
  project_title?: string;
  uploader_name?: string;
  classroom_name?: string;
}

function getFileIcon(type: string | null) {
  if (!type) return File;
  if (type.includes("image")) return Image;
  if (type.includes("zip") || type.includes("tar") || type.includes("rar")) return FileArchive;
  if (type.includes("javascript") || type.includes("python") || type.includes("java") || type.includes("code")) return FileCode;
  return FileText;
}

function getFileColor(type: string | null) {
  if (!type) return "bg-muted text-muted-foreground";
  if (type.includes("pdf")) return "bg-destructive/10 text-destructive";
  if (type.includes("image")) return "bg-info/10 text-info";
  if (type.includes("zip") || type.includes("rar")) return "bg-warning/10 text-warning";
  return "bg-primary/10 text-primary";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DocumentsPage({ role }: { role: "student" | "faculty" }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    if (!user) return;
    const { data } = await supabase.from("documents").select("*").order("upload_date", { ascending: false });

    if (data && data.length > 0) {
      const projectIds = [...new Set(data.map(d => d.project_id).filter(Boolean))];
      const uploaderIds = [...new Set(data.map(d => d.uploaded_by))];
      const classroomIds = [...new Set(data.map(d => d.classroom_id).filter(Boolean))];

      const promises: Promise<any>[] = [
        supabase.from("profiles").select("user_id, full_name").in("user_id", uploaderIds),
      ];
      if (projectIds.length) promises.push(supabase.from("project_submissions").select("id, title").in("id", projectIds as string[]));
      if (classroomIds.length) promises.push(supabase.from("classrooms").select("id, name").in("id", classroomIds as string[]));

      const results = await Promise.all(promises);
      const nameMap: Record<string, string> = {};
      results[0]?.data?.forEach((p: any) => { nameMap[p.user_id] = p.full_name; });
      const projMap: Record<string, string> = {};
      if (projectIds.length) results[1]?.data?.forEach((p: any) => { projMap[p.id] = p.title; });
      const clsMap: Record<string, string> = {};
      if (classroomIds.length) (results[projectIds.length ? 2 : 1])?.data?.forEach((c: any) => { clsMap[c.id] = c.name; });

      setDocs(data.map(d => ({
        ...d,
        project_title: d.project_id ? projMap[d.project_id] || "Unknown Project" : undefined,
        uploader_name: nameMap[d.uploaded_by] || "Unknown",
        classroom_name: d.classroom_id ? clsMap[d.classroom_id] || "Unknown" : undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
    if (user) {
      const query = role === "faculty"
        ? supabase.from("classrooms").select("id, name").eq("faculty_id", user.id)
        : supabase.from("classroom_members").select("classroom_id").eq("student_id", user.id);

      query.then(async ({ data }) => {
        if (!data) return;
        if (role === "faculty") {
          setClassrooms(data as any);
        } else {
          const ids = (data as any[]).map(d => d.classroom_id);
          if (ids.length) {
            const { data: cls } = await supabase.from("classrooms").select("id, name").in("id", ids);
            if (cls) setClassrooms(cls);
          }
        }
      });
    }
  }, [user]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
      if (uploadError) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);

      await supabase.from("documents").insert({
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || ext || null,
        file_size: formatSize(file.size),
        uploaded_by: user.id,
        classroom_id: selectedClassroom || null,
      });
    }

    toast.success("Files uploaded successfully!");
    setUploading(false);
    setDialogOpen(false);
    setSelectedClassroom("");
    fetchDocs();
  };

  const handleDelete = async (doc: Doc) => {
    // Delete from storage
    const path = doc.file_url.split("/documents/")[1];
    if (path) await supabase.storage.from("documents").remove([decodeURIComponent(path)]);
    
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Document deleted");
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" /> Document Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Upload, manage, and share project documents securely</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2">
                <Upload className="h-4 w-4" /> Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Upload Documents
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                  <SelectTrigger><SelectValue placeholder="Link to classroom (optional)" /></SelectTrigger>
                  <SelectContent>
                    {classrooms.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Click to select files</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, images, code files, ZIP archives</p>
                </div>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                {uploading && <p className="text-sm text-primary text-center animate-pulse">Uploading files...</p>}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{docs.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Files</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              {[...new Set(docs.map(d => d.classroom_id).filter(Boolean))].length} classrooms
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold">No documents yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map(doc => {
              const Icon = getFileIcon(doc.file_type);
              return (
                <div key={doc.id} className="rounded-xl border border-border bg-card p-5 space-y-3 transition-all hover:shadow-elegant hover:border-primary/20 group">
                  <div className="flex items-start justify-between">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", getFileColor(doc.file_type))}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {doc.uploaded_by === user?.id && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground truncate">{doc.file_name}</h3>
                    {doc.classroom_name && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.classroom_name}</p>}
                    {doc.project_title && <p className="text-xs text-muted-foreground truncate">{doc.project_title}</p>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{doc.uploader_name}</span>
                    <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.file_type && <Badge variant="outline" className="text-[10px]">{doc.file_type.split("/").pop()}</Badge>}
                    {doc.file_size && <Badge variant="outline" className="text-[10px]">{doc.file_size}</Badge>}
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
