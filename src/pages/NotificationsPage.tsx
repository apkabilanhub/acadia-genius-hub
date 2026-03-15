import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Check, CheckCheck, Info, AlertTriangle, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: "text-info bg-info/10" },
  task: { icon: Sparkles, color: "text-primary bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-warning bg-warning/10" },
  success: { icon: Check, color: "text-success bg-success/10" },
};

export default function NotificationsPage({ role }: { role: "student" | "faculty" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        toast.info(payload.new.message as string);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Notifications
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground text-xs">{unreadCount} new</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Stay updated with your latest activities</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cfg = typeConfig[notif.type] || typeConfig.info;
              const Icon = cfg.icon;
              return (
                <button
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.link) navigate(notif.link);
                  }}
                  className={cn(
                    "w-full rounded-xl border bg-card p-4 text-left transition-all hover:shadow-elegant flex items-start gap-4",
                    notif.is_read ? "border-border opacity-60" : "border-primary/20 bg-primary/[0.02]"
                  )}
                >
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !notif.is_read && "font-medium text-foreground")}>{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
