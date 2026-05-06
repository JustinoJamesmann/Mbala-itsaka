-- Delete user profile from profiles table
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'bienvenuesweethome@gmail.com'
);

-- Note: You also need to delete the user from Supabase Auth
-- Go to Supabase Dashboard -> Authentication -> Users
-- Find bienvenuesweethome@gmail.com and click delete
-- Or use the Supabase CLI: supabase auth delete bienvenuesweethome@gmail.com
