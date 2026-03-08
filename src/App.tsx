import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSubmit from "./pages/StudentSubmit";
import StudentRecommendations from "./pages/StudentRecommendations";
import StudentProjects from "./pages/StudentProjects";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/projects" element={<StudentProjects />} />
          <Route path="/student/submit" element={<StudentSubmit />} />
          <Route path="/student/recommendations" element={<StudentRecommendations />} />
          <Route path="/student/notifications" element={<StudentDashboard />} />
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/projects" element={<FacultyDashboard />} />
          <Route path="/faculty/evaluations" element={<FacultyDashboard />} />
          <Route path="/faculty/ai-analysis" element={<FacultyDashboard />} />
          <Route path="/faculty/notifications" element={<FacultyDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
          <Route path="/admin/departments" element={<AdminDashboard />} />
          <Route path="/admin/projects" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route path="/admin/leaderboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
