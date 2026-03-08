
-- Fix infinite recursion between classrooms and classroom_members RLS policies
-- Drop the recursive policies
DROP POLICY IF EXISTS "Faculty can view own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Members can view classroom members" ON public.classroom_members;

-- Create a security definer function to check classroom membership without RLS
CREATE OR REPLACE FUNCTION public.is_classroom_member(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_members
    WHERE student_id = _user_id AND classroom_id = _classroom_id
  )
$$;

-- Create a security definer function to check if user is faculty of classroom
CREATE OR REPLACE FUNCTION public.is_classroom_faculty(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = _classroom_id AND faculty_id = _user_id
  )
$$;

-- Re-create classrooms SELECT policy using security definer function
CREATE POLICY "Faculty and members can view classrooms"
ON public.classrooms
FOR SELECT
TO authenticated
USING (
  faculty_id = auth.uid()
  OR public.is_classroom_member(auth.uid(), id)
);

-- Re-create classroom_members SELECT policy using security definer function
CREATE POLICY "Members and faculty can view classroom members"
ON public.classroom_members
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_classroom_faculty(auth.uid(), classroom_id)
);
