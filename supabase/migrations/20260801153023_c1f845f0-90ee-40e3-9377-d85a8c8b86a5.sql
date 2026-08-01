-- Revoke broad default EXECUTE, then grant back only what each role needs.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated;', f.sig);
  END LOOP;
END $$;

-- Trigger / internal helpers: no direct API access at all.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Payment settlement: service role (webhook) only.
GRANT EXECUTE ON FUNCTION public.credit_recharge_by_reference(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_recharge_by_reference(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_withdrawal_by_reference(text, text, text) TO service_role;

-- Needed by RLS policies evaluated as the signed-in user.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Member-facing actions.
GRANT EXECUTE ON FUNCTION public.setup_account(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.daily_checkin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_income() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_gift_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.team_members(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product(text, text, text, bigint, bigint, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_recharge(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_recharge(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(bigint, text) TO authenticated;

-- Admin actions (each already enforces has_role(auth.uid(),'admin') internally).
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, text, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_banned(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_recharge_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_withdrawal_status(uuid, text) TO authenticated;
