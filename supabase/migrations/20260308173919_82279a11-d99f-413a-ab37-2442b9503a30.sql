
-- Fix infinite recursion: split combined OR policies into separate PERMISSIVE policies

-- Drop classrooms policies
DROP POLICY IF EXISTS "Faculty and members can view classrooms" ON classrooms;
DROP POLICY IF EXISTS "Faculty can create classrooms" ON classrooms;
DROP POLICY IF EXISTS "Faculty can update own classrooms" ON classrooms;

-- Recreate classrooms policies as PERMISSIVE (separate)
CREATE POLICY "Faculty view own classrooms" ON classrooms FOR SELECT TO authenticated USING (faculty_id = auth.uid());
CREATE POLICY "Members view joined classrooms" ON classrooms FOR SELECT TO authenticated USING (public.is_classroom_member(auth.uid(), id));
CREATE POLICY "Faculty create classrooms" ON classrooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = faculty_id);
CREATE POLICY "Faculty update own classrooms" ON classrooms FOR UPDATE TO authenticated USING (auth.uid() = faculty_id);

-- Drop classroom_members policies
DROP POLICY IF EXISTS "Members and faculty can view classroom members" ON classroom_members;
DROP POLICY IF EXISTS "Students can join classrooms" ON classroom_members;

-- Recreate classroom_members policies as PERMISSIVE (separate)
CREATE POLICY "Students view own memberships" ON classroom_members FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Faculty view classroom members" ON classroom_members FOR SELECT TO authenticated USING (public.is_classroom_faculty(auth.uid(), classroom_id));
CREATE POLICY "Students join classrooms" ON classroom_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Fix project_submissions policies that use subquery on classrooms (causes recursion)
DROP POLICY IF EXISTS "Students can view own submissions" ON project_submissions;
DROP POLICY IF EXISTS "Faculty can update submissions they oversee" ON project_submissions;
DROP POLICY IF EXISTS "Students can submit projects" ON project_submissions;

CREATE POLICY "Students view own submissions" ON project_submissions FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Faculty view classroom submissions" ON project_submissions FOR SELECT TO authenticated USING (public.is_classroom_faculty(auth.uid(), classroom_id));
CREATE POLICY "Students submit projects" ON project_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Faculty update submissions" ON project_submissions FOR UPDATE TO authenticated USING (public.is_classroom_faculty(auth.uid(), classroom_id));
