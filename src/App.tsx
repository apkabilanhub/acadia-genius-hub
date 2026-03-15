import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSubmit from "./pages/StudentSubmit";
import StudentRecommendations from "./pages/StudentRecommendations";
import StudentProjects from "./pages/StudentProjects";
import StudentScoreboard from "./pages/StudentScoreboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import FacultyClassrooms from "./pages/FacultyClassrooms";
import FacultyClassroomDetail from "./pages/FacultyClassroomDetail";
import FacultyEvaluations from "./pages/FacultyEvaluations";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import StudentClassroom from "./pages/StudentClassroom";
import TasksPage from "./pages/TasksPage";
import DocumentsPage from "./pages/DocumentsPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/projects" element={<ProtectedRoute allowedRoles={["student"]}><StudentProjects /></ProtectedRoute>} />
            <Route path="/student/submit" element={<ProtectedRoute allowedRoles={["student"]}><StudentSubmit /></ProtectedRoute>} />
            <Route path="/student/scoreboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentScoreboard /></ProtectedRoute>} />
            <Route path="/student/recommendations" element={<ProtectedRoute allowedRoles={["student"]}><StudentRecommendations /></ProtectedRoute>} />
            <Route path="/student/classrooms" element={<ProtectedRoute allowedRoles={["student"]}><StudentClassroom /></ProtectedRoute>} />
            <Route path="/student/tasks" element={<ProtectedRoute allowedRoles={["student"]}><TasksPage role="student" /></ProtectedRoute>} />
            <Route path="/student/documents" element={<ProtectedRoute allowedRoles={["student"]}><DocumentsPage role="student" /></ProtectedRoute>} />
            <Route path="/student/reports" element={<ProtectedRoute allowedRoles={["student"]}><ReportsPage role="student" /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={["student"]}><NotificationsPage role="student" /></ProtectedRoute>} />

            {/* Faculty routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/classrooms" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyClassrooms /></ProtectedRoute>} />
            <Route path="/faculty/classroom/:id" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyClassroomDetail /></ProtectedRoute>} />
            <Route path="/faculty/projects" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/evaluations" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyEvaluations /></ProtectedRoute>} />
            <Route path="/faculty/tasks" element={<ProtectedRoute allowedRoles={["faculty"]}><TasksPage role="faculty" /></ProtectedRoute>} />
            <Route path="/faculty/documents" element={<ProtectedRoute allowedRoles={["faculty"]}><DocumentsPage role="faculty" /></ProtectedRoute>} />
            <Route path="/faculty/reports" element={<ProtectedRoute allowedRoles={["faculty"]}><ReportsPage role="faculty" /></ProtectedRoute>} />
            <Route path="/faculty/ai-analysis" element={<ProtectedRoute allowedRoles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/notifications" element={<ProtectedRoute allowedRoles={["faculty"]}><NotificationsPage role="faculty" /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/leaderboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

            <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
