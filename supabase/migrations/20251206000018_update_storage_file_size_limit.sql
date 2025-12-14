-- Update storage bucket file size limit to 50MB for gallery uploads
-- This migration updates the product-images bucket to allow larger file uploads

UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB limit (50 * 1024 * 1024)
WHERE id = 'product-images';

