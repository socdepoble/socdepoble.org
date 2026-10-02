import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
// In local dev, the anon key is in .env.local
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  console.log('Creating javillinares...');
  const { data: d1, error: e1 } = await supabase.auth.signUp({
    email: 'javillinares@gmail.com',
    password: 'password123',
  });
  console.log(e1 ? `Error: ${e1.message}` : `Success: ${d1.user.id}`);

  console.log('Creating socdepoblecom...');
  const { data: d2, error: e2 } = await supabase.auth.signUp({
    email: 'socdepoblecom@gmail.com',
    password: 'password123',
  });
  console.log(e2 ? `Error: ${e2.message}` : `Success: ${d2.user.id}`);
}

createUsers();
