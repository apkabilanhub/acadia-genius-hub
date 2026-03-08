
-- Classrooms table (faculty creates, students join with code)
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  join_code TEXT NOT NULL UNIQUE,
  faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT,
  semester TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Classroom members (students who joined)
CREATE TABLE public.classroom_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, student_id)
);

-- Project submissions (students upload to classrooms)
CREATE TABLE public.project_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'python',
  source_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  plagiarism_score NUMERIC,
  ai_code_copy_score NUMERIC,
  ai_grade NUMERIC,
  faculty_grade NUMERIC,
  faculty_comment TEXT,
  execution_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Classrooms policies
CREATE POLICY "Faculty can create classrooms" ON public.classrooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = faculty_id);

CREATE POLICY "Faculty can view own classrooms" ON public.classrooms
  FOR SELECT TO authenticated USING (
    auth.uid() = faculty_id OR
    EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = classrooms.id AND student_id = auth.uid())
  );

CREATE POLICY "Faculty can update own classrooms" ON public.classrooms
  FOR UPDATE TO authenticated USING (auth.uid() = faculty_id);

-- Classroom members policies
CREATE POLICY "Students can join classrooms" ON public.classroom_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Members can view classroom members" ON public.classroom_members
  FOR SELECT TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND faculty_id = auth.uid())
  );

-- Project submissions policies
CREATE POLICY "Students can submit projects" ON public.project_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own submissions" ON public.project_submissions
  FOR SELECT TO authenticated USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND faculty_id = auth.uid())
  );

CREATE POLICY "Faculty can update submissions they oversee" ON public.project_submissions
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND faculty_id = auth.uid())
  );

-- Updated at triggers
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
