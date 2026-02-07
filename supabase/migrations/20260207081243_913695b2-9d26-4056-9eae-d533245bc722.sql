
-- Chat messages table for live chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  sender_role text NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  sender_name text,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can send chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND sender_role = 'user');

CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chat messages" ON public.chat_messages
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Tasks/activity center table
CREATE TABLE public.user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  reward numeric DEFAULT 0,
  task_type text DEFAULT 'daily', -- 'daily', 'weekly', 'one_time'
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.user_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.user_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tasks" ON public.user_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add currency preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'RWF';
