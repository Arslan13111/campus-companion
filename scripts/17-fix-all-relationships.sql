-- First, let's check what tables exist and create missing ones

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

-- Create faculty_settings table if it doesn't exist
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

-- Create faculty_courses table if it doesn't exist
CREATE TABLE IF NOT EXISTS faculty_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'instructor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, course_id)
);

-- Create class_sessions table if it doesn't exist
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

-- Create assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER DEFAULT 100,
  assignment_type VARCHAR(50) DEFAULT 'homework',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  grade DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Create student_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "assignments": true, "grades": true}',
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  grade DECIMAL(5,2) NOT NULL,
  max_points INTEGER DEFAULT 100,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- Create schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, day_of_week, start_time)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Faculty can manage their settings" ON faculty_settings;
DROP POLICY IF EXISTS "Faculty can view their courses" ON faculty_courses;
DROP POLICY IF EXISTS "Faculty can manage their courses" ON faculty_courses;
DROP POLICY IF EXISTS "Faculty can manage their sessions" ON class_sessions;
DROP POLICY IF EXISTS "Faculty can view assignments" ON assignments;
DROP POLICY IF EXISTS "Faculty can manage assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view submissions" ON submissions;
DROP POLICY IF EXISTS "Faculty can view submissions" ON submissions;
DROP POLICY IF EXISTS "Students can manage their settings" ON student_settings;
DROP POLICY IF EXISTS "Students can view their grades" ON grades;
DROP POLICY IF EXISTS "Faculty can manage grades" ON grades;
DROP POLICY IF EXISTS "Students can view their schedules" ON schedules;

-- Create comprehensive policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Faculty can manage their settings" ON faculty_settings
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can view their courses" ON faculty_courses
  FOR SELECT USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can manage their courses" ON faculty_courses
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can manage their sessions" ON class_sessions
  FOR ALL USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can view assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty_courses fc 
      WHERE fc.course_id = assignments.course_id 
      AND fc.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can manage assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM faculty_courses fc 
      WHERE fc.course_id = assignments.course_id 
      AND fc.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Students can view submissions" ON submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can manage submissions" ON submissions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Faculty can view submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN faculty_courses fc ON a.course_id = fc.course_id
      WHERE a.id = submissions.assignment_id 
      AND fc.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can update submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN faculty_courses fc ON a.course_id = fc.course_id
      WHERE a.id = submissions.assignment_id 
      AND fc.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage their settings" ON student_settings
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Students can view their grades" ON grades
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Faculty can manage grades" ON grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM faculty_courses fc 
      WHERE fc.course_id = grades.course_id 
      AND fc.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their schedules" ON schedules
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can manage their schedules" ON schedules
  FOR ALL USING (student_id = auth.uid());

-- Insert sample data
-- Create profiles for all users
INSERT INTO profiles (id, full_name, phone, bio)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  '+1-555-' || lpad((random() * 9999)::int::text, 4, '0'),
  CASE 
    WHEN raw_user_meta_data->>'role' = 'faculty' THEN 'Faculty member at the university.'
    WHEN raw_user_meta_data->>'role' = 'student' THEN 'Student at the university.'
    ELSE 'University community member.'
  END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Insert faculty settings
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

-- Insert student settings
INSERT INTO student_settings (student_id)
SELECT id
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'student'
ON CONFLICT (student_id) DO NOTHING;

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

-- Create sample assignments
INSERT INTO assignments (course_id, title, description, due_date, max_points, assignment_type)
SELECT 
  c.id,
  'Assignment ' || generate_series(1, 3),
  'Sample assignment description for ' || c.name,
  NOW() + (generate_series(1, 3) * interval '1 week'),
  100,
  CASE (generate_series(1, 3) % 3)
    WHEN 1 THEN 'homework'
    WHEN 2 THEN 'quiz'
    ELSE 'project'
  END
FROM courses c;

-- Create sample class sessions
INSERT INTO class_sessions (course_id, faculty_id, title, description, session_date, start_time, end_time, location, session_type)
SELECT 
  fc.course_id,
  fc.faculty_id,
  'Session ' || generate_series(1, 5),
  'Class session for the course',
  CURRENT_DATE + (generate_series(1, 5) * interval '1 day'),
  '09:00'::time,
  '10:30'::time,
  'Room ' || (100 + (random() * 50)::int),
  'lecture'
FROM faculty_courses fc;

-- Create sample schedules for students
INSERT INTO schedules (student_id, course_id, day_of_week, start_time, end_time, location)
SELECT 
  e.student_id,
  e.course_id,
  (random() * 4 + 1)::int, -- Monday to Friday
  '09:00'::time + (random() * interval '8 hours'),
  '09:00'::time + (random() * interval '8 hours') + interval '1.5 hours',
  'Room ' || (100 + (random() * 50)::int)
FROM enrollments e;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faculty_courses_faculty_id ON faculty_courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_courses_course_id ON faculty_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_course_id ON class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_faculty_id ON class_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course_id ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_student_id ON schedules(student_id);
