-- Create the faculty_courses table first
CREATE TABLE IF NOT EXISTS faculty_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'instructor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, course_id)
);

-- Create class_sessions table
CREATE TABLE IF NOT EXISTS class_sessions (
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

-- Create faculty_settings table
CREATE TABLE IF NOT EXISTS faculty_settings (
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

-- Create profiles table
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

-- Enable RLS
ALTER TABLE faculty_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Faculty can view their courses" ON faculty_courses
  FOR SELECT USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can manage their courses" ON faculty_courses
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can manage their sessions" ON class_sessions
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can manage their settings" ON faculty_settings
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Insert sample data
-- Assign faculty to courses
INSERT INTO faculty_courses (faculty_id, course_id, role) 
SELECT 
  u.id,
  c.id,
  'instructor'
FROM auth.users u
CROSS JOIN courses c
WHERE u.raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT (faculty_id, course_id) DO NOTHING;

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

-- Insert sample profiles
INSERT INTO profiles (id, full_name, phone, bio)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  '+1-555-' || lpad((random() * 9999)::int::text, 4, '0'),
  'Faculty member at the university.'
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT (id) DO NOTHING;
