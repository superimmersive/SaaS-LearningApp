-- LekkeLeer — Useful read-only queries for Supabase SQL Editor
-- Copy and run as needed (no schema changes)

-- Daily active users (last 14 days)
select date(last_seen) as day, count(*) as users
from users
group by 1 order by 1 desc limit 14;

-- Sentences completed per week
select week, count(*) as completions
from sentence_results
where completed = true
group by 1 order by 1;

-- Average score per week (listen mode only)
select week,
  round(avg(correct_words::float / nullif(total_words,0) * 100)) as avg_pct
from sentence_results
where mode = 'listen' and total_words > 0
group by 1 order by 1;

-- Most active users
select u.display_name, u.id, count(r.id) as sentences_done
from users u
join sentence_results r on r.user_id = u.id
group by 1,2 order by 3 desc limit 20;
