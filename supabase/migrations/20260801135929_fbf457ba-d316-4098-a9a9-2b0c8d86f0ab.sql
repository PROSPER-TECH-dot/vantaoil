ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS term_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_paid INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_payout_at TIMESTAMPTZ;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

UPDATE public.purchases
  SET term_days = GREATEST(COALESCE(NULLIF(regexp_replace(term, '\D', '', 'g'), ''), '0')::INTEGER, 1)
  WHERE term_days = 0;

UPDATE public.purchases SET next_payout_at = created_at + INTERVAL '24 hours' WHERE next_payout_at IS NULL;

CREATE OR REPLACE FUNCTION public.purchase_product(
  p_product_id TEXT, p_name TEXT, p_image TEXT, p_price BIGINT,
  p_daily BIGINT, p_term TEXT, p_total BIGINT
)
RETURNS public.purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_me public.profiles%ROWTYPE;
  v_row public.purchases;
  v_first BOOLEAN;
  v_l1 UUID; v_l2 UUID; v_l3 UUID;
  v_amt BIGINT;
  v_days INTEGER;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_me FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_me.recharge_balance < p_price THEN
    RAISE EXCEPTION 'Insufficient balance to complete purchase';
  END IF;

  v_first := v_me.products_count = 0;
  v_days := GREATEST(COALESCE(NULLIF(regexp_replace(p_term, '\D', '', 'g'), ''), '0')::INTEGER, 1);

  UPDATE public.profiles
    SET recharge_balance = recharge_balance - p_price,
        balance = GREATEST(balance - p_price, 0),
        products_count = products_count + 1
    WHERE id = v_uid;

  INSERT INTO public.purchases (user_id, product_id, name, image, price, daily, term, total, term_days, days_paid, next_payout_at)
  VALUES (v_uid, p_product_id, p_name, p_image, p_price, p_daily, p_term, p_total, v_days, 0, now() + INTERVAL '24 hours')
  RETURNING * INTO v_row;

  INSERT INTO public.transactions (user_id, kind, title, amount)
  VALUES (v_uid, 'purchase', p_name, -p_price);

  IF v_first THEN
    v_l1 := v_me.referred_by;
    IF v_l1 IS NOT NULL THEN
      SELECT referred_by INTO v_l2 FROM public.profiles WHERE id = v_l1;
      IF v_l2 IS NOT NULL THEN
        SELECT referred_by INTO v_l3 FROM public.profiles WHERE id = v_l2;
      END IF;
    END IF;

    IF v_l1 IS NOT NULL THEN
      v_amt := (p_price * 36) / 100;
      UPDATE public.profiles SET balance = balance + v_amt, cumulative_income = cumulative_income + v_amt WHERE id = v_l1;
      INSERT INTO public.transactions (user_id, kind, title, amount) VALUES (v_l1, 'income', 'Level 1 team commission', v_amt);
    END IF;
    IF v_l2 IS NOT NULL THEN
      v_amt := (p_price * 3) / 100;
      UPDATE public.profiles SET balance = balance + v_amt, cumulative_income = cumulative_income + v_amt WHERE id = v_l2;
      INSERT INTO public.transactions (user_id, kind, title, amount) VALUES (v_l2, 'income', 'Level 2 team commission', v_amt);
    END IF;
    IF v_l3 IS NOT NULL THEN
      v_amt := (p_price * 1) / 100;
      UPDATE public.profiles SET balance = balance + v_amt, cumulative_income = cumulative_income + v_amt WHERE id = v_l3;
      INSERT INTO public.transactions (user_id, kind, title, amount) VALUES (v_l3, 'income', 'Level 3 team commission', v_amt);
    END IF;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_product(TEXT, TEXT, TEXT, BIGINT, BIGINT, TEXT, BIGINT) FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_product(TEXT, TEXT, TEXT, BIGINT, BIGINT, TEXT, BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.settle_income()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_p public.purchases%ROWTYPE;
  v_total BIGINT := 0;
  v_cycles INTEGER;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;

  FOR v_p IN
    SELECT * FROM public.purchases
    WHERE user_id = v_uid AND next_payout_at IS NOT NULL AND next_payout_at <= now()
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
$$;

REVOKE ALL ON FUNCTION public.settle_income() FROM public;
GRANT EXECUTE ON FUNCTION public.settle_income() TO authenticated;