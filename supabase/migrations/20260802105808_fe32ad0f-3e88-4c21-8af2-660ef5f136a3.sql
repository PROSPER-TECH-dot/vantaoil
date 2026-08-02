CREATE OR REPLACE FUNCTION public.setup_account(p_phone text, p_invite text DEFAULT '')
RETURNS TABLE (invite_code text, balance bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_ref uuid; v_existing public.profiles%ROWTYPE;
  v_bonus bigint := public.setting_num('welcome_bonus', 4000);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_existing FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, phone, email, invite_code)
    VALUES (v_uid, p_phone, p_phone, (SELECT email FROM auth.users WHERE id = v_uid), public.gen_invite_code())
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO v_existing FROM public.profiles WHERE id = v_uid;
  END IF;

  IF v_existing.invite_code IS NULL THEN
    UPDATE public.profiles SET invite_code = public.gen_invite_code() WHERE id = v_uid;
  END IF;

  IF v_existing.referred_by IS NULL AND p_invite IS NOT NULL AND length(trim(p_invite)) > 0 THEN
    SELECT pr.id INTO v_ref FROM public.profiles pr WHERE pr.invite_code = lower(trim(p_invite)) AND pr.id <> v_uid;
    IF v_ref IS NOT NULL THEN UPDATE public.profiles SET referred_by = v_ref WHERE id = v_uid; END IF;
  END IF;

  IF NOT v_existing.welcome_bonus_given THEN
    UPDATE public.profiles pr
      SET balance = pr.balance + v_bonus,
          cumulative_income = pr.cumulative_income + v_bonus,
          welcome_bonus_given = true
      WHERE pr.id = v_uid;
    INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (v_uid, 'income', 'Welcome bonus', v_bonus);
  END IF;

  RETURN QUERY SELECT p.invite_code, p.balance FROM public.profiles p WHERE p.id = v_uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.setup_account(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.setup_account(text, text) TO authenticated, service_role;