-- Choguild shows real data only. Remove the seeded example listings (and
-- anything that could hang off them), then drop the flag entirely.
delete from submission_events where submission_id in (
  select w.id from work_submissions w join opportunities o on o.id = w.opportunity_id where o.is_demo
);
delete from submission_versions where submission_id in (
  select w.id from work_submissions w join opportunities o on o.id = w.opportunity_id where o.is_demo
);
delete from work_submissions where opportunity_id in (select id from opportunities where is_demo);
delete from application_events where application_id in (
  select a.id from applications a join opportunities o on o.id = a.opportunity_id where o.is_demo
);
delete from applications where opportunity_id in (select id from opportunities where is_demo);
delete from opportunities where is_demo;

alter table opportunities drop column if exists is_demo;
