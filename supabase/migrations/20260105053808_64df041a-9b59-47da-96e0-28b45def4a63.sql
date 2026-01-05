-- 1. Insert demo institution if it doesn't exist
INSERT INTO public.instituciones (id, nombre)
VALUES ('00000000-0000-0000-0000-000000000001', 'Institución Demo')
ON CONFLICT (id) DO NOTHING;

-- 2. Create trigger to execute handle_new_user when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();