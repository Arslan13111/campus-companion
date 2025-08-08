-- Drop existing notifications table if it exists and recreate with correct structure
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with correct structure
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'approval')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE email = auth.email()
        )
    );

CREATE POLICY "Admins can view all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.email() 
            AND users.role = 'admin' 
            AND users.is_approved = true
        )
    );

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE email = auth.email()
        )
    );

-- Fix the approval function
CREATE OR REPLACE FUNCTION approve_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
    request_record registration_requests%ROWTYPE;
    new_user_id UUID;
BEGIN
    -- Get the registration request
    SELECT * INTO request_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found';
    END IF;
    
    -- Generate new user ID
    new_user_id := gen_random_uuid();
    
    -- Create the user account
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        department,
        phone,
        student_id,
        year_level,
        is_approved,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        request_record.email,
        request_record.full_name,
        request_record.role,
        request_record.department,
        request_record.phone,
        request_record.student_id,
        request_record.year_level,
        true,
        NOW(),
        NOW()
    );
    
    -- Update the registration request
    UPDATE registration_requests 
    SET 
        status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = NOW()
    WHERE id = request_id;
    
    -- Create a notification for the new user
    INSERT INTO notifications (
        id,
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        'Account Approved',
        'Your registration has been approved. You can now log in to the portal.',
        'approval',
        false,
        NOW()
    );
    
    -- Create notification for admin
    INSERT INTO notifications (
        id,
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        admin_id,
        'Registration Approved',
        'You have approved the registration for ' || request_record.full_name || '.',
        'success',
        false,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create reject function
CREATE OR REPLACE FUNCTION reject_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
    request_record registration_requests%ROWTYPE;
BEGIN
    -- Get the registration request
    SELECT * INTO request_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found';
    END IF;
    
    -- Update the registration request
    UPDATE registration_requests 
    SET 
        status = 'rejected',
        reviewed_by = admin_id,
        reviewed_at = NOW()
    WHERE id = request_id;
    
    -- Create notification for admin
    INSERT INTO notifications (
        id,
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        admin_id,
        'Registration Rejected',
        'You have rejected the registration for ' || request_record.full_name || '.',
        'info',
        false,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create some sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, is_read) 
SELECT 
    u.id,
    'Welcome to the Portal',
    'Welcome to the student portal! Explore all the features available to you.',
    'info',
    false
FROM users u 
WHERE u.role = 'admin'
LIMIT 1;

INSERT INTO notifications (user_id, title, message, type, is_read) 
SELECT 
    u.id,
    'System Update',
    'The portal has been updated with new features and improvements.',
    'success',
    false
FROM users u 
WHERE u.role = 'admin'
LIMIT 1;
