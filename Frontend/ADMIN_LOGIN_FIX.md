# 🔑 SOLUCIÓN PARA LOGIN DE ADMINISTRADOR

## Problema Identificado
El usuario administrador `quitojessy@gmail.com` no puede iniciar sesión aunque el usuario comprador sí funciona.

## Posibles Causas y Soluciones

### 1. Verificar la Contraseña ✅
- **Problema**: La contraseña puede haber cambiado o no ser la correcta
- **Solución**: Resetear la contraseña del administrador

### 2. Reset de Contraseña (RECOMENDADO) 🔄
Ejecuta este comando en la consola del navegador con la aplicación abierta:

```javascript
// Reset password para administrador
const resetPassword = async () => {
  const { data, error } = await window.supabase.auth.resetPasswordForEmail(
    'quitojessy@gmail.com',
    { redirectTo: window.location.origin + '/reset-password' }
  );
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Email de reset enviado');
  }
};

resetPassword();
```

### 3. Verificar Claims del JWT 🔍
Ejecuta este test después de cualquier login exitoso:

```javascript
// Test de autenticación de admin
const testAdminAuth = async () => {
  const { data, error } = await window.supabase.rpc('test_admin_auth');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Admin Auth Test:', data);
  }
};

testAdminAuth();
```

### 4. Crear Nuevo Usuario Administrador (ÚLTIMO RECURSO) 🆕
Si el reset no funciona, puedes crear un nuevo usuario admin:

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@tesoros-choco.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Luego crear el perfil
INSERT INTO public.users (id, email, role, vendedor_estado, nombre_completo)
SELECT 
  au.id,
  au.email,
  'admin',
  'aprobado',
  'Administrador Sistema'
FROM auth.users au
WHERE au.email = 'admin@tesoros-choco.com';
```

## Pasos Recomendados

1. **Primero**: Intenta el reset de contraseña con el script de la sección 2
2. **Segundo**: Revisa tu email y sigue el enlace de reset
3. **Tercero**: Intenta hacer login con la nueva contraseña
4. **Cuarto**: Ejecuta el test de la sección 3 para verificar que todo funciona

## Información Técnica
- ✅ Usuario administrador existe en la base de datos
- ✅ Email confirmado
- ✅ Políticas RLS configuradas correctamente
- ✅ JWT Claims actualizados
- ⚠️ Último login: 23 de agosto (puede indicar problema de contraseña)

## Si Nada Funciona
Contacta para ayuda adicional. El sistema está configurado correctamente, el problema es específico de autenticación.
