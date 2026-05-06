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

async function createProfile(email) {
  console.log(`Creating profile for: ${email}`);

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

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      console.log('Profile already exists, updating role to admin');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin', username: 'MbalaItsaka' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        process.exit(1);
      }
    } else {
      console.log('Creating new profile');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: 'MbalaItsaka',
          role: 'admin'
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        process.exit(1);
      }
    }

    console.log('Successfully created/updated profile');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createProfile('mbala.itsaka@gmail.com');
