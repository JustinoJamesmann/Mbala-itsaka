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

async function clearDatabase() {
  console.log('Clearing database...');

  try {
    // Clear all orders
    const { error: ordersError } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ordersError) {
      console.error('Error clearing orders:', ordersError);
    } else {
      console.log('✓ Cleared all orders');
    }

    // Clear order items
    const { error: orderItemsError } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (orderItemsError) {
      console.error('Error clearing order_items:', orderItemsError);
    } else {
      console.log('✓ Cleared all order items');
    }

    // Clear all products
    const { error: productsError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (productsError) {
      console.error('Error clearing products:', productsError);
    } else {
      console.log('✓ Cleared all products');
    }

    // Clear activity logs
    const { error: activityError } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (activityError) {
      console.error('Error clearing activity logs:', activityError);
    } else {
      console.log('✓ Cleared activity logs');
    }

    console.log('\n✅ Database cleared successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearDatabase();
