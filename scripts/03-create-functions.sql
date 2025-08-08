-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, is_approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        CASE 
            WHEN NEW.email = 'arslanmunawar1311@gmail.com' THEN true
            ELSE false
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to approve registration request
CREATE OR REPLACE FUNCTION public.approve_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
    request_record RECORD;
    auth_user_id UUID;
BEGIN
    -- Get the registration request
    SELECT * INTO request_record 
    FROM public.registration_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found or already processed';
    END IF;
    
    -- Find the auth user by email
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = request_record.email;
    
    IF FOUND THEN
        -- Update the user record
        UPDATE public.users 
        SET 
            full_name = request_record.full_name,
            role = request_record.role,
            student_id = request_record.student_id,
            department = request_record.department,
            year_level = request_record.year_level,
            phone = request_record.phone,
            is_approved = true,
            updated_at = NOW()
        WHERE id = auth_user_id;
        
        -- Update the registration request
        UPDATE public.registration_requests 
        SET 
            status = 'approved',
            reviewed_at = NOW(),
            reviewed_by = admin_id
        WHERE id = request_id;
        
        -- Create notification for the user
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
            auth_user_id,
            'Registration Approved',
            'Your registration has been approved. You can now access the portal.',
            'success'
        );
    ELSE
        RAISE EXCEPTION 'Auth user not found for email: %', request_record.email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject registration request
CREATE OR REPLACE FUNCTION public.reject_registration_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.registration_requests 
    SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = admin_id
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration request not found or already processed';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.users),
        'pending_registrations', (SELECT COUNT(*) FROM public.registration_requests WHERE status = 'pending'),
        'active_forms', (SELECT COUNT(*) FROM public.forms WHERE status = 'active'),
        'total_submissions', (SELECT COUNT(*) FROM public.form_submissions),
        'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE start_time > NOW()),
        'users_by_role', (
            SELECT json_object_agg(role, count)
            FROM (
                SELECT role, COUNT(*) as count
                FROM public.users
                WHERE is_approved = true
                GROUP BY role
            ) role_counts
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    target_user_id UUID,
    notification_title TEXT,
    notification_message TEXT,
    notification_type TEXT DEFAULT 'info',
    action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (target_user_id, notification_title, notification_message, notification_type, action_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true 
    WHERE id = notification_id AND user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
