CREATE POLICY "avatars admin read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));