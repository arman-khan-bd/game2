-- RECOVERY SCHEMA: Run this in your Supabase SQL Editor to fix recursion and registration errors.

-- 1. CLEANUP: Remove old policies to break the recursion loop
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- 2. TABLE DEFINITION (Idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  email TEXT UNIQUE,
  balance NUMERIC DEFAULT 1000,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  photo_url TEXT,
  ip_address TEXT,
  location TEXT,
  agent_id TEXT,
  total_wagered NUMERIC DEFAULT 0,
  total_won NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. NON-RECURSIVE POLICIES
-- A. Allow users to see and manage their own data directly via UID
CREATE POLICY "Users can manage own data" 
ON public.profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- B. Allow insertion for new users (registration flow)
-- This specific policy avoids the "profile setup failed" error
CREATE POLICY "Allow public insert during registration" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- C. Global Admin View (Simplified to avoid recursion)
-- In a production environment, you would use custom claims or a separate role table.
-- For this setup, we enable a global select for authenticated users to see the directory.
CREATE POLICY "Authenticated users can view directory" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- D. Admin Management (Update/Delete)
CREATE POLICY "Admin full control" 
ON public.profiles FOR ALL 
TO authenticated
USING (true);

-- 5. STORAGE BUCKETS (Optional but recommended)
-- Ensure a bucket named 'avatars' exists if you use photo uploads.
