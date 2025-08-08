-- Clean up and fix all permissions properly

-- First, disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
    
    -- Drop all policies on registration_requests table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'registration_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON registration_requests';
    END LOOP;
    
    -- Drop all policies on notifications table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notifications') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON notifications';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for users table
CREATE POLICY "users_all_access" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Create simple policies for registration_requests
CREATE POLICY "registration_requests_all_access" ON registration_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Create simple policies for notifications
CREATE POLICY "notifications_all_access" ON notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Update the approval function with better error handling
CREATE OR REPLACE FUNCTION approve_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_record registration_requests%ROWTYPE;
    auth_user_id UUID;
    user_exists BOOLEAN := false;
BEGIN
    -- Get the registration request
    SELECT * INTO req_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found with ID: %', request_id;
    END IF;
    
    -- Check if request is already processed
    IF req_record.status != 'pending' THEN
        RAISE EXCEPTION 'Registration request has already been processed (status: %)', req_record.status;
    END IF;
    
    -- Get the auth user ID for this email
    SELECT id INTO auth_user_id FROM auth.users WHERE email = req_record.email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Auth user not found for email: %. User must confirm their email first.', req_record.email;
    END IF;
    
    -- Check if user already exists in users table
    SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user_id) INTO user_exists;
    
    -- Update registration request status first
    UPDATE registration_requests 
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = admin_id
    WHERE id = request_id;
    
    -- Insert or update user record
    IF user_exists THEN
        UPDATE users SET
            is_approved = true,
            updated_at = NOW()
        WHERE id = auth_user_id;
    ELSE
        INSERT INTO users (
            id, email, full_name, role, student_id, department, 
            year_level, phone, is_approved, created_at, updated_at
        ) VALUES (
            auth_user_id, req_record.email, req_record.full_name, req_record.role,
            req_record.student_id, req_record.department, req_record.year_level,
            req_record.phone, true, NOW(), NOW()
        );
    END IF;
    
    -- Create notification for the approved user
    INSERT INTO notifications (user_id, title, message, type, created_at, is_read)
    VALUES (
        auth_user_id,
        'Registration Approved',
        'Your registration has been approved. You can now access the portal.',
        'success',
        NOW(),
        false
    );
    
    -- Create notification for admin
    INSERT INTO notifications (user_id, title, message, type, created_at, is_read)
    VALUES (
        admin_id,
        'Registration Processed',
        'Registration request for ' || req_record.full_name || ' has been approved.',
        'info',
        NOW(),
        false
    );
    
    RAISE NOTICE 'Successfully approved registration for % (ID: %)', req_record.email, auth_user_id;
END;
$$;

-- Update the rejection function
CREATE OR REPLACE FUNCTION reject_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_record registration_requests%ROWTYPE;
BEGIN
    -- Get the registration request
    SELECT * INTO req_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found with ID: %', request_id;
    END IF;
    
    -- Check if request is already processed
    IF req_record.status != 'pending' THEN
        RAISE EXCEPTION 'Registration request has already been processed (status: %)', req_record.status;
    END IF;
    
    -- Update registration request status
    UPDATE registration_requests 
    SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = admin_id
    WHERE id = request_id;
    
    -- Create notification for admin
    INSERT INTO notifications (user_id, title, message, type, created_at, is_read)
    VALUES (
        admin_id,
        'Registration Processed',
        'Registration request for ' || req_record.full_name || ' has been rejected.',
        'info',
        NOW(),
        false
    );
    
    RAISE NOTICE 'Successfully rejected registration for %', req_record.email;
END;
$$;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role = 'admin' 
        AND is_approved = true
    ) OR EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND email = 'arslanmunawar1311@gmail.com'
    );
END;
$$;

-- Insert some test data if tables are empty
DO $$
BEGIN
    -- Check if we have any registration requests, if not create some test data
    IF NOT EXISTS (SELECT 1 FROM registration_requests LIMIT 1) THEN
        INSERT INTO registration_requests (
            id, email, full_name, role, student_id, department, year_level, phone, status, created_at
        ) VALUES 
        (
            gen_random_uuid(),
            'test.student@example.com',
            'Test Student',
            'student',
            'STU001',
            'Computer Science',
            '3rd Year',
            '+1234567890',
            'pending',
            NOW()
        ),
        (
            gen_random_uuid(),
            'test.faculty@example.com', 
            'Test Faculty',
            'faculty',
            NULL,
            'Mathematics',
            NULL,
            '+1234567891',
            'pending',
            NOW()
        );
        
        RAISE NOTICE 'Created test registration requests';
    END IF;
END $$;
