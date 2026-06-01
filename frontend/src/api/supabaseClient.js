import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wphxsxdmdxniduwzyomt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaHhzeGRtZHhuaWR1d3p5b210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDI2MTMsImV4cCI6MjA5NDAxODYxM30.zGvstSVAskqrVFwFQiIAD0lfPQL7Mip8S2k0JTcZZDQ';

export const supabase = createClient(supabaseUrl, supabaseKey);