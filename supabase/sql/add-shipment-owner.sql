-- Per-admin shipment ownership for tracking-app.
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oivnzmibsuwbmlkbmcre/sql/new

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS shipments_owner_id_idx ON public.shipments (owner_id);

-- Assign all existing shipments to support@shiptrackglobal.com
UPDATE public.shipments
SET owner_id = (SELECT id FROM auth.users WHERE lower(email) = 'support@shiptrackglobal.com' LIMIT 1)
WHERE owner_id IS NULL;
