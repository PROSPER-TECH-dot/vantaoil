CREATE OR REPLACE FUNCTION public.admin_user_detail(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  l1 uuid[];
  l2 uuid[];
  l3 uuid[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT COALESCE(array_agg(id), '{}') INTO l1 FROM public.profiles WHERE referred_by = p_user_id;
  SELECT COALESCE(array_agg(id), '{}') INTO l2 FROM public.profiles WHERE referred_by = ANY(l1);
  SELECT COALESCE(array_agg(id), '{}') INTO l3 FROM public.profiles WHERE referred_by = ANY(l2);

  SELECT jsonb_build_object(
    'profile', to_jsonb(p),
    'referrer', (SELECT phone FROM public.profiles r WHERE r.id = p.referred_by),
    'purchases', COALESCE((SELECT jsonb_agg(to_jsonb(pu) ORDER BY pu.created_at DESC) FROM public.purchases pu WHERE pu.user_id = p.id), '[]'::jsonb),
    'transactions', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC) FROM public.transactions t WHERE t.user_id = p.id), '[]'::jsonb),
    'recharges', COALESCE((SELECT jsonb_agg(to_jsonb(rc) ORDER BY rc.created_at DESC) FROM public.recharges rc WHERE rc.user_id = p.id), '[]'::jsonb),
    'withdrawals', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.created_at DESC) FROM public.withdrawals w WHERE w.user_id = p.id), '[]'::jsonb),
    'referrals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'phone', c.phone, 'avatar_url', c.avatar_url, 'created_at', c.created_at, 'level', 1,
        'recharge', COALESCE((SELECT SUM(rc.amount) FROM public.recharges rc WHERE rc.user_id = c.id AND rc.status = 'Success'), 0)
      ) ORDER BY c.created_at DESC)
      FROM public.profiles c WHERE c.id = ANY(l1)), '[]'::jsonb),
    'referrals_l2', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'phone', c.phone, 'avatar_url', c.avatar_url, 'created_at', c.created_at, 'level', 2,
        'recharge', COALESCE((SELECT SUM(rc.amount) FROM public.recharges rc WHERE rc.user_id = c.id AND rc.status = 'Success'), 0)
      ) ORDER BY c.created_at DESC)
      FROM public.profiles c WHERE c.id = ANY(l2)), '[]'::jsonb),
    'referrals_l3', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'phone', c.phone, 'avatar_url', c.avatar_url, 'created_at', c.created_at, 'level', 3,
        'recharge', COALESCE((SELECT SUM(rc.amount) FROM public.recharges rc WHERE rc.user_id = c.id AND rc.status = 'Success'), 0)
      ) ORDER BY c.created_at DESC)
      FROM public.profiles c WHERE c.id = ANY(l3)), '[]'::jsonb),
    'team_recharge', COALESCE((
      SELECT SUM(rc.amount) FROM public.recharges rc
      WHERE rc.status = 'Success' AND rc.user_id = ANY(l1 || l2 || l3)), 0),
    'team_commission', COALESCE((
      SELECT SUM(t.amount) FROM public.transactions t
      WHERE t.user_id = p.id AND t.title ILIKE '%team commission%'), 0),
    'is_admin', public.has_role(p.id, 'admin')
  ) INTO v
  FROM public.profiles p WHERE p.id = p_user_id;
  RETURN v;
END;
$$;