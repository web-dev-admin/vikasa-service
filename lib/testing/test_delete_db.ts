import { supabase } from '../supabase/client';
import crypto from 'crypto';

async function testDelete() {
  console.log('Testing Supabase Delete operation...');
  const testId = `test-del-${Date.now()}`;
  const validUuid = crypto.randomUUID();
  
  // 1. Insert test row
  const { data: insData, error: insErr } = await supabase.from('service_requests').insert([{
    id: testId,
    request_number: 999999,
    customer_name: 'Test Delete Customer',
    customer_phone: '9842100000',
    service_id: 'srv-electrical',
    service_name: 'Electrical & Lighting',
    category_id: 'cat-electrical',
    category_name: 'Electrical',
    district: 'Erode',
    formatted_address: 'Erode, Tamil Nadu',
    latitude: 11.341,
    longitude: 77.717,
    status: 'NEW',
    tracking_token: validUuid
  }]).select();

  if (insErr) {
    console.error('Insert error:', insErr);
    return;
  }
  console.log('Inserted test row with id:', insData[0]?.id);

  // 2. Attempt delete
  const { data: delData, error: delErr } = await supabase.from('service_requests').delete().eq('id', testId).select();
  if (delErr) {
    console.error('DELETE ERROR:', delErr);
  } else {
    console.log('DELETE SUCCESS! Rows affected:', delData?.length);
  }

  // 3. Verify it is gone
  const { data: checkData, error: checkErr } = await supabase.from('service_requests').select('*').eq('id', testId);
  console.log('Check remaining rows count:', checkData?.length);
}

testDelete();
