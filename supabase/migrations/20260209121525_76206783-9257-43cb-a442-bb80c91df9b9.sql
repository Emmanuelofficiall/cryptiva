
-- Add photo_url column to merchants
ALTER TABLE public.merchants ADD COLUMN photo_url text;

-- Create storage bucket for merchant photos
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-photos', 'merchant-photos', true);

-- Allow admins to upload merchant photos
CREATE POLICY "Admins can upload merchant photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'merchant-photos' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update merchant photos
CREATE POLICY "Admins can update merchant photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'merchant-photos' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete merchant photos
CREATE POLICY "Admins can delete merchant photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'merchant-photos' AND public.has_role(auth.uid(), 'admin'));

-- Allow public to view merchant photos
CREATE POLICY "Anyone can view merchant photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'merchant-photos');
