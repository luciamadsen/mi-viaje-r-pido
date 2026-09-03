CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  travel_date DATE NOT NULL,
  stop TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reservations_unique_person_day ON public.reservations (travel_date, lower(btrim(full_name)));
CREATE INDEX reservations_travel_date_idx ON public.reservations (travel_date);

GRANT SELECT, INSERT, DELETE ON public.reservations TO anon;
GRANT SELECT, INSERT, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Anyone can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can cancel reservations" ON public.reservations FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.enforce_reservation_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.reservations WHERE travel_date = NEW.travel_date) >= 30 THEN
    RAISE EXCEPTION 'CAPACITY_FULL';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reservations_capacity_check
BEFORE INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.enforce_reservation_capacity();

ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;