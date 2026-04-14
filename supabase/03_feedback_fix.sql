-- LekkeLeer — Fix feedback when table exists but RLS/policy missing
-- Run this if feedback table already exists and inserts fail
-- (e.g. "relation feedback already exists" when running 01_tables.sql)

create index if not exists feedback_created_idx on feedback(created_at desc);
alter table feedback enable row level security;
drop policy if exists "feedback_insert" on feedback;
create policy "feedback_insert" on feedback for insert with check (true);
