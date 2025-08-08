-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'assignment' CHECK (type IN ('assignment', 'quiz', 'exam', 'project')),
    total_points INTEGER DEFAULT 100,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT false,
    instructions TEXT,
    attachments JSONB DEFAULT '[]'
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    attachments JSONB DEFAULT '[]',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES public.users(id),
    UNIQUE(assignment_id, student_id)
);

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    grade DECIMAL(5,2) NOT NULL,
    max_grade DECIMAL(5,2) NOT NULL DEFAULT 100,
    grade_type TEXT DEFAULT 'assignment' CHECK (grade_type IN ('assignment', 'quiz', 'exam', 'project', 'participation', 'final')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES public.users(id),
    comments TEXT
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    building TEXT,
    schedule_type TEXT DEFAULT 'lecture' CHECK (schedule_type IN ('lecture', 'lab', 'tutorial', 'seminar')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    assignment_reminders BOOLEAN DEFAULT true,
    grade_notifications BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    privacy_profile TEXT DEFAULT 'private' CHECK (privacy_profile IN ('public', 'private', 'friends')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course_id ON public.grades(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON public.schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Create RLS policies
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "assignments_select_all" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "assignments_insert_faculty" ON public.assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "assignments_update_faculty" ON public.assignments FOR UPDATE USING (true);

-- Assignment submissions policies
CREATE POLICY "submissions_select_own" ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert_own" ON public.assignment_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update_own" ON public.assignment_submissions FOR UPDATE USING (true);

-- Grades policies
CREATE POLICY "grades_select_own" ON public.grades FOR SELECT USING (true);
CREATE POLICY "grades_insert_faculty" ON public.grades FOR INSERT WITH CHECK (true);
CREATE POLICY "grades_update_faculty" ON public.grades FOR UPDATE USING (true);

-- Schedules policies
CREATE POLICY "schedules_select_all" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "schedules_insert_faculty" ON public.schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "schedules_update_faculty" ON public.schedules FOR UPDATE USING (true);

-- User settings policies
CREATE POLICY "user_settings_select_own" ON public.user_settings FOR SELECT USING (true);
CREATE POLICY "user_settings_insert_own" ON public.user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "user_settings_update_own" ON public.user_settings FOR UPDATE USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.courses (code, name, description, credits, department, semester, year) VALUES
('CS101', 'Introduction to Computer Science', 'Basic programming concepts and problem solving', 3, 'Computer Science', 'Fall', 2024),
('MATH201', 'Calculus II', 'Advanced calculus concepts including integration', 4, 'Mathematics', 'Fall', 2024),
('ENG102', 'English Composition', 'Academic writing and communication skills', 3, 'English', 'Fall', 2024),
('PHYS101', 'General Physics I', 'Mechanics and thermodynamics', 4, 'Physics', 'Fall', 2024)
ON CONFLICT (code) DO NOTHING;

-- Insert sample assignments
INSERT INTO public.assignments (course_id, title, description, type, total_points, due_date, is_published) 
SELECT 
    c.id,
    'Assignment ' || generate_series(1, 3),
    'Complete the assigned problems and submit your solutions.',
    'assignment',
    100,
    NOW() + (generate_series(1, 3) || ' weeks')::interval,
    true
FROM public.courses c
WHERE c.code IN ('CS101', 'MATH201', 'ENG102', 'PHYS101');

-- Insert sample schedules
INSERT INTO public.schedules (course_id, day_of_week, start_time, end_time, room, building, schedule_type)
SELECT 
    c.id,
    CASE 
        WHEN c.code = 'CS101' THEN 1 -- Monday
        WHEN c.code = 'MATH201' THEN 2 -- Tuesday
        WHEN c.code = 'ENG102' THEN 3 -- Wednesday
        WHEN c.code = 'PHYS101' THEN 4 -- Thursday
    END,
    '09:00:00'::time,
    '10:30:00'::time,
    'Room ' || (100 + ROW_NUMBER() OVER()),
    'Main Building',
    'lecture'
FROM public.courses c
WHERE c.code IN ('CS101', 'MATH201', 'ENG102', 'PHYS101');

-- Insert sample course enrollments for students
INSERT INTO public.course_enrollments (course_id, student_id, status)
SELECT 
    c.id,
    u.id,
    'active'
FROM public.courses c
CROSS JOIN public.users u
WHERE u.role = 'student' AND c.code IN ('CS101', 'MATH201', 'ENG102', 'PHYS101')
ON CONFLICT (course_id, student_id) DO NOTHING;
