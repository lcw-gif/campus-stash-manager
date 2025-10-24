-- Assign admin role to lcw@lstlkkc.edu.hk
-- First, get the user_id and insert admin role
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'lcw@lstlkkc.edu.hk';
  
  -- Only proceed if user exists
  IF target_user_id IS NOT NULL THEN
    -- Delete existing role if any
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
    
    RAISE NOTICE 'Admin role assigned to user: %', target_user_id;
  ELSE
    RAISE NOTICE 'User with email lcw@lstlkkc.edu.hk not found. Please sign up first.';
  END IF;
END $$;