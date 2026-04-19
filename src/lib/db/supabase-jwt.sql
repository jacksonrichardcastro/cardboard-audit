-- Instructions for setting up Clerk JWT integration with Supabase Row Level Security (RLS)
-- 1. In Clerk Dashboard -> JWT Templates -> New Template -> Supabase
-- 2. In Supabase Dashboard -> SQL Editor, run the following:

create or replace function requesting_user_id()
returns text
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::text;
$$;

create or replace function requesting_user_role()
returns text
language sql stable
as $$
  -- Assuming you pass the user's role in the Clerk JWT template under metadata.role
  select nullif(current_setting('request.jwt.claim.metadata', true)::jsonb->>'role', '')::text;
$$;

-- You can now use these functions in your RLS policies, eg:
-- CREATE POLICY "Users can see their own listings" ON listings
-- FOR SELECT USING (seller_id = requesting_user_id());
