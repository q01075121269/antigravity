import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseKey) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );
}

// 수퍼베이스 데이터베이스와 연결하는 핵심 통신 객체입니다.
export const supabase = createClient(supabaseUrl, supabaseKey);