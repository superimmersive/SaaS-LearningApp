-- LekkeLeer / Lumi — Create tables
-- Run in Supabase → SQL Editor
-- Use 01_tables.sql first, then 02_rls.sql

-- Users
create table if not exists users (
  id           text primary key,
  display_name text,
  created_at   timestamptz not null,
  last_seen    timestamptz,
  is_claimed   boolean default false,
  email        text,
  constraint users_id_length check (char_length(id) between 32 and 36)
);
create index if not exists users_last_seen_idx on users(last_seen desc);

-- Sessions
create table if not exists sessions (
  id         text primary key,
  user_id    text references users(id),
  week       integer not null,
  subject    text default 'afrikaans',
  started_at timestamptz not null,
  ended_at   timestamptz,
  constraint sessions_week_check check (week between 1 and 52)
);
create index if not exists sessions_user_idx on sessions(user_id, started_at desc);

-- Sentence results
create table if not exists sentence_results (
  id             bigserial primary key,
  user_id        text references users(id),
  session_id     text references sessions(id),
  week           integer not null,
  sentence_index integer not null,
  mode           text not null,
  correct_words  integer default 0,
  total_words    integer default 0,
  completed      boolean default false,
  duration_secs  integer default 0,
  recorded_at    timestamptz not null,
  constraint results_mode_check check (mode in ('listen','tap','play'))
);
create index if not exists results_user_idx on sentence_results(user_id, recorded_at desc);
create index if not exists results_session_idx on sentence_results(session_id);

-- Feedback
create table if not exists feedback (
  id         bigserial primary key,
  user_id    text references users(id),
  message    text not null,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on feedback(created_at desc);
