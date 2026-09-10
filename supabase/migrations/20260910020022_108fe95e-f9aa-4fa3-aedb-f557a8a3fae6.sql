CREATE OR REPLACE FUNCTION public.enforce_reservation_cutoff()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF now() >= ((NEW.travel_date + time '05:00') AT TIME ZONE 'America/Argentina/Buenos_Aires') THEN
    RAISE EXCEPTION 'BOOKING_CLOSED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_cutoff_check ON public.reservations;
CREATE TRIGGER reservations_cutoff_check
BEFORE INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.enforce_reservation_cutoff();