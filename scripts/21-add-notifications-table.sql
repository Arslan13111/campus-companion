-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
DROP POLICY IF EXISTS "notifications_policy" ON notifications;
CREATE POLICY "notifications_policy" ON notifications 
FOR ALL USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Insert sample notifications for faculty users
INSERT INTO notifications (user_id, title, message, type, read)
SELECT 
  u.id,
  'Welcome to Faculty Portal',
  'Welcome to the faculty portal! You can now manage your courses, students, and assignments.',
  'welcome',
  false
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, read)
SELECT 
  u.id,
  'New Assignment Submission',
  'You have new assignment submissions to review.',
  'assignment',
  false
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, read)
SELECT 
  u.id,
  'Course Schedule Updated',
  'Your course schedule has been updated for the current semester.',
  'schedule',
  true
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'faculty'
ON CONFLICT DO NOTHING;

SELECT 'Notifications table created and sample data added!' as result;
