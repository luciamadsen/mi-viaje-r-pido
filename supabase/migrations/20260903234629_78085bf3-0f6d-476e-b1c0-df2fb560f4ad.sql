
-- 1) Código de cancelación
CREATE OR REPLACE FUNCTION public.generate_cancel_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_already boolean;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.reservations WHERE cancel_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cancel_code text;

UPDATE public.reservations SET cancel_code = public.generate_cancel_code() WHERE cancel_code IS NULL;

CREATE OR REPLACE FUNCTION public.set_cancel_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.cancel_code IS NULL OR NEW.cancel_code = '' THEN
    NEW.cancel_code := public.generate_cancel_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_set_cancel_code ON public.reservations;
CREATE TRIGGER reservations_set_cancel_code
BEFORE INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.set_cancel_code();

ALTER TABLE public.reservations ALTER COLUMN cancel_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reservations_cancel_code_key ON public.reservations (cancel_code);

-- 2) Seguridad: nadie puede borrar directamente; el código no se expone en lecturas públicas
DROP POLICY IF EXISTS "Anyone can cancel reservations" ON public.reservations;

REVOKE ALL ON public.reservations FROM anon, authenticated;
GRANT SELECT (id, full_name, travel_date, stop, created_at) ON public.reservations TO anon, authenticated;
GRANT INSERT (full_name, travel_date, stop) ON public.reservations TO anon, authenticated;
GRANT ALL ON public.reservations TO service_role;

-- 3) Crear reserva devolviendo el código
CREATE OR REPLACE FUNCTION public.create_reservation(_full_name text, _travel_date date, _stop text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
BEGIN
  INSERT INTO public.reservations (full_name, travel_date, stop)
  VALUES (btrim(_full_name), _travel_date, _stop)
  RETURNING cancel_code INTO new_code;
  RETURN new_code;
END;
$$;

-- 4) Buscar reserva por código
CREATE OR REPLACE FUNCTION public.find_reservation_by_code(_code text)
RETURNS TABLE (id uuid, full_name text, travel_date date, stop text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.full_name, r.travel_date, r.stop
  FROM public.reservations r
  WHERE upper(btrim(r.cancel_code)) = upper(btrim(_code))
  LIMIT 1;
$$;

-- 5) Cancelar por código
CREATE OR REPLACE FUNCTION public.cancel_reservation_by_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted int;
BEGIN
  DELETE FROM public.reservations
  WHERE upper(btrim(cancel_code)) = upper(btrim(_code));
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation(text, date, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_reservation_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation_by_code(text) TO anon, authenticated;
