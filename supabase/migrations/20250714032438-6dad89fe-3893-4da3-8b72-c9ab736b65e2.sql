-- Create a test admin user
-- Note: This creates a user in auth.users and automatically triggers profile/role creation

-- First, let's manually insert an admin role for a test user
-- You'll need to sign up with this email first: admin@test.com
-- Then run this to make them admin:

-- This query will be run after the user signs up to promote them to admin
-- For now, let's create a function to easily promote users to admin

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    result_text TEXT;
BEGIN
    -- Find user by email
    SELECT au.id INTO target_user_id 
    FROM auth.users au 
    WHERE au.email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'User not found with email: ' || user_email;
    END IF;
    
    -- Check if user already has admin role
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
        RETURN 'User ' || user_email || ' is already an admin';
    END IF;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
    
    RETURN 'Successfully promoted ' || user_email || ' to admin';
END;
$$;