const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

async function deleteUserByEmail(email) {
  console.log(`Finding user with email: ${email}`);

  try {
    // List all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const userToDelete = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!userToDelete) {
      console.log('User not found in auth');
      process.exit(0);
    }

    console.log(`Found user: ${userToDelete.email} (ID: ${userToDelete.id})`);

    // Remove foreign key references first
    // Update categories created by this user to NULL
    const { error: categoriesError } = await supabase
      .from('categories')
      .update({ created_by: null })
      .eq('created_by', userToDelete.id);

    if (categoriesError) {
      console.error('Error updating categories:', categoriesError);
    } else {
      console.log('Removed user reference from categories');
    }

    // Update products created by this user to NULL
    const { error: productsError } = await supabase
      .from('products')
      .update({ created_by: null })
      .eq('created_by', userToDelete.id);

    if (productsError) {
      console.error('Error updating products:', productsError);
    } else {
      console.log('Removed user reference from products');
    }

    // Delete activity logs for this user
    const { error: activityLogsError } = await supabase
      .from('activity_logs')
      .delete()
      .eq('actor_id', userToDelete.id);

    if (activityLogsError) {
      console.error('Error deleting activity logs:', activityLogsError);
    } else {
      console.log('Deleted activity logs for user');
    }

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
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteUserByEmail('bienvenuesweethome@gmail.com');
