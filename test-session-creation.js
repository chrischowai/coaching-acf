import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibzbfxzfwhwzqvwgwhvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliemJmeHpmd2h3enF2dndnd2h2YiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzYxMjIxNjAwLCJleHAiOjIwNzY3OTc2MDB9.qq-dF-eP4MUKP6UaBW-VDhL4cwEc2ZewIWbSvwUjBaM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSessionCreation() {
  console.log('Testing session creation...\n');
  
  try {
    // Test 1: Create a session
    console.log('1. Creating session...');
    const { data: session, error: createError } = await supabase
      .from('coaching_sessions')
      .insert({
        session_type: 'self_coaching',
        current_stage: 1,
        is_complete: false,
        user_id: null,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating session:', createError);
      return;
    }
    
    console.log('✅ Session created:', session.id);
    
    // Test 2: Verify session exists
    console.log('\n2. Verifying session exists...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('id', session.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying session:', verifyError);
      return;
    }
    
    console.log('✅ Session verified:', verifyData.id);
    
    // Test 3: Try to save stage response
    console.log('\n3. Saving stage response...');
    const { data: stageData, error: stageError } = await supabase
      .from('stage_responses')
      .insert({
        session_id: session.id,
        stage_number: 1,
        stage_name: 'Assess the Situation',
        responses: { messages: [{ role: 'assistant', content: 'Test message' }] },
      })
      .select()
      .single();
    
    if (stageError) {
      console.error('❌ Error saving stage response:', stageError);
      return;
    }
    
    console.log('✅ Stage response saved:', stageData.id);
    
    // Test 4: Clean up
    console.log('\n4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('coaching_sessions')
      .delete()
      .eq('id', session.id);
    
    if (deleteError) {
      console.error('❌ Error deleting session:', deleteError);
      return;
    }
    
    console.log('✅ Test data cleaned up');
    console.log('\n🎉 All tests passed! Database is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSessionCreation();
