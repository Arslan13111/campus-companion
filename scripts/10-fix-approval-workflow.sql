-- Drop and recreate the approval functions with proper logic
DROP FUNCTION IF EXISTS approve_registration_request(UUID, UUID);
DROP FUNCTION IF EXISTS reject_registration_request(UUID, UUID);

-- Create improved approval function
CREATE OR REPLACE FUNCTION approve_registration_request(
  request_id UUID,
  admin_id UUID
) RETURNS void AS $$
DECLARE
  request_record registration_requests%ROWTYPE;
BEGIN
  -- Get the registration request
  SELECT * INTO request_record 
  FROM registration_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found or already processed';
  END IF;
  
  -- Create the user account
  INSERT INTO users (
    id,
    email,
    full_name,
    role,
    student_id,
    department,
    year_level,
    phone,
    is_approved,
    approved_by,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    request_record.email,
    request_record.full_name,
    request_record.role,
    request_record.student_id,
    request_record.department,
    request_record.year_level,
    request_record.phone,
    true,
    admin_id,
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Update the registration request
  UPDATE registration_requests 
  SET 
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;
  
  -- Create notification for the approved user
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
  ) VALUES (
    admin_id, -- Send to admin for now, will be updated when user logs in
    'Registration Approved',
    'Registration request for ' || request_record.full_name || ' has been approved.',
    'approval',
    false,
    NOW()
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create reject function
CREATE OR REPLACE FUNCTION reject_registration_request(
  request_id UUID,
  admin_id UUID
) RETURNS void AS $$
BEGIN
  -- Update the registration request
  UPDATE registration_requests 
  SET 
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found or already processed';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
  ) VALUES (
    admin_id,
    'Registration Rejected',
    'A registration request has been rejected.',
    'rejection',
    false,
    NOW()
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_registration_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_registration_request(UUID, UUID) TO authenticated;
