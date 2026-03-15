import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Upload,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  Bell,
  Target,
  FolderOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Building2,
  Trophy,
  LogOut,
  BrainCircuit,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/mock-data";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

const navItems: Record<UserRole, { label: string; icon: React.ElementType; path: string }[]> = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
    { label: "My Projects", icon: FileText, path: "/student/projects" },
    { label: "Classrooms", icon: School, path: "/student/classrooms" },
    { label: "Tasks", icon: Target, path: "/student/tasks" },
    { label: "Documents", icon: FolderOpen, path: "/student/documents" },
    { label: "Reports", icon: BarChart3, path: "/student/reports" },
    { label: "Scoreboard", icon: Trophy, path: "/student/scoreboard" },
    { label: "Submit Project", icon: Upload, path: "/student/submit" },
    { label: "AI Recommendations", icon: Sparkles, path: "/student/recommendations" },
    { label: "Notifications", icon: Bell, path: "/student/notifications" },
  ],
  faculty: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/faculty" },
    { label: "Classrooms", icon: School, path: "/faculty/classrooms" },
    { label: "Assigned Projects", icon: ClipboardCheck, path: "/faculty/projects" },
    { label: "Evaluations", icon: FileText, path: "/faculty/evaluations" },
    { label: "Tasks", icon: Target, path: "/faculty/tasks" },
    { label: "Documents", icon: FolderOpen, path: "/faculty/documents" },
    { label: "Reports", icon: BarChart3, path: "/faculty/reports" },
    { label: "AI Analysis", icon: BrainCircuit, path: "/faculty/ai-analysis" },
    { label: "Notifications", icon: Bell, path: "/faculty/notifications" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Departments", icon: Building2, path: "/admin/departments" },
    { label: "All Projects", icon: FileText, path: "/admin/projects" },
    { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    { label: "Leaderboard", icon: Trophy, path: "/admin/leaderboard" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ],
};

const roleLabels: Record<UserRole, string> = {
  student: "Student Portal",
  faculty: "Faculty Portal",
  admin: "Admin Console",
};

const roleIcons: Record<UserRole, React.ElementType> = {
  student: GraduationCap,
  faculty: ClipboardCheck,
  admin: Building2,
};

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const items = navItems[role];
  const RoleIcon = roleIcons[role];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-gold">
            <RoleIcon className="h-4 w-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="font-heading text-sm font-semibold text-sidebar-primary">SRM ProjectHub</p>
              <p className="text-[10px] text-sidebar-foreground">{roleLabels[role]}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                {!collapsed && item.label === "Notifications" && (
                  <Badge className="ml-auto h-5 min-w-5 justify-center rounded-full bg-accent px-1.5 text-[10px] text-accent-foreground">
                    3
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Watermark - centered in content area */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/images/srm-watermark.png"
            alt=""
            className="w-[450px] h-[450px] object-contain opacity-[0.08] select-none"
            draggable={false}
          />
        </div>

        {/* Header */}
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, students..."
              className="pl-10 h-9 bg-muted/50 border-none text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Link to="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50 transition-colors">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {(profile?.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {profile?.full_name || "User"}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
