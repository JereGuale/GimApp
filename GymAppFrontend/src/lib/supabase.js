import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gfjwebngyzfftakbbmji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmandlYm5neXpmZnRha2JibWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjI1MzEsImV4cCI6MjA3Mzg5ODUzMX0.niC_FqHiHZ4EMNW86VpXX_ouIVsxftfXV8JgZxuCBGE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
