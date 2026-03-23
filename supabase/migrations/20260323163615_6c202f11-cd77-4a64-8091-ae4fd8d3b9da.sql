
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'should';

CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL, is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ts_sel" ON public.task_subtasks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ts_ins" ON public.task_subtasks FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ts_upd" ON public.task_subtasks FOR UPDATE TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ts_del" ON public.task_subtasks FOR DELETE TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN CREATE POLICY "stg_ins" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stg_sel" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "stg_del" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
