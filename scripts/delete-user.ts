import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUserByEmail(email: string) {
  console.log(`Finding user with email: ${email}`);

  // List all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }

  const userToDelete = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

  if (!userToDelete) {
    console.log('User not found');
    process.exit(0);
  }

  console.log(`Found user: ${userToDelete.email} (ID: ${userToDelete.id})`);

  // Delete from profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userToDelete.id);

  if (profileError) {
    console.error('Error deleting from profiles:', profileError);
  } else {
    console.log('Deleted from profiles table');
  }

  // Delete from auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.id);

  if (authError) {
    console.error('Error deleting from auth:', authError);
  } else {
    console.log('Deleted from auth');
  }

  console.log('User deletion complete');
}

deleteUserByEmail('bienvenuesweethome@gmail.com');
