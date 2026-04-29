-- Create storage bucket for item photos and documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-files', 'item-files', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access (so photos can be displayed in the inventory)
CREATE POLICY "Public can view item files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-files');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload item files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-files');

-- Authenticated users can update
CREATE POLICY "Authenticated users can update item files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-files');

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete item files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-files');