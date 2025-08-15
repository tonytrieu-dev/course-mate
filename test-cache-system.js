#!/usr/bin/env node

/**
 * Cache System Test Script
 * 
 * Tests the file fingerprint cache system independently to verify
 * that database operations work correctly.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Configure Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Mock fingerprint data for testing
const mockFingerprint = {
  contentHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 64 chars exactly
  filename: 'test-syllabus.pdf', 
  size: 12345,
  mimeType: 'application/pdf'
};

console.log('Hash length:', mockFingerprint.contentHash.length);

async function testCacheSystem() {
  console.log('🚀 Testing Cache System...\n');

  try {
    // Test 1: Check table structure
    console.log('1️⃣ Testing table structure...');
    const { data: columns, error: structError } = await supabase
      .rpc('get_table_columns', { table_name: 'file_fingerprints' })
      .limit(1);

    if (structError) {
      console.log('⚠️ Cannot check table structure (RPC not available), proceeding with direct test...');
    } else {
      console.log('✅ Table structure accessible');
    }

    // Test 2: Clean up any existing test data
    console.log('\n2️⃣ Cleaning up existing test data...');
    const { error: deleteError } = await supabase
      .from('file_fingerprints')
      .delete()
      .eq('content_hash', mockFingerprint.contentHash);
    
    if (deleteError) {
      console.log(`⚠️ Cleanup warning: ${deleteError.message}`);
    } else {
      console.log('✅ Test data cleaned up');
    }

    // Test 3: Test cache insertion
    console.log('\n3️⃣ Testing cache insertion...');
    console.log('🔍 ATTEMPTING DATABASE INSERT (Test Script)');
    
    const insertData = {
      content_hash: mockFingerprint.contentHash,
      file_name: mockFingerprint.filename,
      file_size: mockFingerprint.size,
      mime_type: mockFingerprint.mimeType,
      processing_status: 'pending',
      class_id: null,
      user_id: null,
      use_count: 0,
      embeddings_created: false,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('file_fingerprints')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ DATABASE INSERT FAILED:', insertError.message);
      console.error('Error Details:', {
        code: insertError.code,
        detail: insertError.detail,
        hint: insertError.hint
      });
      return false;
    }

    console.log('✅ DATABASE INSERT SUCCESSFUL');
    console.log('Inserted Record:', {
      id: insertResult.id,
      contentHash: insertResult.content_hash.substring(0, 12) + '...',
      fileName: insertResult.file_name,
      status: insertResult.processing_status
    });

    // Test 4: Test cache lookup
    console.log('\n4️⃣ Testing cache lookup...');
    const { data: lookupResult, error: lookupError } = await supabase
      .from('file_fingerprints')
      .select('*')
      .eq('content_hash', mockFingerprint.contentHash)
      .single();

    if (lookupError) {
      console.error('❌ CACHE LOOKUP FAILED:', lookupError.message);
      return false;
    }

    console.log('✅ CACHE LOOKUP SUCCESSFUL');
    console.log('Found Record:', {
      id: lookupResult.id,
      contentHash: lookupResult.content_hash.substring(0, 12) + '...',
      fileName: lookupResult.file_name,
      status: lookupResult.processing_status,
      created: new Date(lookupResult.created_at).toLocaleString()
    });

    // Test 5: Test duplicate handling
    console.log('\n5️⃣ Testing duplicate handling...');
    const { data: duplicateResult, error: duplicateError } = await supabase
      .from('file_fingerprints')
      .insert(insertData)
      .select()
      .single();

    if (duplicateError) {
      if (duplicateError.code === '23505') {
        console.log('✅ DUPLICATE HANDLING WORKING - Unique constraint enforced');
      } else {
        console.error('❌ UNEXPECTED DUPLICATE ERROR:', duplicateError.message);
        return false;
      }
    } else {
      console.error('❌ DUPLICATE CHECK FAILED - Should have been rejected');
      return false;
    }

    // Test 6: Final cleanup
    console.log('\n6️⃣ Final cleanup...');
    const { error: finalCleanupError } = await supabase
      .from('file_fingerprints')
      .delete()
      .eq('content_hash', mockFingerprint.contentHash);
    
    if (finalCleanupError) {
      console.log(`⚠️ Final cleanup warning: ${finalCleanupError.message}`);
    } else {
      console.log('✅ Final cleanup completed');
    }

    console.log('\n🎉 ALL CACHE SYSTEM TESTS PASSED!');
    console.log('\nCache system is ready for production use.');
    return true;

  } catch (error) {
    console.error('\n💥 CACHE SYSTEM TEST FAILED:');
    console.error(error.message);
    return false;
  }
}

// Run the test
testCacheSystem().then(success => {
  console.log(`\n${success ? '✅ Test Result: SUCCESS' : '❌ Test Result: FAILURE'}`);
  process.exit(success ? 0 : 1);
});