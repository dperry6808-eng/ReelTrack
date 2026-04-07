import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sfmbdpwcanezkrkwreqq.supabase.co';
const supabaseAnonKey = 'sb_publishable_2FZe7cXllhAm7UX_cPOQdw_w-8byqER';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);