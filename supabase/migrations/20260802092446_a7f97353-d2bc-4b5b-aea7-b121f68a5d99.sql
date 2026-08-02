ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_checkin_at timestamptz;

UPDATE public.profiles SET last_checkin_at = (last_checkin_date::timestamptz)
WHERE last_checkin_at IS NULL AND last_checkin_date IS NOT NULL;

CREATE OR REPLACE FUNCTION public.daily_checkin()
RETURNS TABLE(checkin_days integer, balance bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_last timestamptz;
  v_bonus bigint := public.setting_num('checkin_bonus', 300);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT p.last_checkin_at INTO v_last FROM public.profiles p WHERE p.id = v_uid FOR UPDATE;
  IF v_last IS NOT NULL AND v_last > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'You can check in again 24 hours after your last check-in';
  END IF;
  UPDATE public.profiles p
    SET balance = p.balance + v_bonus,
        cumulative_income = p.cumulative_income + v_bonus,
        checkin_days = p.checkin_days + 1,
        last_checkin_date = current_date,
        last_checkin_at = now()
    WHERE p.id = v_uid;
  INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (v_uid, 'income', 'Daily check-in bonus', v_bonus);
  RETURN QUERY SELECT p.checkin_days, p.balance FROM public.profiles p WHERE p.id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.daily_checkin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.daily_checkin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank text NOT NULL,
  holder text NOT NULL,
  account text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own bank accounts" ON public.bank_accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read bank accounts" ON public.bank_accounts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value) VALUES
  ('support_whatsapp_2', ''),
  ('group_link', '')
ON CONFLICT (key) DO NOTHING;