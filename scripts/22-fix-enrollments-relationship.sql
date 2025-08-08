-- Fix enrollments relationship and create missing tables
DO $$
BEGIN
    -- Check if enrollments table exists and has proper relationships
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        RAISE NOTICE 'Enrollments table exists, checking relationships...';
        
        -- Add foreign key to courses if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'enrollments_course_id_fkey'
        ) THEN
            ALTER TABLE enrollments ADD CONSTRAINT enrollments_course_id_fkey 
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint for course_id';
        END IF;
        
        -- Add foreign key to auth.users if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'enrollments_student_id_fkey'
        ) THEN
            -- Check if column is student_id or user_id
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'student_id') THEN
                ALTER TABLE enrollments ADD CONSTRAINT enrollments_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                RAISE NOTICE 'Added foreign key constraint for student_id';
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'user_id') THEN
                ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                RAISE NOTICE 'Added foreign key constraint for user_id';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'Enrollments table does not exist, creating it...';
        CREATE TABLE enrollments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
            enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
            grade TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(student_id, course_id)
        );
        
        -- Add RLS
        ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
        
        -- Policies for enrollments
        CREATE POLICY "Students can view their own enrollments" ON enrollments
            FOR SELECT USING (auth.uid() = student_id);
            
        CREATE POLICY "Faculty can view enrollments for their courses" ON enrollments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM faculty_courses fc 
                    WHERE fc.course_id = enrollments.course_id 
                    AND fc.faculty_id = auth.uid()
                )
            );
            
        CREATE POLICY "Admins can manage all enrollments" ON enrollments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;
    
    -- Create faculty_events table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faculty_events') THEN
        CREATE TABLE faculty_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            location TEXT,
            event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'conference', 'workshop', 'seminar', 'other')),
            faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE faculty_events ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Faculty can manage their own events" ON faculty_events
            FOR ALL USING (auth.uid() = faculty_id);
            
        CREATE POLICY "Admins can manage all events" ON faculty_events
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;
    
    -- Create faculty_forms table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faculty_forms') THEN
        CREATE TABLE faculty_forms (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            form_type TEXT DEFAULT 'survey' CHECK (form_type IN ('survey', 'feedback', 'evaluation', 'quiz')),
            questions JSONB NOT NULL DEFAULT '[]',
            faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
            due_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE faculty_forms ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Faculty can manage their own forms" ON faculty_forms
            FOR ALL USING (auth.uid() = faculty_id);
            
        CREATE POLICY "Students can view published forms for their courses" ON faculty_forms
            FOR SELECT USING (
                status = 'published' AND (
                    course_id IS NULL OR
                    EXISTS (
                        SELECT 1 FROM enrollments e 
                        WHERE e.course_id = faculty_forms.course_id 
                        AND e.student_id = auth.uid()
                    )
                )
            );
            
        CREATE POLICY "Admins can manage all forms" ON faculty_forms
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE id = auth.uid() 
                    AND raw_user_meta_data->>'role' = 'admin'
                )
            );
    END IF;
    
    -- Add some sample data
    INSERT INTO enrollments (student_id, course_id, status) 
    SELECT 
        u.id,
        c.id,
        'active'
    FROM auth.users u
    CROSS JOIN courses c
    WHERE u.raw_user_meta_data->>'role' = 'student'
    AND c.status = 'active'
    LIMIT 20
    ON CONFLICT (student_id, course_id) DO NOTHING;
    
    RAISE NOTICE 'Database relationships fixed successfully!';
END $$;
