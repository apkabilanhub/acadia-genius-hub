
-- Tasks table (assigned to students by faculty within classrooms)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table (files linked to projects)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size TEXT,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  project_id UUID REFERENCES public.project_submissions(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID NOT NULL
);

-- Reports table (progress reports for projects)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.project_submissions(id) ON DELETE CASCADE NOT NULL,
  progress_status TEXT NOT NULL DEFAULT 'in_progress',
  completion_rate INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  generated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  user_id UUID NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Tasks RLS
CREATE POLICY "Users view assigned tasks" ON public.tasks FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "Faculty create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (assigned_by = auth.uid());
CREATE POLICY "Faculty update tasks" ON public.tasks FOR UPDATE TO authenticated USING (assigned_by = auth.uid());
CREATE POLICY "Assignee update task status" ON public.tasks FOR UPDATE TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "Faculty delete tasks" ON public.tasks FOR DELETE TO authenticated USING (assigned_by = auth.uid());

-- Documents RLS
CREATE POLICY "Project participants view documents" ON public.documents FOR SELECT TO authenticated USING (
  uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.project_submissions ps WHERE ps.id = project_id AND (ps.student_id = auth.uid() OR public.is_classroom_faculty(auth.uid(), ps.classroom_id))
  )
);
CREATE POLICY "Users upload documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Uploader delete documents" ON public.documents FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Reports RLS
CREATE POLICY "Report viewers" ON public.reports FOR SELECT TO authenticated USING (
  generated_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.project_submissions ps WHERE ps.id = project_id AND (ps.student_id = auth.uid() OR public.is_classroom_faculty(auth.uid(), ps.classroom_id))
  )
);
CREATE POLICY "Users create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (generated_by = auth.uid());

-- Notifications RLS
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
