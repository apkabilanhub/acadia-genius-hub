import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload, Download, Trash2, File, Image, FileCode, FileArchive, Sparkles } from "lucide-react";
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
  project_id: string;
  uploaded_by: string;
  project_title?: string;
  uploader_name?: string;
}

function getFileIcon(type: string | null) {
  if (!type) return File;
  if (type.includes("image")) return Image;
  if (type.includes("code") || type.includes("zip") || type.includes("tar")) return FileArchive;
  if (type.includes("javascript") || type.includes("python") || type.includes("java")) return FileCode;
  return FileText;
}

function getFileColor(type: string | null) {
  if (!type) return "bg-muted text-muted-foreground";
  if (type.includes("pdf")) return "bg-destructive/10 text-destructive";
  if (type.includes("image")) return "bg-info/10 text-info";
  if (type.includes("zip")) return "bg-warning/10 text-warning";
  return "bg-primary/10 text-primary";
}

export default function DocumentsPage({ role }: { role: "student" | "faculty" }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    if (!user) return;
    const { data } = await supabase.from("documents").select("*").order("upload_date", { ascending: false });

    if (data && data.length > 0) {
      const projectIds = [...new Set(data.map(d => d.project_id))];
      const uploaderIds = [...new Set(data.map(d => d.uploaded_by))];

      const [{ data: projects }, { data: profiles }] = await Promise.all([
        supabase.from("project_submissions").select("id, title").in("id", projectIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", uploaderIds),
      ]);

      const projMap: Record<string, string> = {};
      projects?.forEach(p => { projMap[p.id] = p.title; });
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.full_name; });

      setDocs(data.map(d => ({
        ...d,
        project_title: projMap[d.project_id] || "Unknown Project",
        uploader_name: nameMap[d.uploaded_by] || "Unknown",
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [user]);

  const handleDelete = async (docId: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Document deleted");
    setDocs(prev => prev.filter(d => d.id !== docId));
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Document Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">All project documents and files in one place</p>
        </div>

        {/* Stats bar */}
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
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              {[...new Set(docs.map(d => d.project_id))].length} projects with documents
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
            <p className="text-sm text-muted-foreground mt-1">Documents uploaded with project submissions will appear here</p>
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
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground truncate">{doc.file_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.project_title}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{doc.uploader_name}</span>
                    <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.file_type && <Badge variant="outline" className="text-[10px]">{doc.file_type}</Badge>}
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
