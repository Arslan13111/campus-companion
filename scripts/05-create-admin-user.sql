-- This script creates the admin user in Supabase Auth
-- You need to run this after setting up the database

-- First, create the admin user in Supabase Auth (you'll need to do this manually in Supabase Dashboard)
-- Email: arslanmunawar1311@gmail.com
-- Password: 124578
-- User ID: 550e8400-e29b-41d4-a716-446655440000

-- Then run this to ensure the user exists in our users table
INSERT INTO public.users (id, email, full_name, role, is_approved, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'arslanmunawar1311@gmail.com', 'Arslan Munawar', 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();

-- Grant admin permissions
UPDATE public.users 
SET role = 'admin', is_approved = true 
WHERE email = 'arslanmunawar1311@gmail.com';

-- Verify the admin user was created
SELECT id, email, full_name, role, is_approved FROM public.users WHERE email = 'arslanmunawar1311@gmail.com';
