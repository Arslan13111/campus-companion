-- Insert admin user directly (this will be auto-confirmed)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '00000000-0000-0000-0000-000000000000',
    'arslanmunawar1311@gmail.com',
    crypt('124578', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Arslan Munawar", "role": "admin"}'::jsonb
) ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('124578', gen_salt('bf')),
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    updated_at = NOW();

-- Ensure admin user exists in users table
INSERT INTO public.users (id, email, full_name, role, is_approved, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'arslanmunawar1311@gmail.com', 'Arslan Munawar', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_approved = true,
  updated_at = NOW();

-- Sample forms
INSERT INTO public.forms (id, title, description, type, category, questions, target_roles, status, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'Course Feedback Form', 'Provide feedback about your courses', 'feedback', 'Academic', '[
    {"id": "1", "type": "text", "question": "Which course are you providing feedback for?", "required": true},
    {"id": "2", "type": "rating", "question": "How would you rate the course content?", "required": true, "scale": 5},
    {"id": "3", "type": "textarea", "question": "What did you like most about the course?", "required": false},
    {"id": "4", "type": "textarea", "question": "What could be improved?", "required": false}
]', ARRAY['student'], 'active', '550e8400-e29b-41d4-a716-446655440000'),

('22222222-2222-2222-2222-222222222222', 'Campus Facilities Survey', 'Help us improve campus facilities', 'survey', 'Campus Life', '[
    {"id": "1", "type": "multiple_choice", "question": "Which facilities do you use most often?", "required": true, "options": ["Library", "Cafeteria", "Gym", "Computer Lab", "Study Rooms"]},
    {"id": "2", "type": "rating", "question": "How satisfied are you with the library services?", "required": true, "scale": 5},
    {"id": "3", "type": "rating", "question": "How satisfied are you with the cafeteria?", "required": true, "scale": 5},
    {"id": "4", "type": "textarea", "question": "Any suggestions for improvement?", "required": false}
]', ARRAY['student', 'faculty'], 'active', '550e8400-e29b-41d4-a716-446655440000'),

('33333333-3333-3333-3333-333333333333', 'IT Support Request', 'Request technical support', 'request', 'IT Support', '[
    {"id": "1", "type": "text", "question": "What type of issue are you experiencing?", "required": true},
    {"id": "2", "type": "multiple_choice", "question": "Priority Level", "required": true, "options": ["Low", "Medium", "High", "Critical"]},
    {"id": "3", "type": "textarea", "question": "Please describe the issue in detail", "required": true},
    {"id": "4", "type": "text", "question": "Your contact number", "required": false}
]', ARRAY['student', 'faculty'], 'active', '550e8400-e29b-41d4-a716-446655440000');

-- Sample announcements
INSERT INTO public.announcements (title, content, target_roles, is_urgent, created_by) VALUES
('Welcome to Campus Portal', 'Welcome to the new university campus portal. Please complete your profile and explore the available features.', ARRAY['student', 'faculty'], false, '550e8400-e29b-41d4-a716-446655440000'),
('System Maintenance Notice', 'The portal will undergo maintenance on Sunday from 2 AM to 4 AM. Please save your work accordingly.', ARRAY['student', 'faculty', 'admin'], true, '550e8400-e29b-41d4-a716-446655440000'),
('Welcome to the New Academic Year', 'We are excited to welcome all students and faculty to the new academic year. Please check your schedules and prepare for an amazing year ahead!', ARRAY['student', 'faculty'], false, '550e8400-e29b-41d4-a716-446655440000'),
('Library Hours Extended', 'The library will now be open 24/7 during exam periods. Please bring your student ID for after-hours access.', ARRAY['student'], true, '550e8400-e29b-41d4-a716-446655440000'),
('Faculty Meeting Scheduled', 'All faculty members are required to attend the monthly meeting on Friday at 2 PM in the main conference room.', ARRAY['faculty'], false, '550e8400-e29b-41d4-a716-446655440000');

-- Sample events
INSERT INTO public.events (title, description, location, start_time, end_time, target_roles, max_participants, created_by) VALUES
('Orientation Week', 'Welcome new students to the university', 'Main Auditorium', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', ARRAY['student'], 500, '550e8400-e29b-41d4-a716-446655440000'),
('Faculty Meeting', 'Monthly faculty coordination meeting', 'Conference Room A', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours', ARRAY['faculty', 'admin'], 50, '550e8400-e29b-41d4-a716-446655440000'),
('Career Fair', 'Meet with potential employers and explore career opportunities', 'Student Center', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '6 hours', ARRAY['student'], 1000, '550e8400-e29b-41d4-a716-446655440000'),
('Orientation Day', 'Welcome event for new students. Learn about campus facilities, meet your peers, and get familiar with university life.', 'Main Auditorium', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '4 hours', ARRAY['student'], 500, '550e8400-e29b-41d4-a716-446655440000'),
('Career Fair 2024', 'Meet with top employers and explore career opportunities. Bring your resume and dress professionally.', 'Sports Complex', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '6 hours', ARRAY['student'], 1000, '550e8400-e29b-41d4-a716-446655440000'),
('Research Symposium', 'Annual research presentation by faculty and graduate students. Open to all university members.', 'Science Building', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '8 hours', ARRAY['student', 'faculty'], 200, '550e8400-e29b-41d4-a716-446655440000');

-- Sample courses
INSERT INTO public.courses (code, name, description, credits, department, semester, year, instructor_id) VALUES
('CS101', 'Introduction to Computer Science', 'Basic concepts of programming and computer science', 3, 'Computer Science', 'Fall', 2024, '550e8400-e29b-41d4-a716-446655440000'),
('MATH201', 'Calculus I', 'Differential and integral calculus', 4, 'Mathematics', 'Fall', 2024, '550e8400-e29b-41d4-a716-446655440000'),
('ENG101', 'English Composition', 'Academic writing and communication skills', 3, 'English', 'Fall', 2024, '550e8400-e29b-41d4-a716-446655440000');
