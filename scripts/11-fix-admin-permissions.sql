-- Fix RLS policies to allow proper admin access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "registration_requests_select_own_or_admin" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_update_admin" ON registration_requests;

-- Create new simplified policies for users table
CREATE POLICY "users_select_authenticated" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

CREATE POLICY "users_insert_authenticated" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_or_admin" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

-- Fix registration requests policies
CREATE POLICY "registration_requests_select_all_authenticated" ON registration_requests
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "registration_requests_update_admin_only" ON registration_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users au 
            WHERE au.id = auth.uid() 
            AND au.email = 'arslanmunawar1311@gmail.com'
        ) OR
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

-- Allow admins to insert users during approval process
CREATE POLICY "users_insert_admin" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users au 
            WHERE au.id = auth.uid() 
            AND au.email = 'arslanmunawar1311@gmail.com'
        ) OR
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

-- Update the approval function to handle permissions properly
CREATE OR REPLACE FUNCTION approve_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_record registration_requests%ROWTYPE;
    auth_user_id UUID;
BEGIN
    -- Get the registration request
    SELECT * INTO req_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found';
    END IF;
    
    -- Get the auth user ID for this email
    SELECT id INTO auth_user_id FROM auth.users WHERE email = req_record.email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Auth user not found for email: %', req_record.email;
    END IF;
    
    -- Update registration request status
    UPDATE registration_requests 
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = admin_id
    WHERE id = request_id;
    
    -- Insert or update user record
    INSERT INTO users (
        id, email, full_name, role, student_id, department, 
        year_level, phone, is_approved, created_at, updated_at
    ) VALUES (
        auth_user_id, req_record.email, req_record.full_name, req_record.role,
        req_record.student_id, req_record.department, req_record.year_level,
        req_record.phone, true, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_approved = true,
        updated_at = NOW();
    
    -- Create notification for the approved user
    INSERT INTO notifications (user_id, title, message, type, created_at)
    VALUES (
        auth_user_id,
        'Registration Approved',
        'Your registration has been approved. You can now access the portal.',
        'success',
        NOW()
    );
    
    -- Create notification for admin
    INSERT INTO notifications (user_id, title, message, type, created_at)
    VALUES (
        admin_id,
        'Registration Processed',
        'Registration request for ' || req_record.full_name || ' has been approved.',
        'info',
        NOW()
    );
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
    auth_user_id UUID;
BEGIN
    -- Get the registration request
    SELECT * INTO req_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found';
    END IF;
    
    -- Update registration request status
    UPDATE registration_requests 
    SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = admin_id
    WHERE id = request_id;
    
    -- Get the auth user ID for this email (if exists)
    SELECT id INTO auth_user_id FROM auth.users WHERE email = req_record.email;
    
    -- Create notification for admin
    INSERT INTO notifications (user_id, title, message, type, created_at)
    VALUES (
        admin_id,
        'Registration Processed',
        'Registration request for ' || req_record.full_name || ' has been rejected.',
        'info',
        NOW()
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
