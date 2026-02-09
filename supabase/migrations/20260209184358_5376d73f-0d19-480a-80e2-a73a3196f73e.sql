-- Allow regular users to insert their own tasks
CREATE POLICY "Users can insert own tasks"
ON public.user_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);