CREATE OR REPLACE FUNCTION public.grant_welcome_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_bonus bigint := public.setting_num('welcome_bonus', 4000);
BEGIN
  IF NEW.welcome_bonus_given IS NOT TRUE AND v_bonus > 0 THEN
    UPDATE public.profiles
      SET balance = balance + v_bonus,
          cumulative_income = cumulative_income + v_bonus,
          welcome_bonus_given = true
      WHERE id = NEW.id;
    INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (NEW.id, 'income', 'Welcome bonus', v_bonus);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_welcome_bonus ON public.profiles;
CREATE TRIGGER profiles_welcome_bonus
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.grant_welcome_bonus();

REVOKE EXECUTE ON FUNCTION public.grant_welcome_bonus() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE r record; v_bonus bigint := public.setting_num('welcome_bonus', 4000);
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE welcome_bonus_given IS NOT TRUE LOOP
    UPDATE public.profiles
      SET balance = balance + v_bonus,
          cumulative_income = cumulative_income + v_bonus,
          welcome_bonus_given = true
      WHERE id = r.id;
    INSERT INTO public.transactions (user_id, kind, title, amount)
    VALUES (r.id, 'income', 'Welcome bonus', v_bonus);
  END LOOP;
END $$;