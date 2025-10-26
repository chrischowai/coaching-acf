// Quick test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibzbfxzfwhwzqvwgwhvb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliemJmeHpmd2h3enF2d2d3aHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjE2MDAsImV4cCI6MjA3Njc5NzYwMH0.qq-dF-eP4MUKP6UaBW-VDhL4cwEc2ZewIWbSvwUjBaM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    console.log('Database is accessible');
    process.exit(0);
  } catch (err) {
    console.error('❌ Network error:', err.message);
    console.log('\nPossible causes:');
    console.log('1. Supabase project is paused (go to dashboard and restore it)');
    console.log('2. Internet connection issue');
    console.log('3. Firewall blocking the connection');
    process.exit(1);
  }
}

testConnection();
