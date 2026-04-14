-- LekkeLeer / Lumi — Row Level Security policies
-- Run after 01_tables.sql
-- Safe to re-run (drops existing policies first)

-- Enable RLS on all tables
alter table users            enable row level security;
alter table sessions         enable row level security;
alter table sentence_results enable row level security;
alter table feedback         enable row level security;

-- Users
drop policy if exists "users_insert" on users;
create policy "users_insert" on users for insert with check (true);
drop policy if exists "users_update" on users;
create policy "users_update" on users for update using (true);
drop policy if exists "users_read_own" on users;
create policy "users_read_own" on users for select using (true);

-- Sessions
drop policy if exists "sessions_insert" on sessions;
create policy "sessions_insert" on sessions for insert with check (true);
drop policy if exists "sessions_update" on sessions;
create policy "sessions_update" on sessions for update using (true);
drop policy if exists "sessions_read_own" on sessions;
create policy "sessions_read_own" on sessions for select using (true);
drop policy if exists "sessions_delete_own" on sessions;
create policy "sessions_delete_own" on sessions for delete using (true);

-- Sentence results
drop policy if exists "results_insert" on sentence_results;
create policy "results_insert" on sentence_results for insert with check (true);
drop policy if exists "results_read_own" on sentence_results;
create policy "results_read_own" on sentence_results for select using (true);
drop policy if exists "results_delete_own" on sentence_results;
create policy "results_delete_own" on sentence_results for delete using (true);

-- Feedback
drop policy if exists "feedback_insert" on feedback;
create policy "feedback_insert" on feedback for insert with check (true);
