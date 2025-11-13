-- Simplify RLS policies for admin operations
-- Since we have a separate admin login, any authenticated user in admin section should be able to manage talks

-- Drop old admin-checking policies
DROP POLICY IF EXISTS "talks_insert_admin" ON public.talks;
DROP POLICY IF EXISTS "talks_update_admin" ON public.talks;
DROP POLICY IF EXISTS "talks_delete_admin" ON public.talks;

-- Create simpler policies: any authenticated user can manage talks
-- (Only admins will have accounts, so this is secure)
CREATE POLICY "talks_insert_authenticated"
  ON public.talks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "talks_update_authenticated"
  ON public.talks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "talks_delete_authenticated"
  ON public.talks FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Same for transcript_segments - authenticated users can manage
DROP POLICY IF EXISTS "transcript_segments_insert_admin" ON public.transcript_segments;
DROP POLICY IF EXISTS "transcript_segments_update_admin" ON public.transcript_segments;
DROP POLICY IF EXISTS "transcript_segments_delete_admin" ON public.transcript_segments;

CREATE POLICY "transcript_segments_insert_authenticated"
  ON public.transcript_segments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "transcript_segments_update_authenticated"
  ON public.transcript_segments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "transcript_segments_delete_authenticated"
  ON public.transcript_segments FOR DELETE
  USING (auth.uid() IS NOT NULL);
