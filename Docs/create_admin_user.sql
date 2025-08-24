-- Crear usuario administrador
-- =========================

-- Primero, crear el usuario en auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'admin@tesoros-choco.com',
  crypt('TesChoco2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}',
  '{"nombre_completo": "Administrador Tesoros Chocó"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Luego, crear el registro en la tabla users
INSERT INTO users (
  id,
  email,
  role,
  vendedor_estado,
  nombre_completo,
  bloqueado,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  au.email,
  'admin'::user_role,
  'aprobado'::vendedor_estado,
  'Administrador Tesoros Chocó',
  false,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'admin@tesoros-choco.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role,
  vendedor_estado = 'aprobado'::vendedor_estado,
  nombre_completo = 'Administrador Tesoros Chocó',
  bloqueado = false,
  updated_at = now();

-- Verificar que el usuario se creó correctamente
SELECT 
  u.id,
  u.email,
  u.role,
  u.vendedor_estado,
  u.nombre_completo,
  u.bloqueado,
  au.raw_app_meta_data
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@tesoros-choco.com';
