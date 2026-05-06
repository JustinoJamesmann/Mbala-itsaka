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

async function updateUserPassword(email, newPassword) {
  console.log(`Updating password for: ${email}`);

  try {
    // List all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log('User not found in auth');
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      process.exit(1);
    }

    console.log('Successfully updated password');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserPassword('mbala.itsaka@gmail.com', 'Mba!Itsa123');
