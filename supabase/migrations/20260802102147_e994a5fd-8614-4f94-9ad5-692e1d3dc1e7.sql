ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS frozen boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.settle_income()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_p public.purchases%ROWTYPE;
  v_total BIGINT := 0;
  v_cycles INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;

  FOR v_p IN
    SELECT * FROM public.purchases
    WHERE user_id = v_uid AND NOT frozen AND next_payout_at IS NOT NULL AND next_payout_at <= now()
    FOR UPDATE
  LOOP
    v_cycles := LEAST(
      FLOOR(EXTRACT(EPOCH FROM (now() - v_p.next_payout_at)) / 86400)::INTEGER + 1,
      GREATEST(v_p.term_days - v_p.days_paid, 0)
    );
    IF v_cycles <= 0 THEN
      UPDATE public.purchases SET next_payout_at = NULL WHERE id = v_p.id;
      CONTINUE;
    END IF;

    v_total := v_total + (v_p.daily * v_cycles);

    INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (v_uid, 'income', 'Daily income · ' || v_p.name, v_p.daily * v_cycles);

    UPDATE public.purchases
      SET days_paid = v_p.days_paid + v_cycles,
          next_payout_at = CASE
            WHEN v_p.days_paid + v_cycles >= v_p.term_days THEN NULL
            ELSE v_p.next_payout_at + (v_cycles || ' days')::INTERVAL
          END
      WHERE id = v_p.id;
  END LOOP;

  IF v_total > 0 THEN
    UPDATE public.profiles
      SET balance = balance + v_total,
          cumulative_income = cumulative_income + v_total
      WHERE id = v_uid;
  END IF;

  RETURN v_total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_purchase_frozen(p_id uuid, p_frozen boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.purchases
    SET frozen = p_frozen,
        next_payout_at = CASE
          WHEN p_frozen THEN next_payout_at
          WHEN next_payout_at IS NULL AND days_paid < term_days THEN now() + interval '24 hours'
          ELSE next_payout_at END
    WHERE id = p_id;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_delete_purchase(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT user_id INTO v_uid FROM public.purchases WHERE id = p_id;
  IF v_uid IS NULL THEN RETURN; END IF;
  DELETE FROM public.purchases WHERE id = p_id;
  UPDATE public.profiles SET products_count = GREATEST(products_count - 1, 0) WHERE id = v_uid;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.admin_set_purchase_frozen(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_purchase(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_purchase_frozen(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_purchase(uuid) TO authenticated;