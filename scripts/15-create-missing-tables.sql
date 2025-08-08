-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Create faculty_settings table with proper structure
DROP TABLE IF EXISTS faculty_settings CASCADE;
CREATE TABLE faculty_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  office_hours JSONB DEFAULT '[]',
  office_location VARCHAR(255),
  phone VARCHAR(20),
  bio TEXT,
  research_interests TEXT[],
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "assignments": true, "grades": true}',
  grading_scale JSONB DEFAULT '{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty_courses table with proper foreign key
DROP TABLE IF EXISTS faculty_courses CASCADE;
CREATE TABLE faculty_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'instructor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, course_id)
);

-- Create class_sessions table
DROP TABLE IF EXISTS class_sessions CASCADE;
CREATE TABLE class_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  session_type VARCHAR(50) DEFAULT 'lecture',
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'absent',
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by UUID REFERENCES auth.users(id),
  UNIQUE(session_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_faculty_settings_faculty_id ON faculty_settings(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_courses_faculty_id ON faculty_courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_courses_course_id ON faculty_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_course_id ON class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_faculty_id ON class_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);

-- Enable RLS on all tables
ALTER TABLE faculty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for faculty_settings
DROP POLICY IF EXISTS "Faculty can manage their settings" ON faculty_settings;
DROP POLICY IF EXISTS "Users can view faculty settings" ON faculty_settings;

CREATE POLICY "Faculty can manage their settings" ON faculty_settings
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Users can view faculty settings" ON faculty_settings
  FOR SELECT USING (true);

-- Create RLS policies for faculty_courses
DROP POLICY IF EXISTS "Faculty can view their courses" ON faculty_courses;
DROP POLICY IF EXISTS "Faculty can manage their courses" ON faculty_courses;
DROP POLICY IF EXISTS "Students can view faculty courses" ON faculty_courses;

CREATE POLICY "Faculty can view their courses" ON faculty_courses
  FOR SELECT USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can manage their courses" ON faculty_courses
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Students can view faculty courses" ON faculty_courses
  FOR SELECT USING (true);

-- Create RLS policies for class_sessions
DROP POLICY IF EXISTS "Faculty can manage their sessions" ON class_sessions;
DROP POLICY IF EXISTS "Students can view sessions for their courses" ON class_sessions;

CREATE POLICY "Faculty can manage their sessions" ON class_sessions
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Students can view sessions for their courses" ON class_sessions
  FOR SELECT USING (
    course_id IN (
      SELECT course_id FROM enrollments WHERE student_id = auth.uid()
    )
  );

-- Create RLS policies for attendance
DROP POLICY IF EXISTS "Faculty can manage attendance for their sessions" ON attendance;
DROP POLICY IF EXISTS "Students can view their attendance" ON attendance;

CREATE POLICY "Faculty can manage attendance for their sessions" ON attendance
  FOR ALL USING (
    session_id IN (
      SELECT id FROM class_sessions WHERE faculty_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their attendance" ON attendance
  FOR SELECT USING (student_id = auth.uid());

-- Insert sample data for profiles (for existing users)
INSERT INTO profiles (id, full_name, phone, bio)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  '+1-555-' || lpad((random() * 9999)::int::text, 4, '0'),
  'Faculty member at the university with expertise in various subjects.'
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT (id) DO NOTHING;

-- Insert sample faculty settings
INSERT INTO faculty_settings (faculty_id, office_hours, office_location, phone, bio, research_interests)
SELECT 
  id,
  '[{"day": "Monday", "start": "10:00", "end": "12:00"}, {"day": "Wednesday", "start": "14:00", "end": "16:00"}]'::jsonb,
  'Office ' || (200 + (random() * 100)::int),
  '+1-555-' || lpad((random() * 9999)::int::text, 4, '0'),
  'Experienced faculty member with expertise in computer science and education.',
  ARRAY['Machine Learning', 'Data Science', 'Software Engineering']
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT (faculty_id) DO NOTHING;

-- Insert sample faculty courses (assign faculty to courses)
INSERT INTO faculty_courses (faculty_id, course_id, role) 
SELECT 
  u.id,
  c.id,
  'instructor'
FROM auth.users u
CROSS JOIN courses c
WHERE u.raw_user_meta_data->>'role' = 'faculty'
AND c.id IN (SELECT id FROM courses LIMIT 3) -- Limit to first 3 courses per faculty
ON CONFLICT (faculty_id, course_id) DO NOTHING;

-- Insert sample class sessions
INSERT INTO class_sessions (course_id, faculty_id, title, description, session_date, start_time, end_time, location, session_type)
SELECT 
  fc.course_id,
  fc.faculty_id,
  'Week ' || generate_series(1, 8) || ' - ' || c.name,
  'Regular class session for ' || c.name,
  CURRENT_DATE + (generate_series(1, 8) * INTERVAL '1 week'),
  '09:00:00',
  '10:30:00',
  'Room ' || (100 + (random() * 50)::int),
  'lecture'
FROM faculty_courses fc
JOIN courses c ON fc.course_id = c.id
LIMIT 50;

-- Create function to get enrollment count
CREATE OR REPLACE FUNCTION get_enrollment_count(course_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM enrollments WHERE course_id = course_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
