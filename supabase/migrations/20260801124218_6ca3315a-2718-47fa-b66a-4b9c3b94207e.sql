
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS balance BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recharge_balance BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cumulative_income BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawn BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS welcome_bonus_given BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
  ADD COLUMN IF NOT EXISTS checkin_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS products_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_invite_code_key ON public.profiles (invite_code);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recharges TO authenticated;
GRANT ALL ON public.recharges TO service_role;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recharges" ON public.recharges FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  amount BIGINT NOT NULL,
  received BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  price BIGINT NOT NULL,
  daily BIGINT NOT NULL,
  term TEXT NOT NULL,
  total BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Account setup: profile row, unique invite code, referral link, welcome bonus
CREATE OR REPLACE FUNCTION public.setup_account(p_phone TEXT, p_invite TEXT DEFAULT NULL)
RETURNS TABLE (invite_code TEXT, balance BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
  v_ref UUID;
  v_existing public.profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_existing FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, phone, email)
    VALUES (v_uid, p_phone, p_phone, (SELECT email FROM auth.users WHERE id = v_uid))
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO v_existing FROM public.profiles WHERE id = v_uid;
  END IF;

  IF v_existing.invite_code IS NULL THEN
    LOOP
      v_code := lower(substr(md5(gen_random_uuid()::text), 1, 6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.invite_code = v_code);
    END LOOP;
    UPDATE public.profiles SET invite_code = v_code WHERE id = v_uid;
    v_existing.invite_code := v_code;
  END IF;

  IF v_existing.referred_by IS NULL AND p_invite IS NOT NULL AND length(trim(p_invite)) > 0 THEN
    SELECT id INTO v_ref FROM public.profiles WHERE profiles.invite_code = lower(trim(p_invite)) AND id <> v_uid;
    IF v_ref IS NOT NULL THEN
      UPDATE public.profiles SET referred_by = v_ref WHERE id = v_uid;
    END IF;
  END IF;

  IF NOT v_existing.welcome_bonus_given THEN
    UPDATE public.profiles
      SET balance = balance + 4000,
          cumulative_income = cumulative_income + 4000,
          welcome_bonus_given = true
      WHERE id = v_uid;
    INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (v_uid, 'income', 'Welcome bonus', 4000);
  END IF;

  RETURN QUERY
    SELECT p.invite_code, p.balance FROM public.profiles p WHERE p.id = v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.setup_account(TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.setup_account(TEXT, TEXT) TO authenticated;

-- Daily check-in: UGX 300
CREATE OR REPLACE FUNCTION public.daily_checkin()
RETURNS TABLE (checkin_days INTEGER, balance BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_last DATE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT p.last_checkin_date INTO v_last FROM public.profiles p WHERE p.id = v_uid FOR UPDATE;
  IF v_last = current_date THEN
    RAISE EXCEPTION 'Already checked in today';
  END IF;
  UPDATE public.profiles
    SET balance = balance + 300,
        cumulative_income = cumulative_income + 300,
        checkin_days = profiles.checkin_days + 1,
        last_checkin_date = current_date
    WHERE id = v_uid;
  INSERT INTO public.transactions (user_id, kind, title, amount)
  VALUES (v_uid, 'income', 'Daily check-in bonus', 300);
  RETURN QUERY SELECT p.checkin_days, p.balance FROM public.profiles p WHERE p.id = v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.daily_checkin() FROM public;
GRANT EXECUTE ON FUNCTION public.daily_checkin() TO authenticated;

-- Recharge order (credited by the payment provider later)
CREATE OR REPLACE FUNCTION public.create_recharge(p_amount BIGINT)
RETURNS public.recharges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.recharges;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount < 20000 THEN RAISE EXCEPTION 'The minimum recharge amount is UGX 20000'; END IF;
  INSERT INTO public.recharges (user_id, order_no, amount)
  VALUES (v_uid, 'T' || to_char(now(), 'YYMMDDHH24MISS') || lpad((floor(random()*1000))::text, 3, '0'), p_amount)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.create_recharge(BIGINT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_recharge(BIGINT) TO authenticated;

-- Purchase a product using recharged funds; pays referral commission on first purchase only
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
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_me FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_me.recharge_balance < p_price THEN
    RAISE EXCEPTION 'Insufficient balance to complete purchase';
  END IF;

  v_first := v_me.products_count = 0;

  UPDATE public.profiles
    SET recharge_balance = recharge_balance - p_price,
        balance = GREATEST(balance - p_price, 0),
        products_count = products_count + 1
    WHERE id = v_uid;

  INSERT INTO public.purchases (user_id, product_id, name, image, price, daily, term, total)
  VALUES (v_uid, p_product_id, p_name, p_image, p_price, p_daily, p_term, p_total)
  RETURNING * INTO v_row;

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

-- Withdrawal request: min UGX 5000, 20% fee, requires at least one purchased product
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount BIGINT)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_me public.profiles%ROWTYPE;
  v_row public.withdrawals;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_me FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF p_amount < 5000 THEN RAISE EXCEPTION 'The minimum withdrawal amount is UGX 5000'; END IF;
  IF v_me.products_count < 1 THEN RAISE EXCEPTION 'You must own at least one product to withdraw'; END IF;
  IF v_me.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_uid;

  INSERT INTO public.withdrawals (user_id, order_no, amount, received)
  VALUES (v_uid, 'B' || to_char(now(), 'YYMMDDHH24MISS') || lpad((floor(random()*1000))::text, 3, '0'), p_amount, (p_amount * 80) / 100)
  RETURNING * INTO v_row;

  INSERT INTO public.transactions (user_id, kind, title, amount)
  VALUES (v_uid, 'withdrawal', 'Withdrawal request', -p_amount);

  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.request_withdrawal(BIGINT) FROM public;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(BIGINT) TO authenticated;

-- Team counts for the current user (levels 1-3)
CREATE OR REPLACE FUNCTION public.team_members(p_level INTEGER)
RETURNS TABLE (account TEXT, joined TIMESTAMPTZ, recharge BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH l1 AS (SELECT id, phone, created_at FROM public.profiles WHERE referred_by = auth.uid()),
       l2 AS (SELECT p.id, p.phone, p.created_at FROM public.profiles p JOIN l1 ON p.referred_by = l1.id),
       l3 AS (SELECT p.id, p.phone, p.created_at FROM public.profiles p JOIN l2 ON p.referred_by = l2.id),
       sel AS (
         SELECT * FROM l1 WHERE p_level = 1
         UNION ALL SELECT * FROM l2 WHERE p_level = 2
         UNION ALL SELECT * FROM l3 WHERE p_level = 3
       )
  SELECT sel.phone, sel.created_at,
         COALESCE((SELECT SUM(pu.price) FROM public.purchases pu WHERE pu.user_id = sel.id), 0)::BIGINT
  FROM sel ORDER BY sel.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.team_members(INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.team_members(INTEGER) TO authenticated;
