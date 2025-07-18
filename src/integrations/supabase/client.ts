// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vjcecvadjbeiolcqsyof.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});