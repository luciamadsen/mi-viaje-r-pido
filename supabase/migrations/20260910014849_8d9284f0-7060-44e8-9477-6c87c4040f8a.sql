
-- 1) capacity 24
CREATE OR REPLACE FUNCTION public.enforce_reservation_capacity()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF (SELECT count(*) FROM public.reservations WHERE travel_date = NEW.travel_date) >= 24 THEN
    RAISE EXCEPTION 'CAPACITY_FULL';
  END IF;
  RETURN NEW;
END;
$$;

-- 2) cancel code derived from full name
DROP INDEX IF EXISTS public.reservations_cancel_code_key;

CREATE OR REPLACE FUNCTION public.set_cancel_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.cancel_code := upper(regexp_replace(btrim(NEW.full_name), '\s+', '', 'g'));
  RETURN NEW;
END;
$$;

UPDATE public.reservations
SET cancel_code = upper(regexp_replace(btrim(full_name), '\s+', '', 'g'));

-- 3) stop names with schedule
UPDATE public.reservations SET stop = CASE
  WHEN stop LIKE 'Av. Antártida%' THEN '06:15 – Av. Antártida Argentina y Gendarmería Nacional – Esquina COTO'
  WHEN stop LIKE 'Bouchard 557%' THEN '06:25 – Bouchard 557, CABA – Frente a Torre Bouchard'
  WHEN stop LIKE 'Av. del Libertador 98%' THEN '06:30 – Av. del Libertador 98, CABA – Puesto bicicletas Gob de la Ciudad'
  WHEN stop LIKE 'Av. Córdoba 3789%' THEN '06:35 – Av. Córdoba y Medrano – Carnicería RES'
  WHEN stop LIKE 'Av. Santa Fe 4387%' THEN '06:40 – Plaza Italia – Pasando rotonda cartel publicitario'
  WHEN stop LIKE 'Av. Santa Fe 4799%' THEN '06:43 – Av. Santa Fé y Av. Int. Bullrich – Parada colectivo sobre Santa Fé'
  WHEN stop LIKE 'Av. Dorrego 2762%' THEN '06:55 – Av. Dorrego 2762 – Puesto de diarios'
  WHEN stop LIKE 'Av. Cabildo 459%' THEN '06:58 – Av. Cabildo (Entre Jorge Newbery y Maure) – Bco. ISBC - Diagnóstico Maipú'
  WHEN stop LIKE 'Av. Cabildo 2877%' THEN '07:05 – Av. Cabildo 2877 (Esq. Congreso) – Puesto de flores'
  WHEN stop LIKE 'Av. Cabildo 3511%' THEN '07:07 – Av. Cabildo y Nuñez – YPF'
  WHEN stop LIKE 'Av. Cabildo 4963%' THEN '07:15 – Av. Cabildo 4899 – GNC'
  ELSE stop END;

-- 4) list + cancel individual reservation by code
CREATE OR REPLACE FUNCTION public.find_reservations_by_code(_code text)
RETURNS TABLE(id uuid, full_name text, travel_date date, stop text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.id, r.full_name, r.travel_date, r.stop
  FROM public.reservations r
  WHERE upper(btrim(r.cancel_code)) = upper(btrim(_code))
  ORDER BY r.travel_date;
$$;

CREATE OR REPLACE FUNCTION public.cancel_reservation(_id uuid, _code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE deleted int;
BEGIN
  DELETE FROM public.reservations
  WHERE id = _id AND upper(btrim(cancel_code)) = upper(btrim(_code));
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_reservations_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(uuid, text) TO anon, authenticated;
