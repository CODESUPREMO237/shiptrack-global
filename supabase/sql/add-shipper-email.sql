-- Add the shipper_email column that the app sends but was missing from the DB.
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oivnzmibsuwbmlkbmcre/sql/new

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS shipper_email TEXT;
