-- First, disable RLS temporarily and drop all existing policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
    
    -- Drop all policies on other tables
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename != 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies (NO RECURSION - simple auth.uid() checks only)
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Registration requests policies
CREATE POLICY "registration_requests_insert_all" ON registration_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "registration_requests_select_own_or_admin" ON registration_requests
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

CREATE POLICY "registration_requests_update_admin" ON registration_requests
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

-- Forms policies
CREATE POLICY "forms_select_active" ON forms
    FOR SELECT USING (status = 'active');

CREATE POLICY "forms_all_admin_faculty" ON forms
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'faculty') AND is_approved = true)
    );

-- Form submissions policies
CREATE POLICY "form_submissions_select_own" ON form_submissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "form_submissions_insert_own" ON form_submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "form_submissions_update_own" ON form_submissions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "form_submissions_select_admin_faculty" ON form_submissions
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'faculty') AND is_approved = true)
    );

-- Announcements policies
CREATE POLICY "announcements_select_all" ON announcements
    FOR SELECT USING (true);

CREATE POLICY "announcements_all_admin_faculty" ON announcements
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'faculty') AND is_approved = true)
    );

-- Events policies
CREATE POLICY "events_select_all" ON events
    FOR SELECT USING (true);

CREATE POLICY "events_all_admin_faculty" ON events
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'faculty') AND is_approved = true)
    );

-- Event registrations policies
CREATE POLICY "event_registrations_select_own" ON event_registrations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "event_registrations_insert_own" ON event_registrations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_registrations_update_own" ON event_registrations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "event_registrations_select_admin" ON event_registrations
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND is_approved = true)
    );

-- Notifications policies
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_all" ON notifications
    FOR INSERT WITH CHECK (true);
