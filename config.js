// Supabase Configuration
// Get these from your Supabase project settings -> API

const SUPABASE_URL = 'https://nicbvxuwkamyirqrqlbc.supabase.co';  // Replace with your Supabase URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pY2J2eHV3a2FteWlycXJxbGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjU3MzAsImV4cCI6MjA4NDg0MTczMH0.Pl94a0065WGqWBHUt1rrRod84y_qJLxIOLz2riL-f44';  // Replace with your Supabase anon key

// Initialize Supabase client (loaded from CDN in HTML)
let supabase;

function initSupabase() {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
