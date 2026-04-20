-- P0-5: Prevent Owner Role Bypasses explicitly limiting all accounts universally avoiding the Default Supabase bypass vulnerabilities!
ALTER TABLE listings FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE sellers FORCE ROW LEVEL SECURITY;
ALTER TABLE disputes FORCE ROW LEVEL SECURITY;
