-- Fix the approval process and add missing functions
CREATE OR REPLACE FUNCTION approve_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
    request_record registration_requests%ROWTYPE;
BEGIN
    -- Get the registration request
    SELECT * INTO request_record FROM registration_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found';
    END IF;
    
    -- Create the user account
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        department,
        phone,
        is_approved,
        approved_by,
        approved_at,
        created_at
    ) VALUES (
        gen_random_uuid(),
        request_record.email,
        request_record.full_name,
        request_record.role,
        request_record.department,
        request_record.phone,
        true,
        admin_id,
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
    
    -- Create a notification for the user
    INSERT INTO notifications (
        id,
        user_email,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        request_record.email,
        'Account Approved',
        'Your registration has been approved. You can now log in to the portal.',
        'approval',
        false,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE registration_requests 
    SET 
        status = 'rejected',
        reviewed_by = admin_id,
        reviewed_at = NOW()
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_participants INTEGER DEFAULT 0,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'faculty', 'staff')),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_email = auth.email());

CREATE POLICY "Admins can view all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.email() 
            AND users.role = 'admin' 
            AND users.is_approved = true
        )
    );

CREATE POLICY "Everyone can view published events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.email() 
            AND users.role = 'admin' 
            AND users.is_approved = true
        )
    );

CREATE POLICY "Everyone can view published announcements" ON announcements
    FOR SELECT USING (is_published = true OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.email = auth.email() 
        AND users.role = 'admin' 
        AND users.is_approved = true
    ));

CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.email() 
            AND users.role = 'admin' 
            AND users.is_approved = true
        )
    );
