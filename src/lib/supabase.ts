import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

// 빌드 타임(SSG)에 환경 변수가 없어도 크래시가 발생하지 않도록 안전한 fallback 처리
if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ [Supabase] 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)를 확인해주세요.',
    );
  }
}

// 유효한 URL이 없을 때의 안전한 fallback URL
const fallbackUrl = 'https://placeholder-project.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseKey || fallbackKey,
);