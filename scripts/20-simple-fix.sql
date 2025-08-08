-- Let's first check what tables and columns exist
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING TABLES ===';
    
    -- Check enrollments table structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments' AND table_schema = 'public') THEN
        RAISE NOTICE 'Enrollments table exists with columns:';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'enrollments' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
        END LOOP;
    ELSE
        RAISE NOTICE 'Enrollments table does not exist';
    END IF;
    
    -- Check courses table structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses' AND table_schema = 'public') THEN
        RAISE NOTICE 'Courses table exists';
    ELSE
        RAISE NOTICE 'Courses table does not exist';
    END IF;
END $$;

-- Create missing tables with simple structure first
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

-- Create faculty_courses table - this is the key missing table
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

-- Create assignments table
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

-- Create submissions table - using student_id to be safe
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  grade DECIMAL(5,2),
  feedback TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "profiles_policy" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "faculty_settings_policy" ON faculty_settings FOR ALL USING (faculty_id = auth.uid());
CREATE POLICY "faculty_courses_policy" ON faculty_courses FOR ALL USING (faculty_id = auth.uid());
CREATE POLICY "class_sessions_policy" ON class_sessions FOR ALL USING (faculty_id = auth.uid());
CREATE POLICY "assignments_policy" ON assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM faculty_courses fc WHERE fc.course_id = assignments.course_id AND fc.faculty_id = auth.uid())
);
CREATE POLICY "submissions_policy" ON submissions FOR ALL USING (
  student_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM assignments a 
    JOIN faculty_courses fc ON a.course_id = fc.course_id 
    WHERE a.id = submissions.assignment_id AND fc.faculty_id = auth.uid()
  )
);

-- Insert basic sample data
INSERT INTO profiles (id, full_name, bio)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'University member'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Insert faculty settings for faculty users
INSERT INTO faculty_settings (faculty_id, office_location, bio)
SELECT 
  id,
  'Office 201',
  'Faculty member'
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT (faculty_id) DO NOTHING;

-- Assign all faculty to all courses (simple approach)
INSERT INTO faculty_courses (faculty_id, course_id, role) 
SELECT 
  u.id,
  c.id,
  'instructor'
FROM auth.users u
CROSS JOIN courses c
WHERE u.raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT (faculty_id, course_id) DO NOTHING;

-- Create some sample assignments
INSERT INTO assignments (course_id, title, description, due_date)
SELECT 
  id,
  'Sample Assignment',
  'This is a sample assignment for ' || name,
  NOW() + interval '1 week'
FROM courses
ON CONFLICT DO NOTHING;

-- Create some sample class sessions
INSERT INTO class_sessions (course_id, faculty_id, title, description, session_date, start_time, end_time, location)
SELECT 
  fc.course_id,
  fc.faculty_id,
  'Introduction Session',
  'Course introduction and overview',
  CURRENT_DATE + interval '1 day',
  '09:00'::time,
  '10:30'::time,
  'Room 101'
FROM faculty_courses fc
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_faculty_courses_faculty_id ON faculty_courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_courses_course_id ON faculty_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_course_id ON class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);

SELECT 'Database setup completed successfully!' as result;
