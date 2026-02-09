-- Allow users to insert their own daily earnings
CREATE POLICY "Users can insert own earnings"
ON public.daily_earnings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own investments (for total_earned)
CREATE POLICY "Users can update own investments"
ON public.investments
FOR UPDATE
USING (auth.uid() = user_id);