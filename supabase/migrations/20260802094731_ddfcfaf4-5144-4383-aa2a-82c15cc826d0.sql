INSERT INTO public.app_settings (key, value, updated_at) VALUES ('min_recharge', '25000', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();