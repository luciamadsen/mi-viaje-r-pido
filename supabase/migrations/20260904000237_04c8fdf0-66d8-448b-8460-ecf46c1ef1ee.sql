REVOKE EXECUTE ON FUNCTION public.generate_cancel_code() FROM anon, authenticated, public;
ALTER FUNCTION public.generate_cancel_code() SECURITY INVOKER;