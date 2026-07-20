-- Ads removed from the product entirely: no more rewarded-video bonus
-- scans, so the mechanism that granted them no longer has a caller.
-- Cost control is now just the flat BASE_DAILY_LIMIT in
-- analyze-fridge-photo + recipe caching (see PRD §Controllo dei costi AI).
drop table if exists public.scan_bonus_grants;
