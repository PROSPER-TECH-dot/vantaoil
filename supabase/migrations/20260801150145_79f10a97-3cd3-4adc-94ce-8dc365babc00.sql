ALTER TABLE public.recharges
  ADD COLUMN IF NOT EXISTS external_reference text,
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS msisdn text;

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS external_reference text,
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS msisdn text;

CREATE UNIQUE INDEX IF NOT EXISTS recharges_external_reference_key ON public.recharges (external_reference) WHERE external_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS withdrawals_external_reference_key ON public.withdrawals (external_reference) WHERE external_reference IS NOT NULL;

-- Deposit creation now records the payer phone and a unique provider reference
CREATE OR REPLACE FUNCTION public.create_recharge(p_amount bigint, p_msisdn text DEFAULT NULL)
RETURNS public.recharges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.recharges; v_min bigint := public.setting_num('min_recharge', 20000); v_no text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount < v_min THEN RAISE EXCEPTION 'The minimum recharge amount is UGX %', v_min; END IF;
  v_no := 'T' || to_char(now(), 'YYMMDDHH24MISS') || lpad((floor(random()*1000))::text, 3, '0');
  INSERT INTO public.recharges (user_id, order_no, amount, msisdn, external_reference)
  VALUES (v_uid, v_no, p_amount, p_msisdn, v_no)
  RETURNING * INTO v_row;
  RETURN v_row;
END; $$;

-- Called only by trusted server code after ZENGAPAY confirms a collection
CREATE OR REPLACE FUNCTION public.credit_recharge_by_reference(p_reference text, p_provider_ref text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_row public.recharges;
BEGIN
  SELECT * INTO v_row FROM public.recharges
    WHERE external_reference = p_reference OR order_no = p_reference
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.status = 'Success' THEN RETURN true; END IF;
  UPDATE public.profiles
    SET recharge_balance = recharge_balance + v_row.amount, balance = balance + v_row.amount
    WHERE id = v_row.user_id;
  INSERT INTO public.transactions (user_id, kind, title, amount)
  VALUES (v_row.user_id, 'recharge', 'Recharge ' || v_row.order_no, v_row.amount);
  UPDATE public.recharges SET status = 'Success', provider_ref = COALESCE(p_provider_ref, provider_ref) WHERE id = v_row.id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.fail_recharge_by_reference(p_reference text, p_provider_ref text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.recharges SET status = 'Failed', provider_ref = COALESCE(p_provider_ref, provider_ref)
  WHERE (external_reference = p_reference OR order_no = p_reference) AND status <> 'Success';
  RETURN FOUND;
END; $$;

-- Withdrawals: record the payout phone + reference at request time
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount bigint, p_msisdn text DEFAULT NULL)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_me public.profiles%ROWTYPE; v_row public.withdrawals;
  v_min bigint := public.setting_num('min_withdrawal', 5000);
  v_fee bigint := public.setting_num('withdrawal_fee_percent', 20);
  v_no text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_me FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_me.banned THEN RAISE EXCEPTION 'Your account is suspended'; END IF;
  IF p_amount < v_min THEN RAISE EXCEPTION 'The minimum withdrawal amount is UGX %', v_min; END IF;
  IF v_me.products_count < 1 THEN RAISE EXCEPTION 'You must own at least one product to withdraw'; END IF;
  IF v_me.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_uid;
  v_no := 'B' || to_char(now(), 'YYMMDDHH24MISS') || lpad((floor(random()*1000))::text, 3, '0');
  INSERT INTO public.withdrawals (user_id, order_no, amount, received, msisdn, external_reference)
  VALUES (v_uid, v_no, p_amount, (p_amount * (100 - v_fee)) / 100, COALESCE(p_msisdn, v_me.phone), v_no)
  RETURNING * INTO v_row;
  INSERT INTO public.transactions (user_id, kind, title, amount) VALUES (v_uid, 'withdrawal', 'Withdrawal request', -p_amount);
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.settle_withdrawal_by_reference(p_reference text, p_status text, p_provider_ref text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_row public.withdrawals;
BEGIN
  SELECT * INTO v_row FROM public.withdrawals
    WHERE external_reference = p_reference OR order_no = p_reference
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_row.status IN ('Success', 'Rejected') THEN RETURN true; END IF;
  IF p_status = 'Success' THEN
    UPDATE public.profiles SET withdrawn = withdrawn + v_row.amount WHERE id = v_row.user_id;
  ELSE
    UPDATE public.profiles SET balance = balance + v_row.amount WHERE id = v_row.user_id;
    INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (v_row.user_id, 'income', 'Withdrawal refund ' || v_row.order_no, v_row.amount);
    p_status := 'Rejected';
  END IF;
  UPDATE public.withdrawals SET status = p_status, provider_ref = COALESCE(p_provider_ref, provider_ref) WHERE id = v_row.id;
  RETURN true;
END; $$;

REVOKE EXECUTE ON FUNCTION public.credit_recharge_by_reference(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fail_recharge_by_reference(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.settle_withdrawal_by_reference(text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_recharge_by_reference(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_recharge_by_reference(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_withdrawal_by_reference(text, text, text) TO service_role;

-- Level 1 referral commission 36% -> 15%
CREATE OR REPLACE FUNCTION public.purchase_product(p_product_id text, p_name text, p_image text, p_price bigint, p_daily bigint, p_term text, p_total bigint)
RETURNS public.purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
      v_amt := (p_price * 15) / 100;
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
END; $$;