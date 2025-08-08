# Admin Setup Guide

## Step 1: Database Setup
Run the SQL scripts in order:
1. `scripts/01-create-tables.sql`
2. `scripts/02-create-policies.sql` 
3. `scripts/03-create-functions.sql`
4. `scripts/04-seed-data.sql`

## Step 2: Create Admin User in Supabase Auth

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter:
   - Email: `arslanmunawar1311@gmail.com`
   - Password: `124578`
   - User ID: `550e8400-e29b-41d4-a716-446655440000`
   - Confirm email: Yes

### Option B: Using Supabase API (if you have service role key)
\`\`\`javascript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'arslanmunawar1311@gmail.com',
  password: '124578',
  user_metadata: {
    full_name: 'Arslan Munawar',
    role: 'admin'
  },
  email_confirm: true
})
\`\`\`

## Step 3: Run Admin Setup Script
After creating the auth user, run:
`scripts/05-create-admin-user.sql`

## Step 4: Login
You can now login with:
- Email: `arslanmunawar1311@gmail.com`
- Password: `124578`

## Admin Capabilities
As admin, you can:
- ✅ Approve/reject user registrations
- ✅ Create and manage forms
- ✅ Create announcements and events
- ✅ View all user data and submissions
- ✅ Manage system settings
- ✅ Access admin dashboard with analytics

## Troubleshooting
If login fails:
1. Ensure the user exists in Supabase Auth
2. Check that the user record exists in the `users` table
3. Verify the user has `role = 'admin'` and `is_approved = true`
4. Check browser console for any errors
