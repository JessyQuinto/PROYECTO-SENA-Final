import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jdmexfawmetmfabpwlfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWV4ZmF3bWV0bWZhYnB3bGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzAzMTYsImV4cCI6MjA3MDIwNjMxNn0.nb6WPz87vBq5CjZuL4LB8ZV45jeD-B-a4qzJh0j4J6g";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

try {
  const { data, error } = await client.auth.resend({ type: "signup", email: "quitojessy2222@gmail.com" });
  if (error) {
    console.error("Resend error:", error.message);
    process.exit(1);
  }
  console.log("Resend ok:", JSON.stringify(data));
  process.exit(0);
} catch (e) {
  console.error("Unexpected:", e?.message || String(e));
  process.exit(1);
}
