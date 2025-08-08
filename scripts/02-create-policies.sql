-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can view registration requests" ON registration_requests;
DROP POLICY IF EXISTS "Users can create registration requests" ON registration_requests;
DROP POLICY IF EXISTS "Admins can manage registration requests" ON registration_requests;
DROP POLICY IF EXISTS "Users can view forms" ON forms;
DROP POLICY IF EXISTS "Admins can manage forms" ON forms;
DROP POLICY IF EXISTS "Faculty can manage forms" ON forms;
DROP POLICY IF EXISTS "Users can view own submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON form_submissions;
DROP POLICY IF EXISTS "Faculty can view submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Faculty can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Faculty can manage events" ON events;
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies (simplified to avoid recursion)
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Registration requests policies
CREATE POLICY "Anyone can create registration requests" ON registration_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own registration requests" ON registration_requests
  FOR SELECT USING (auth.uid()::text = email OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update registration requests" ON registration_requests
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Forms policies
CREATE POLICY "Users can view active forms" ON forms
  FOR SELECT USING (
    status = 'active' AND (
      target_roles @> ARRAY['student']::text[] OR
      target_roles @> ARRAY['faculty']::text[] OR
      target_roles @> ARRAY['admin']::text[]
    )
  );

CREATE POLICY "Admins and faculty can manage forms" ON forms
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'faculty')
  ));

-- Form submissions policies
CREATE POLICY "Users can view own submissions" ON form_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create submissions" ON form_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft submissions" ON form_submissions
  FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins and faculty can view all submissions" ON form_submissions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'faculty')
  ));

-- Announcements policies
CREATE POLICY "Users can view announcements" ON announcements
  FOR SELECT USING (
    target_roles @> ARRAY['student']::text[] OR
    target_roles @> ARRAY['faculty']::text[] OR
    target_roles @> ARRAY['admin']::text[]
  );

CREATE POLICY "Admins and faculty can manage announcements" ON announcements
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'faculty')
  ));

-- Events policies
CREATE POLICY "Users can view events" ON events
  FOR SELECT USING (
    target_roles @> ARRAY['student']::text[] OR
    target_roles @> ARRAY['faculty']::text[] OR
    target_roles @> ARRAY['admin']::text[]
  );

CREATE POLICY "Admins and faculty can manage events" ON events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'faculty')
  ));

-- Event registrations policies
CREATE POLICY "Users can view own registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create registrations" ON event_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own registrations" ON event_registrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all registrations" ON event_registrations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);
